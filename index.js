require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionsBitField
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

if (!TOKEN || !CLIENT_ID || !GUILD_ID || !CHANNEL_ID) {
  console.error("❌ Variables manquantes dans Railway : TOKEN, CLIENT_ID, GUILD_ID ou CHANNEL_ID");
  process.exit(1);
}

const SEASONS = {
  hiver: {
    label: "❄️ Hiver",
    sunrise: "08:00",
    sunset: "17:30"
  },
  printemps: {
    label: "🌸 Printemps",
    sunrise: "06:30",
    sunset: "20:00"
  },
  ete: {
    label: "☀️ Été",
    sunrise: "06:00",
    sunset: "21:00"
  },
  automne: {
    label: "🍂 Automne",
    sunrise: "07:00",
    sunset: "18:30"
  }
};

function getSeason() {
  const month = new Date().getMonth() + 1;

  if ([12, 1, 2].includes(month)) return "hiver";
  if ([3, 4, 5].includes(month)) return "printemps";
  if ([6, 7, 8].includes(month)) return "ete";
  return "automne";
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getFranceDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}

function getFranceMinutes() {
  const d = getFranceDate();
  return d.getHours() * 60 + d.getMinutes();
}

function getPeriod() {
  const season = getSeason();
  const now = getFranceMinutes();

  const sunrise = timeToMinutes(SEASONS[season].sunrise);
  const sunset = timeToMinutes(SEASONS[season].sunset);

  if (now >= sunrise && now < sunrise + 30) return "lever";
  if (now >= sunrise + 30 && now < 12 * 60) return "matin";
  if (now >= 12 * 60 && now < sunset - 30) return "jour";
  if (now >= sunset - 30 && now < sunset + 30) return "coucher";

  return "nuit";
}

function randomImage(period, weather) {
  const n = Math.floor(Math.random() * 3) + 1;
  return `./images/${period}/${weather}${n}.jpg`;
}

const weatherTexts = {
  soleil: {
    title: "Temps ensoleillé",
    texts: [
      "Le ciel est dégagé et la lumière baigne San Euphoria.",
      "Une belle clarté s’installe sur la ville, offrant une ambiance agréable.",
      "Le soleil domine la météo du moment sur San Euphoria."
    ],
    tips: [
      "Parfait pour vos scènes en extérieur.",
      "Idéal pour les déplacements et événements RP.",
      "Profitez d’une ambiance lumineuse en ville."
    ],
    color: "#FFD700"
  },
  gris: {
    title: "Ciel grisâtre",
    texts: [
      "Un ciel gris recouvre San Euphoria, donnant une ambiance plus calme.",
      "La lumière se fait plus douce sous une couverture nuageuse.",
      "L’atmosphère devient plus posée avec ce temps couvert."
    ],
    tips: [
      "Parfait pour des scènes urbaines plus réalistes.",
      "Ambiance idéale pour un RP calme.",
      "Le ciel couvert donne un ton plus sérieux à la ville."
    ],
    color: "#7F8C8D"
  },
  pluie: {
    title: "Pluie sur la ville",
    texts: [
      "La pluie s’installe sur San Euphoria et rafraîchit les rues.",
      "Les routes deviennent humides sous une pluie régulière.",
      "Une ambiance plus sombre accompagne cette météo pluvieuse."
    ],
    tips: [
      "Adaptez vos scènes aux routes glissantes.",
      "Parfait pour des scènes dramatiques ou calmes.",
      "Pensez à ralentir vos déplacements RP."
    ],
    color: "#4A90E2"
  },
  brouillard: {
    title: "Brouillard matinal",
    texts: [
      "Un brouillard dense recouvre doucement San Euphoria.",
      "La visibilité baisse fortement dans les rues de la ville.",
      "La brume matinale donne une ambiance mystérieuse."
    ],
    tips: [
      "Idéal pour des scènes discrètes ou tendues.",
      "La visibilité est réduite, soyez prudents.",
      "Parfait pour créer une ambiance mystérieuse."
    ],
    color: "#95A5A6"
  },
  clair: {
    title: "Nuit claire",
    texts: [
      "La nuit est calme et le ciel reste dégagé sur San Euphoria.",
      "Les lumières de la ville prennent le relais sous un ciel paisible.",
      "Une ambiance nocturne douce s’installe sur la ville."
    ],
    tips: [
      "Parfait pour des scènes nocturnes tranquilles.",
      "Idéal pour des sorties RP en ville.",
      "Profitez d’une nuit calme et élégante."
    ],
    color: "#2C3E50"
  }
};

function getWeightedWeather(period, season) {
  if (period === "lever") {
    return ["soleil", "soleil", "gris", "pluie"];
  }

  if (period === "matin") {
    if (season === "ete") return ["soleil", "soleil", "soleil", "gris", "pluie"];
    if (season === "automne") return ["gris", "pluie", "brouillard", "brouillard", "soleil"];
    if (season === "hiver") return ["gris", "pluie", "brouillard", "soleil"];
    return ["soleil", "gris", "pluie", "brouillard"];
  }

  if (period === "jour") {
    if (season === "ete") return ["soleil", "soleil", "soleil", "gris", "pluie"];
    if (season === "automne") return ["gris", "pluie", "pluie", "soleil"];
    if (season === "hiver") return ["gris", "pluie", "soleil"];
    return ["soleil", "gris", "pluie"];
  }

  if (period === "coucher") {
    return ["soleil", "soleil", "gris", "pluie"];
  }

  return ["clair", "clair", "gris", "pluie"];
}

function createWeatherEmbed(period, weatherKey, specialTitle = null) {
  const season = getSeason();
  const seasonLabel = SEASONS[season].label;
  const data = weatherTexts[weatherKey];

  const imgPath = randomImage(period, weatherKey);
  const weatherFile = new AttachmentBuilder(imgPath);
  const lunaFile = new AttachmentBuilder("./images/luna.png");

  const text = data.texts[Math.floor(Math.random() * data.texts.length)];
  const tip = data.tips[Math.floor(Math.random() * data.tips.length)];

  const periodLabels = {
    lever: "🌅 Lever du soleil",
    matin: "🌄 Matin",
    jour: "☀️ Journée",
    coucher: "🌇 Coucher du soleil",
    nuit: "🌙 Nuit"
  };

  const embed = new EmbedBuilder()
    .setTitle(specialTitle || "🌴📺 MISS MÉTÉO — SAN EUPHORIA")
    .setDescription(
      `👩 Ici **Luna Reyes**, en direct de San Euphoria.\n\n` +
      `📅 **Saison :** ${seasonLabel}\n` +
      `🕒 **Période :** ${periodLabels[period]}\n\n` +
      `${text}\n\n` +
      `💡 **Conseil RP :** ${tip}`
    )
    .setColor(data.color)
    .setThumbnail("attachment://luna.png")
    .setImage(`attachment://${imgPath.split('/').pop()}`)
    .setFooter({ text: "San Euphoria Weather System" })
    .setTimestamp();

  return {
    embed,
    files: [weatherFile, lunaFile]
  };
}

const commands = [
  new SlashCommandBuilder()
    .setName('forcemeteo')
    .setDescription('Forcer une météo RP')
    .addStringOption(opt =>
      opt.setName('periode')
        .setDescription('Choisir la période')
        .setRequired(true)
        .addChoices(
          { name: 'Lever', value: 'lever' },
          { name: 'Matin', value: 'matin' },
          { name: 'Journée', value: 'jour' },
          { name: 'Coucher', value: 'coucher' },
          { name: 'Nuit', value: 'nuit' }
        )
    )
    .addStringOption(opt =>
      opt.setName('meteo')
        .setDescription('Choisir la météo')
        .setRequired(true)
        .addChoices(
          { name: 'Soleil', value: 'soleil' },
          { name: 'Gris', value: 'gris' },
          { name: 'Pluie', value: 'pluie' },
          { name: 'Brouillard', value: 'brouillard' },
          { name: 'Clair nuit', value: 'clair' }
        )
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Commandes enregistrées");
})();

async function sendAutoWeather() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  const period = getPeriod();
  const season = getSeason();
  const pool = getWeightedWeather(period, season);
  const weatherKey = pool[Math.floor(Math.random() * pool.length)];

  const { embed, files } = createWeatherEmbed(period, weatherKey);

  await channel.send({ embeds: [embed], files });

  const delay = (120 + Math.floor(Math.random() * 61)) * 60 * 1000;
  setTimeout(sendAutoWeather, delay);
}

let lastSunriseAnnouncement = null;
let lastSunsetAnnouncement = null;

async function checkSunAnnouncements() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  const nowDate = getFranceDate();
  const today = nowDate.toISOString().split("T")[0];

  const season = getSeason();
  const now = getFranceMinutes();

  const sunrise = timeToMinutes(SEASONS[season].sunrise);
  const sunset = timeToMinutes(SEASONS[season].sunset);

  if (now === sunrise && lastSunriseAnnouncement !== today) {
    lastSunriseAnnouncement = today;

    const { embed, files } = createWeatherEmbed(
      "lever",
      "soleil",
      "🌅 LEVER DU SOLEIL — SAN EUPHORIA"
    );

    await channel.send({ embeds: [embed], files });
  }

  if (now === sunset && lastSunsetAnnouncement !== today) {
    lastSunsetAnnouncement = today;

    const { embed, files } = createWeatherEmbed(
      "coucher",
      "soleil",
      "🌇 COUCHER DU SOLEIL — SAN EUPHORIA"
    );

    await channel.send({ embeds: [embed], files });
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'forcemeteo') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ Commande réservée aux admins.",
        ephemeral: true
      });
    }

    const period = interaction.options.getString('periode');
    const weatherKey = interaction.options.getString('meteo');

    const allowed = getWeightedWeather(period, getSeason());

    if (!allowed.includes(weatherKey)) {
      return interaction.reply({
        content: "❌ Cette météo n’est pas disponible pour cette période.",
        ephemeral: true
      });
    }

    const { embed, files } = createWeatherEmbed(period, weatherKey);
    const channel = await client.channels.fetch(CHANNEL_ID);

    await channel.send({ embeds: [embed], files });

    return interaction.reply({
      content: "✅ Météo forcée envoyée.",
      ephemeral: true
    });
  }
});

client.once('ready', () => {
  console.log(`🤖 Connecté en ${client.user.tag}`);

  sendAutoWeather();

  setInterval(checkSunAnnouncements, 60 * 1000);
});

client.login(TOKEN);