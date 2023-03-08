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

const getData2Embed = async(txn) => {
  try {
      let Mkey = await solanaConnection.getTransaction(txn.signature);
      //ミントアドレスを変数に代入
      const mintAD = Mkey.meta.postTokenBalances[0].mint
      //MEからメタデータ入手
      metadata = await getMetadataME(mintAD);
      //入手した情報を変数に代入
      sign = txn.signature
      ArtName = metadata.name
      price = Math.abs((Mkey.meta.preBalances[0] - Mkey.meta.postBalances[0])) / solanaWeb3.LAMPORTS_PER_SOL;
      //dateString = new Date(txn.timestamp * 1000).toLocaleString();
      dateString = new Date().toLocaleString();
      picture = metadata.image

      purWal = txn.buyer
      selWal = txn.seller
      market = txn.source
      console.log("PA ;" + purWal + " SE ;" + selWal + " MA ;" + market);
      console.log(`New Sales Updated: ${ArtName}`);
  } catch (e) {
      console.log("error while going through Podt to Discord: ", e);
    }
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