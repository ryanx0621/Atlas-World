// ./events/crossGuildRelay.js
const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const MEM = path.join(__dirname, '..', 'memory');
const RELAY_FILE = path.join(MEM, 'relayChannels.json');
const BLACK_FILE = path.join(MEM, 'blacklist.json');
const PREVIEW = 80;
const DEDUPE_TTL = 1000 * 60 * 10;
const WEBHOOK_NAME = 'TSBOT 跨群用Webhook';
const COOLDOWN = 5000; // 5秒限速

function ensureFiles() {
  if (!fs.existsSync(MEM)) fs.mkdirSync(MEM, { recursive: true });
  if (!fs.existsSync(RELAY_FILE)) fs.writeFileSync(RELAY_FILE, JSON.stringify([], null, 2));
  if (!fs.existsSync(BLACK_FILE)) fs.writeFileSync(BLACK_FILE, JSON.stringify([], null, 2));
}
function loadChannels() { ensureFiles(); try { const j = JSON.parse(fs.readFileSync(RELAY_FILE, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } }
function saveChannels(arr) { ensureFiles(); try { fs.writeFileSync(RELAY_FILE, JSON.stringify(Array.from(new Set(arr)), null, 2)); } catch {} }
function loadBlack() { ensureFiles(); try { const j = JSON.parse(fs.readFileSync(BLACK_FILE, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } }
function truncate(s, n = PREVIEW) { if (!s) return ''; return s.length <= n ? s : s.slice(0, n - 3) + '...'; }
function makeMsgUrl(g, c, m) { return `https://discord.com/channels/${g}/${c}/${m}`; }

async function sanitizeAndSummarize(message) {
  let content = message.content || '';

  content = content.replace(/@everyone/g, '`@everyone`').replace(/@here/g, '`@here`');

  if (message.mentions && message.mentions.users) {
    for (const [id, user] of message.mentions.users) {
      let display = user.username;
      try {
        const member = (message.mentions.members && message.mentions.members.get(id)) ||
                       (message.guild ? await message.guild.members.fetch(id).catch(()=>null) : null);
        if (member && member.displayName) display = member.displayName;
      } catch (e) {}
      content = content.replace(new RegExp(`<@!?${id}>`, 'g'), `@${display}`);
    }
  }

  if (message.mentions && message.mentions.roles) {
    for (const [id, role] of message.mentions.roles) {
      content = content.replace(new RegExp(`<@&${id}>`, 'g'), `@${role.name}`);
    }
  }

  if (message.mentions && message.mentions.channels) {
    for (const [id, ch] of message.mentions.channels) {
      content = content.replace(new RegExp(`<#${id}>`, 'g'), `#${ch.name}`);
    }
  }

  let embedSummary = '';
  if (message.embeds && message.embeds.length > 0) {
    const parts = [];
    for (const e of message.embeds) {
      const t = e.title ? `${e.title}` : '';
      const d = e.description ? `${truncate(e.description.replace(/\n+/g, ' '), 160)}` : '';
      const url = e.url ? ` ${e.url}` : '';
      if (t || d) parts.push(`${t}${t && d ? ' — ' : ''}${d}${url}`.trim());
      else parts.push('💬 [嵌入訊息]');
    }
    embedSummary = parts.join('\n');
  }

  const final = [content.trim(), embedSummary].filter(Boolean).join('\n').trim();
  return final;
}

function classifyRef(msg) {
  if (!msg) return { label: '💬 [已刪除訊息]' };
  const hasAttachments = msg.attachments && msg.attachments.size > 0;
  if (hasAttachments) {
    let img = 0, file = 0;
    msg.attachments.forEach(att => {
      const name = (att.name || '').toLowerCase();
      const ct = att.contentType || '';
      const isImg = (ct && ct.startsWith('image')) || /\.(png|jpe?g|webp|gif|mp4|mov)$/i.test(name);
      if (isImg) img++; else file++;
    });
    if (img > 0 && file === 0) return { label: `🖼️ [圖片]×${img}` };
    if (file > 0 && img === 0) return { label: `📂 [檔案]×${file}` };
    return { label: `📂 [附件]×${msg.attachments.size}` };
  }
  if ((msg.embeds || []).length > 0) return { label: '💬 [嵌入訊息]' };
  const content = (msg.content || '').trim();
  if (content && /^[\p{Emoji}\s]+$/u.test(content) && content.length <= 12) return { label: content };
  const anim = content.match(/<a:[^:>]+:\d+>/);
  if (anim) return { label: anim[0] };
  return { label: `💬 [${truncate(content)}]` };
}

module.exports = (client) => {
  const recent = new Map();
  const cooldowns = new Map(); // 用戶限速記錄
  
  setInterval(() => {
    const now = Date.now();
    for (const [k, t] of recent.entries()) if (now - t > DEDUPE_TTL) recent.delete(k);
    for (const [k, t] of cooldowns.entries()) if (now - t > COOLDOWN) cooldowns.delete(k);
  }, 60 * 1000).unref();

  return async function onMessage(message) {
    try {
      if (!message || !message.guild) return;
      if (message.system) return;
      if (message.webhookId) return;
      if (message.author?.bot) return;

      try {
        const bl = loadBlack();
        if (bl.includes(message.author.id)) {
          await message.react('❌').catch(()=>null);
          return;
        }
      } catch (e) {}

      const channels = loadChannels();
      if (!channels || channels.length === 0) return;

      const src = message.channel.id;
      if (!channels.includes(src)) return;

      if (recent.has(message.id)) return;

      // 檢查限速
      const userKey = `${message.author.id}-${src}`;
      const now = Date.now();
      if (cooldowns.has(userKey)) {
        const timeLeft = cooldowns.get(userKey) - now;
        if (timeLeft > 0) {
          await message.react('❌').catch(()=>null);
          return;
        }
      }

      recent.set(message.id, now);
      cooldowns.set(userKey, now + COOLDOWN);

      const targets = channels.filter(id => id !== src);
      if (!targets.length) return;

      // 倒數反應：顯示後移除，再顯示下一個
      const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '✅'];
      (async () => {
        for (let i = 0; i < reactions.length; i++) {
          await message.react(reactions[i]).catch(()=>null);
          await new Promise(r => setTimeout(r, 1000));
          if (i < reactions.length - 1) {
            await message.reactions.cache.get(reactions[i])?.remove().catch(()=>null);
          }
        }
        // ✅ 過 2 秒後移除
        setTimeout(async () => {
          await message.reactions.cache.get('✅')?.remove().catch(()=>null);
        }, 2000);
      })();

      const contentOnly = await sanitizeAndSummarize(message);

      const files = [];
      if (message.attachments && message.attachments.size > 0) {
        for (const att of message.attachments.values()) {
          try {
            files.push({ attachment: att.url, name: att.name || 'file' });
          } catch (e) {}
        }
      }

      if (message.embeds && message.embeds.length > 0) {
        for (const e of message.embeds) {
          try {
            const imgUrl = e.image?.url || e.thumbnail?.url || e.video?.url || null;
            if (imgUrl) {
              try {
                const parsedUrl = new URL(imgUrl);
                const name = path.basename(parsedUrl.pathname) || 'embed_media';
                files.push({ attachment: imgUrl, name });
              } catch (urlErr) {}
            }
          } catch (ee) {}
        }
      }

      let components = [];
      if (message.reference && message.reference.messageId) {
        let refMsg = null;
        try { refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(()=>null); } catch (e) {}
        const info = classifyRef(refMsg);
        const label = info.label.length > 80 ? truncate(info.label, 80) : info.label;
        const url = makeMsgUrl(message.guild.id, message.channel.id, message.reference.messageId);
        components = [ new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url)) ];
      }

      const allowedMentions = { parse: [], repliedUser: false };
      const username = `[${message.member?.displayName || message.author.username}]`;
      const avatarURL = message.author.displayAvatarURL({ forceStatic: false });

      for (const tid of targets) {
        try {
          const ch = await client.channels.fetch(tid).catch(()=>null);
          if (!ch || !ch.fetchWebhooks) continue;

          let wh = null;
          try {
            const whs = await ch.fetchWebhooks().catch(()=>null);
            if (whs) wh = whs.find(w => w.name === WEBHOOK_NAME && w.owner && w.owner.id === client.user.id) || whs.find(w => w.owner && w.owner.id === client.user.id);
          } catch (e) {}

          if (!wh) {
            const perms = ch.permissionsFor ? ch.permissionsFor(client.user) : null;
            if (!perms || !perms.has('ManageWebhooks')) continue;
            try {
              await ch.fetchWebhooks().then(hs => {
                hs.forEach(w => { if ((w.name === WEBHOOK_NAME || (w.owner && w.owner.id === client.user.id)) && w.owner && w.owner.id === client.user.id) w.delete().catch(()=>null); });
              }).catch(()=>null);
              wh = await ch.createWebhook({ name: WEBHOOK_NAME, avatar: client.user.displayAvatarURL({ forceStatic: false }) });
            } catch (e) { continue; }
          }

          const payload = {
            content: contentOnly || undefined,
            username,
            avatarURL,
            files: files.length ? files : undefined,
            components: components.length ? components : undefined,
            allowedMentions
          };

          try {
            await wh.send(payload);
          } catch (e) {
            try {
              await ch.fetchWebhooks().then(hs => { hs.forEach(w => { if ((w.name === WEBHOOK_NAME || (w.owner && w.owner.id === client.user.id)) && w.owner && w.owner.id === client.user.id) w.delete().catch(()=>null); }); }).catch(()=>null);
              const newWh = await ch.createWebhook({ name: WEBHOOK_NAME, avatar: client.user.displayAvatarURL({ forceStatic: false }) });
              await newWh.send(payload);
            } catch (e2) {}
          }

        } catch (perr) {}
      }

    } catch (err) {}
  };
};