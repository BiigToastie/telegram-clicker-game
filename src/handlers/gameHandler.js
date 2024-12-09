const { gameConfig, serverConfig } = require('../config/botConfig');

function handleInlineQuery(bot, query) {
    bot.answerInlineQuery(query.id, [{
        type: 'game',
        id: '1',
        game_short_name: gameConfig.shortName,
        title: gameConfig.title,
        description: gameConfig.description,
        reply_markup: {
            inline_keyboard: [[
                { text: gameConfig.buttonText, callback_game: gameConfig.shortName }
            ]]
        }
    }], { cache_time: 0 });
}

function handleCallbackQuery(bot, query) {
    if (query.game_short_name === gameConfig.shortName) {
        const gameUrl = serverConfig.getGameUrl(query);
        bot.answerCallbackQuery(query.id, {
            url: gameUrl,
            cache_time: 0
        }).catch(error => {
            console.error('Error answering callback query:', error);
            bot.answerCallbackQuery(query.id, {
                text: 'Error starting game. Please try again.',
                show_alert: true
            });
        });
    }
}

async function handleMessage(bot, msg) {
    try {
        const chatId = msg.chat.id;
        const inlineKeyboard = {
            inline_keyboard: [[
                { text: gameConfig.buttonText, callback_game: gameConfig.shortName }
            ]]
        };
        
        await bot.sendGame(chatId, gameConfig.shortName, {
            reply_markup: inlineKeyboard,
            protect_content: true
        });
    } catch (error) {
        console.error('Error sending game button:', error);
        await bot.sendMessage(msg.chat.id, 'Error starting game. Please try again.');
    }
}

module.exports = {
    handleInlineQuery,
    handleCallbackQuery,
    handleMessage
};