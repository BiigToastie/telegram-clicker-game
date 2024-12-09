const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
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