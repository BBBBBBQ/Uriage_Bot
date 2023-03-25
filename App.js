const axios = require('axios')
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const app = express();

const solanaWeb3 = require('@solana/web3.js');
const url = solanaWeb3.clusterApiUrl('mainnet-beta');
const solanaConnection = new solanaWeb3.Connection(url, 'confirmed');

require('dotenv').config()
const APPLICATION_ID = process.env.APPLICATION_ID;
const TOKEN = process.env.TOKEN;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const GUILD_ID = process.env.GUILD_ID;
const BOT_Webhook_Url = process.env.BOT_Webhook_Url;

let ArtName = "";
let price = "";
let dateString = "";
let picture = "";
let sign = "";
let purWal = "";
let selWal = "";
let market = "";

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

app.get('/', async (req,res) =>{
  return res.send('Follow documentation ')
})

app.listen(8999, () => {
  console.log(`Example server listening on port 8999`)
})

//FROM HE
app.use(express.json())

app.post("/discord", async (req, res) => {
  console.log(req.body[0]);
  await getData2Embed(req.body[0]);
  await axios.post(BOT_Webhook_Url,
    {
      //"content": 'Hello everyone! Here is an important announcement:',
      "embeds": [
        {
          "title": ArtName,
          "url": `https://explorer.solana.com/tx/${sign}`,
          "description":  "",
          //"description": 'This is the [description](https://example.com) with a hyperlink.'
          "fields": [
            {
              "name": "",
              "value": `Congrats ${purWal} on the purchase🎉`,
              "inline": false
            },
            {
                "name": "Price",
                "value": `${price} SOL`,
                "inline": true
            },
            {
                "name": "Seller",
                "value": `${selWal}`,
                "inline": true
            },
            {
                "name": "Market",
                "value": market,
                //"value": `https://explorer.solana.com/tx/${sign}`
                "inline": true
            }
          ],
          "image": {
                "url": picture,
          },
          footer: {
            text: `Posted on ${dateString}`, // Add the date to the footer
          }
        }
      ]
    }
  )
})

function getData2Embed(data) {
  const nftEvent = data.events.nft;
  const tokenTransfer = data.tokenTransfers[0];

  const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('NFT Sale: Fox #' + data.events.nft.nfts[0].id)
    .setDescription(data.description)
    .setThumbnail('https://example.com/thumbnail.png') // サムネイル画像のURLを適切なものに変更してください。
    .addFields(
      { name: 'Seller', value: nftEvent.seller, inline: true },
      { name: 'Buyer', value: nftEvent.buyer, inline: true },
      { name: 'Sale Price', value: `${nftEvent.amount / 1e9} SOL`, inline: true },
      { name: 'Fee', value: `${nftEvent.fee / 1e9} SOL`, inline: true },
      { name: 'Marketplace', value: data.source, inline: true },
      { name: 'Timestamp', value: new Date(nftEvent.timestamp * 1000).toISOString(), inline: true },
      { name: 'Token Transfer', value: `From: ${tokenTransfer.fromUserAccount}\nTo: ${tokenTransfer.toUserAccount}\nAmount: ${tokenTransfer.tokenAmount}\nToken Type: ${tokenTransfer.tokenStandard}`, inline: false }
    )
    .setTimestamp()
    .setFooter('NFT Marketplace Bot');

  return embed;
}


const getMetadataME = async (tokenPubKey) => {
    try {
        const { data } = await axios.get('https://api-mainnet.magiceden.dev/v2/tokens/' + tokenPubKey);
        return data;
    } catch (error) {
        console.log("error fetching MEmetadata: ", error)
    }
}


//コマンドの設定
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name)
    if(interaction.data.name == 'yo'){
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `やあ！ ${interaction.member.user.username}!　調子はどうだい？`,
        },
      });
    }

    if(interaction.data.name == 'rex'){
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `ワン！　あそぶ？`,
        },
      });
    }

    if(interaction.data.name == 'dm'){
      // https://discord.com/developers/docs/resources/user#create-dm
      let c = (await discord_api.post(`/users/@me/channels`,{
        recipient_id: interaction.member.user.id
      })).data
      try{
        // https://discord.com/developers/docs/resources/channel#create-message
        let res = await discord_api.post(`/channels/${c.id}/messages`,{
          content:'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
        })
        console.log(res.data)
      }catch(e){
        console.log(e)
      }

      return res.send({
        // https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data:{
          content:'👍'
        }
      });
    }
  }

});

//コマンドの登録
app.get('/register_commands', async (req,res) =>{
  let slash_commands = [
    {
      "name": "yo",
      "description": "replies with Yo!",
      "options": []
    },
    {
      "name": "rex",
      "description": "replies from namehage Dog",
      "options": []
    },
    {
      "name": "dm",
      "description": "sends user a DM",
      "options": []
    }
  ]
  try
  {
    // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
    let discord_response = await discord_api.put(
      `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      slash_commands
    )
    console.log(discord_response.data)
    return res.send('commands have been registered')
  }catch(e){
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} error from discord`)
  }
})