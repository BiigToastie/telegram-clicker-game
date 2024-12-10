require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Setup
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Statische Dateien
app.use(express.static('public'));
app.use(express.json());

// API Routen
app.get('/api/leaderboard', (req, res) => {
    // Implementiere deine Leaderboard-Logik
});

app.post('/api/user/:id/save', (req, res) => {
    // Implementiere deine Speicher-Logik
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});