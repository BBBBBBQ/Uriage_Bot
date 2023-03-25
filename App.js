const axios = require('axios')
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const app = express();
const Discord = require('discord.js');

require('dotenv').config()
const TOKEN = process.env.TOKEN;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const GUILD_ID = process.env.GUILD_ID;
const BOT_Webhook_Url = process.env.BOT_Webhook_Url;

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Authorization",
    "Authorization": `Bot ${TOKEN}`
  }
});

app.get('/', async (req, res) => {
  return res.send('Follow documentation ')
});

app.listen(8999, () => {
  console.log(`Example server listening on port 8999`);
});

app.use(express.json());

app.post("/discord", async (req, res) => {
  const embed = await getData2Embed(req.body[0]);
  await axios.post(BOT_Webhook_Url, { "embeds": [embed] });
});

function getData2Embed(data) {
  const nftEvent = data.events.nft;
  const ArtName = nftEvent.nfts[0].name;
  const sign = data.signature;
  const purWal = nftEvent.buyer;
  const selWal = nftEvent.seller;
  const price = nftEvent.amount / 1e9;
  const dateString = new Date(nftEvent.timestamp * 1000).toISOString();
  const picture = "https://example.com/thumbnail.png"; // サムネイル画像のURLを適切なものに変更してください。
  const market = data.source;

  const embed = new Discord.MessageEmbed()
    .setTitle(ArtName)
    .setURL(`https://explorer.solana.com/tx/${sign}`)
    .setDescription("")
    .addFields(
      { name: "\u200B", value: `Congrats ${purWal} on the purchase🎉`, inline: false },
      { name: "Price", value: `${price} SOL`, inline: true },
      { name: "Seller", value: `${selWal}`, inline: true },
      { name: "Market", value: market, inline: true }
    )
    .setImage(picture)
    .setFooter(`Posted on ${dateString}`);

  return embed;
}
