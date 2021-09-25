const { Telegraf, Markup } = require('telegraf');
require("dotenv").config();
const request = require('request');
 
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.launch().then(() => console.log("Bot launch"));

bot.start(async(ctx) => {
    ctx.reply("Добро пожаловать! Отправьте аудиозапись или голосовое сообщение для распознавания");
});

// Распознавание голосовых сообщений
bot.on("voice", async(ctx) => {
    try {
        const url = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        await getMusic(url.href, ctx);
    }
    catch(err) {
        console.log(err);
    }
});

// Распознавание аудиозаписи
bot.on("audio", async(ctx) => {
    const url = await ctx.telegram.getFileLink(ctx.message.audio.file_id);
    await getMusic(url.href, ctx);
})

async function getMusic(url, ctx) {
    request({
        uri: 'https://api.audd.io/',
        form: {
            'url': url,
            'return': 'apple_music,spotify',
            'api_token': process.env.AUDD_API_KEY
        },
        method: 'POST'
    }, function (err, res, body) {
        body = JSON.parse(body);
        let buttons = [];                   
        if (body.status == "success" && body.result) {
            if (body.result.hasOwnProperty("apple_music")) buttons.push(Markup.button.url('Apple Music', decodeURI(body.result.apple_music.url)));
            if (body.result.hasOwnProperty("spotify")) buttons.push(Markup.button.url('Spotify', decodeURI(body.result.spotify.external_urls.spotify)));
            ctx.reply(`Артист: ${body.result.artist}\nНазвание: ${body.result.title}\nАльбом: ${body.result.album}\nДата релиза: ${body.result.release_date}\n${decodeURI(body.result.song_link)}`, Markup.inlineKeyboard(buttons).resize());
        }
        else {
            return ctx.reply("Не распознано");
        }
    });
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

