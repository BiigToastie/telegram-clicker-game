const { createGameKeyboard, createShopKeyboard } = require('./keyboard');

async function handleClick(bot, chatId, gameState) {
    gameState.coins += gameState.clickMultiplier;
    
    try {
        await bot.editMessageText(
            `🪙 Coins: ${gameState.coins.toFixed(1)}\n💰 Pro Klick: ${gameState.clickMultiplier.toFixed(1)}`,
            {
                chat_id: chatId,
                message_id: gameState.lastMessageId,
                reply_markup: createGameKeyboard().reply_markup
            }
        );
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Nachricht:', error);
    }
}

async function handleShop(bot, chatId, gameState) {
    try {
        await bot.editMessageText(
            `🛍 Shop\n\n💰 Multiplier Upgrade (Kosten: ${gameState.upgrades.multiplier.cost} Coins)`,
            {
                chat_id: chatId,
                message_id: gameState.lastMessageId,
                reply_markup: createShopKeyboard().reply_markup
            }
        );
    } catch (error) {
        console.error('Fehler beim Öffnen des Shops:', error);
    }
}

async function handleBuyUpgrade(bot, chatId, gameState) {
    if (gameState.coins >= gameState.upgrades.multiplier.cost) {
        gameState.coins -= gameState.upgrades.multiplier.cost;
        gameState.clickMultiplier += gameState.upgrades.multiplier.increment;
        gameState.upgrades.multiplier.cost *= 1.5;
        
        try {
            await bot.editMessageText(
                `🪙 Coins: ${gameState.coins.toFixed(1)}\n💰 Pro Klick: ${gameState.clickMultiplier.toFixed(1)}`,
                {
                    chat_id: chatId,
                    message_id: gameState.lastMessageId,
                    reply_markup: createGameKeyboard().reply_markup
                }
            );
        } catch (error) {
            console.error('Fehler beim Kauf des Upgrades:', error);
        }
    } else {
        await bot.answerCallbackQuery(query.id, {
            text: '❌ Nicht genug Coins!',
            show_alert: true
        });
    }
}

module.exports = { handleClick, handleShop, handleBuyUpgrade };