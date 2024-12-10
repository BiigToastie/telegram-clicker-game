require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Render.com erlaubt Schreibzugriff im /tmp Verzeichnis
const USERS_FILE = process.env.NODE_ENV === 'production' 
    ? '/tmp/users.json'
    : path.join(__dirname, '../data/users.json');

// Hilfsfunktionen für die Datenspeicherung
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(USERS_FILE, '{}');
            return {};
        }
        console.error('Fehler beim Laden:', error);
        return {};
    }
}

async function saveUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
}

// Bot Setup
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Statische Dateien
app.use(express.static('public'));
app.use(express.json());

// API Routen
app.get('/api/user/:id', async (req, res) => {
    try {
        const users = await loadUsers();
        const user = users[req.params.id] || {
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
                    enabled: false,
                    value: 0.1,
                    cost: 100,
                    upgradeCost: 200,
                    costIncrease: 1.5,
                    lastUpdate: Date.now()
                }
            }
        };
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/:id/save', async (req, res) => {
    try {
        const users = await loadUsers();
        users[req.params.id] = {
            ...req.body,
            lastUpdated: Date.now()
        };
        await saveUsers(users);
        res.json(users[req.params.id]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await loadUsers();
        const leaderboard = Object.entries(users)
            .map(([id, user]) => ({
                id,
                name: user.name || 'Unbekannter Spieler',
                username: user.username || '',
                coins: user.coins || 0,
                level: user.level?.current || 0
            }))
            .sort((a, b) => b.coins - a.coins)
            .slice(0, 100);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Backup alle 5 Minuten
setInterval(async () => {
    try {
        const users = await loadUsers();
        const backupPath = '/tmp/users_backup.json';
        await fs.writeFile(backupPath, JSON.stringify(users));
        console.log('Backup erstellt:', new Date().toISOString());
    } catch (error) {
        console.error('Backup error:', error);
    }
}, 5 * 60 * 1000);

// Start Server
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});