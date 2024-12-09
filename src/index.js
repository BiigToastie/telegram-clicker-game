const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { gameState } = require('./gameState');
const { handleClick, handleShop, handleBuyUpgrade } = require('./handlers');
const { createGameKeyboard } = require('./keyboard');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: true
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Basis-Route für die Web-App
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Bot-Befehle
bot.onText(/\/start/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const sentMessage = await bot.sendMessage(
            chatId,
            `🎮 Willkommen beim Clicker Game!\n\n🪙 Coins: ${gameState.coins.toFixed(1)}\n💰 Pro Klick: ${gameState.clickMultiplier.toFixed(1)}`,
            createGameKeyboard()
        );
        gameState.lastMessageId = sentMessage.message_id;
    } catch (error) {
        console.error('Start-Befehl Fehler:', error);
    }
});

// Callback Handler
bot.on('callback_query', async (query) => {
    try {
        const chatId = query.message.chat.id;
        
        switch (query.data) {
            case 'click':
                await handleClick(bot, chatId, gameState);
                break;
            case 'shop':
                await handleShop(bot, chatId, gameState);
                break;
            case 'buy_multiplier':
                await handleBuyUpgrade(bot, chatId, gameState, query);
                break;
            case 'back':
                await handleClick(bot, chatId, gameState); // Zurück zum Hauptbildschirm
                break;
        }
        
        await bot.answerCallbackQuery(query.id);
    } catch (error) {
        console.error('Callback Fehler:', error);
    }
});

// Server starten
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
    console.log('Bot ist aktiv...');
});

// Ping-Test für den Bot
bot.getMe().then((botInfo) => {
    console.log('Bot erfolgreich verbunden:', botInfo.username);
}).catch((error) => {
    console.error('Fehler bei Bot-Verbindung:', error);
});