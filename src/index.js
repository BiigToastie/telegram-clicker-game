const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Hilfsfunktionen für die Datenspeicherung
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

let bot;
try {
    bot = new TelegramBot(process.env.BOT_TOKEN, {
        polling: {
            autoStart: true,
            params: {
                timeout: 10
            }
        }
    });
    
    bot.on('polling_error', (error) => {
        console.log('Bot Polling Error:', error.code);  // Log nur den Error-Code
        if (error.code === 'ETELEGRAM') {
            // Versuche Polling neu zu starten
            bot.stopPolling();
            setTimeout(() => {
                bot.startPolling();
            }, 5000);
        }
    });
} catch (error) {
    console.error('Bot Initialization Error:', error);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API-Routen für Spielerdaten
app.get('/api/user/:telegramId', async (req, res) => {
    try {
        const users = await loadUsers();
        const user = users[req.params.telegramId] || {
            coins: 0,
            multiplier: 0.1,
            level: {
                current: 0,
                exp: 0,
                nextLevel: 100
            },
            upgrades: {
                multiplier: {
                    cost: 5,
                    increment: 0.1,
                    costIncrease: 1.3
                },
                autoClicker: {
                    active: false,
                    cost: 100,
                    value: 0.1,
                    upgradeCost: 200,
                    costIncrease: 1.5,
                    lastUpdate: Date.now()
                }
            }
        };
        users[req.params.telegramId] = user;
        await saveUsers(users);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.post('/api/user/:telegramId/save', async (req, res) => {
    try {
        const { coins, multiplier, level, upgrades } = req.body;
        const users = await loadUsers();
        users[req.params.telegramId] = {
            coins,
            multiplier,
            level,
            upgrades,
            lastUpdated: new Date()
        };
        await saveUsers(users);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Speicherfehler' });
    }
});

// Basis-Route für die Web-App
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Server starten
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
    console.log('Bot ist aktiv...');
});