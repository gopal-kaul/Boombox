require("dotenv").config();
const { Client, Intents } = require("discord.js");
const ytpl = require("ytpl");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILDS,
  ],
});
const CHANNEL = process.env.CHANNEL;
const TOKEN = process.env.TOKEN;
const ytdl = require("youtube-dl-exec");
const {
  joinVoiceChannel,
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  createAudioResource,
  AudioPlayerState,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const voice_1 = require("@discordjs/voice");
if (!TOKEN) {
  console.error("Press provide a valid Discord Bot Token.");
  return process.exit(1);
} else if (!CHANNEL || Number(CHANNEL) == NaN) {
  console.log("Please provide a valid channel ID.");
  return process.exit(1);
}
const player = createAudioPlayer();
async function playSong(url) {
  var process = ytdl.raw(
    url,
    {
      o: "-",
      q: "",
      f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
      r: "100K",
    },
    { stdio: ["ignore", "pipe", "ignore"] }
  );
  if (!process.stdout) {
    reject(new Error("No stdout"));
    return;
  }
  const resource = createAudioResource(process.stdout);

  player.play(resource);
  return entersState(player, AudioPlayerStatus.Playing, 10e3);
}

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10e3);
    await channel.guild.me.voice.setSuppressed(false);
    await channel.setTopic(`Lo-Fi Music`);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

client.on("ready", async () => {
  client.user.setPresence({
    activities: [{ name: "Lo-Fi Music", type: "STREAMING" }],
  });
  let channel =
    client.channels.cache.get(CHANNEL) ||
    (await client.channels.fetch(CHANNEL));

  if (!channel) {
    console.error(
      "The provided channel ID doesn't exist, or I don't have permission to view that channel. Because of that, I'm aborting now."
    );
    return process.exit(1);
  } else if (!(channel.type == "voice" || channel.type == "stage")) {
    console.error(
      "The provided channel ID is neither stage channel Nor A Voice Channel. Because of that, I'm aborting now."
    );
    return process.exit(1);
  }
  const playlist = await ytpl(process.env.PLAYLIST).then(res=>res.items);
  const LINKS = [];
  for(let i = 0; i< playlist.length; ++i){
    LINKS.push(playlist[i].shortUrl);
  }
  const random = LINKS[Math.floor(Math.random() * LINKS.length)];
  const connection = await connectToChannel(channel);
  await connection.subscribe(player);
  await playSong(random);

  player.on(AudioPlayerStatus.Idle, async () => {
    const random = LINKS[Math.floor(Math.random() * LINKS.length)];
    await playSong(random);
  });

  const voiceConnection = getVoiceConnection(channel.guild.id);
  voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
    const random = LINKS[Math.floor(Math.random() * LINKS.length)];
    const conne = await connectToChannel(channel);
    await conne.subscribe(player);
    await playSong(random);
  });
});

client.login(TOKEN); // To Login
console.log("Logged in Successfully"); // Logged in successfully
process.on("unhandledRejection", console.error);
