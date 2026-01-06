module.exports = (template, member, guild) => {
  const now = new Date();
  const time = now.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });

  return template
    .replace(/{member}/g, `<@${member.user.id}>`)
    .replace(/{guild}/g, member.guild.name)
    .replace(/{time}/g, time);
};