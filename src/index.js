require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Render.com erlaubt Schreibzugriff im /tmp Verzeichnis
const USERS_FILE = '/tmp/users.json';
const BACKUP_FILE = '/tmp/users_backup.json';

// Hilfsfunktionen für die Datenspeicherung
async function loadUsers() {
    try {
        // Versuche zuerst die Hauptdatei zu laden
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (mainError) {
            // Wenn Hauptdatei nicht existiert, versuche Backup
            try {
                const backupData = await fs.readFile(BACKUP_FILE, 'utf8');
                // Wenn Backup geladen wurde, stelle es als Hauptdatei wieder her
                await fs.writeFile(USERS_FILE, backupData);
                return JSON.parse(backupData);
            } catch (backupError) {
                // Wenn auch kein Backup existiert, erstelle neue Datei
                const emptyData = '{}';
                await fs.writeFile(USERS_FILE, emptyData);
                return {};
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        return {};
    }
}

async function saveUsers(users) {
    try {
        const data = JSON.stringify(users, null, 2);
        // Speichere in Hauptdatei und Backup
        await Promise.all([
            fs.writeFile(USERS_FILE, data),
            fs.writeFile(BACKUP_FILE, data)
        ]);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    }
}

// Bot Setup
const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: process.env.NODE_ENV !== 'production'  // Polling nur in Entwicklung
});

// Statische Dateien
app.use(express.static('public'));
app.use(express.json());

// API Routen
app.get('/api/user/:id', async (req, res) => {
    try {
        const users = await loadUsers();
        users[req.params.id] = {
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
            },
            ...users[req.params.id]
        };
        await saveUsers(users);
        res.json(users[req.params.id]);
    } catch (error) {
        console.error('Fehler beim Laden des Users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/:id/save', async (req, res) => {
    try {
        const users = await loadUsers();
        const oldData = users[req.params.id] || {};
        users[req.params.id] = {
            ...oldData,
            ...req.body,
            lastUpdated: Date.now()
        };
        await saveUsers(users);
        console.log('Daten gespeichert für User:', req.params.id);
        res.json(users[req.params.id]);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});