// commands/weather.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 載入城市別名
const cityAliases = require('../lib/cityAliases');

function loadApiKey() {
  try {
    const cfgPath = path.resolve(__dirname, '../apikeyconfig.json');
    if (!fs.existsSync(cfgPath)) {
      throw new Error('找不到 ../apikeyconfig.json，請建立並加入 WEATHER_API 欄位');
    }
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8') || '{}');
    if (!cfg.WEATHER_API) throw new Error('apikeyconfig.json 內缺少 WEATHER_API 欄位');
    return cfg.WEATHER_API;
  } catch (e) {
    throw new Error(`載入 API Key 失敗：${e.message}`);
  }
}

function round2(v) {
  if (typeof v !== 'number') return v;
  return Math.round(v * 100) / 100;
}

function weatherEmoji(conditionText) {
  const text = String(conditionText || '').toLowerCase();
  if (text.includes('thunder') || text.includes('雷')) return '⛈️';
  if (text.includes('rain') || text.includes('下雨') || text.includes('雨')) return '🌧️';
  if ((text.includes('cloud') && text.includes('sun')) || text.includes('晴時多雲') ) return '🌤️';
  if (text.includes('cloud') || text.includes('雲')) return '☁️';
  if (text.includes('sun') || text.includes('晴') || text.includes('clear')) return '☀️';
  return '🌈';
}

// 使用城市別名表解析
function resolveQueryToQ(raw) {
  if (!raw) return raw;
  const s = raw.trim().toLowerCase();
  if (cityAliases[s]) return cityAliases[s];
  return raw; // 若沒有別名，使用原輸入
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-當前天氣')
    .setDescription('查詢指定地區或城市的當前天氣（支援中文或英文）')
    .setDMPermission(true)
    .addStringOption(option =>
      option.setName('地區')
        .setDescription('輸入地區或城市名稱（英文或中文，或直接經緯度）')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    let apiKey;
    try {
      apiKey = loadApiKey();
    } catch (e) {
      return interaction.editReply({ content: `❌ 無法載入 WeatherAPI Key：${e.message}` });
    }

    const rawQuery = interaction.options.getString('地區').trim();
    const qParam = resolveQueryToQ(rawQuery);
    const encodedQ = encodeURIComponent(qParam);

    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodedQ}&days=1&aqi=yes&alerts=no`;
      const res = await fetch(url);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`WeatherAPI 回傳非 JSON：${text}`);
      }

      if (!res.ok) {
        throw new Error(`WeatherAPI 錯誤：${res.status} ${JSON.stringify(data)}`);
      }

      const location = data.location;
      const current = data.current;
      const forecast = data.forecast && data.forecast.forecastday && data.forecast.forecastday[0];
      const aqi = current.air_quality || {};

      const hours = (forecast?.hour || []).map(h => ({
        time: (h.time || '').split(' ')[1] || (h.time || ''),
        temp: round2(h.temp_c),
        emoji: weatherEmoji(h.condition?.text || '')
      }));

      const times = hours.map(h => `${h.time} ${h.emoji}`);
      const temps = hours.map(h => h.temp);

      const chartConfig = {
        type: 'line',
        data: {
          labels: times.length ? times : [],
          datasets: [{
            label: '溫度 (°C)',
            data: temps.length ? temps : [],
            borderColor: '#0033cc',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#0033cc',
            fill: false,
            tension: 0.25
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          },
          scales: {
            x: {
              title: { display: true, text: '時間' },
              ticks: { maxRotation: 90, minRotation: 0 }
            },
            y: {
              title: { display: true, text: '溫度 (°C)' },
              beginAtZero: false
            }
          }
        }
      };

      const chartUrl = times.length ? `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}` : null;

      const embed = new EmbedBuilder()
        .setTitle(`${weatherEmoji(current.condition?.text)} ${location.name}, ${location.country} - 天氣資訊`)
        .setDescription(`🕒 當地時間：${location.localtime}`)
        .setColor(0x1e90ff)
        .setTimestamp();

      embed.addFields(
        { name: '🌡️ 溫度', value: `${round2(current.temp_c).toFixed(2)} °C`, inline: true },
        { name: '🤒 體感溫度', value: `${round2(current.feelslike_c).toFixed(2)} °C`, inline: true },
        { name: '💧 濕度', value: `${round2(current.humidity).toFixed(2)} %`, inline: true },
        { name: '🌬️ 風速', value: `${round2(current.wind_kph).toFixed(2)} km/h`, inline: true },
        { name: '💨 風向', value: `${current.wind_dir || 'N/A'}`, inline: true },
        { name: '☀️ 紫外線 (UV)', value: `${round2(current.uv).toFixed(2)}`, inline: true },
        { name: '👁️ 能見度', value: `${round2(current.vis_km).toFixed(2)} km`, inline: true },
        { name: '🔴 氣壓', value: `${round2(current.pressure_mb).toFixed(2)} mb`, inline: true },
        { name: '🌧️ 降雨機率 (今天)', value: `${forecast?.day?.daily_chance_of_rain ?? 'N/A'} %`, inline: true },
        { name: '❄️ 降雪機率 (今天)', value: `${forecast?.day?.daily_chance_of_snow ?? 'N/A'} %`, inline: true },
        { name: '🏭 空氣品質 (US EPA Index)', value: `${aqi['us-epa-index'] ?? 'N/A'}`, inline: true },
        { name: '🌀 天氣狀態', value: `${weatherEmoji(current.condition?.text)} ${current.condition?.text || 'N/A'}`, inline: true },
        { name: '🌅 日出', value: `${forecast?.astro?.sunrise ?? 'N/A'}`, inline: true },
        { name: '🌇 日落', value: `${forecast?.astro?.sunset ?? 'N/A'}`, inline: true },
        { name: '📈 今日最高', value: `${forecast ? round2(forecast.day.maxtemp_c).toFixed(2) + ' °C' : 'N/A'}`, inline: true },
        { name: '📉 今日最低', value: `${forecast ? round2(forecast.day.mintemp_c).toFixed(2) + ' °C' : 'N/A'}`, inline: true }
      );

      if (current.condition?.icon) {
        const iconUrl = current.condition.icon.startsWith('//') ? `https:${current.condition.icon}` : current.condition.icon;
        embed.setThumbnail(iconUrl);
      }

      if (chartUrl) embed.setImage(chartUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[weather] error:', err);
      await interaction.editReply({ content: `❌ 查詢失敗：${err.message}` });
    }
  }
};