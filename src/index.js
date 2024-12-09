const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Render.com erlaubt Schreibzugriff im /tmp Verzeichnis
const USERS_FILE = process.env.NODE_ENV === 'production' 
  ? '/tmp/users.json'
  : path.join(__dirname, '../data/users.json');

// Hilfsfunktionen für die Datenspeicherung
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        if (!users || typeof users !== 'object') {
            console.error('Ungültiges Datenformat');
            return {};
        }
        return users;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Datei existiert nicht - erstelle sie
            await fs.writeFile(USERS_FILE, '{}');
            return {};
        }
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        return {};
    }
}

async function saveUsers(users) {
    try {
        // Validiere Daten vor dem Speichern
        if (!users || typeof users !== 'object') {
            throw new Error('Ungültige Daten');
        }

        // Direktes Speichern im Production-Mode
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
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
        // Versuche zuerst die Hauptdatei zu laden
        let user = users[req.params.telegramId];

        // Wenn keine Daten gefunden, versuche Backup
        if (!user) {
            try {
                const backupData = await fs.readFile(USERS_FILE + '.backup', 'utf8');
                const backupUsers = JSON.parse(backupData);
                user = backupUsers[req.params.telegramId];
            } catch (backupError) {
                console.error('Backup konnte nicht geladen werden:', backupError);
            }
        }

        // Wenn immer noch keine Daten, erstelle neue
        if (!user) {
            user = {
                coins: 0,
                multiplier: 0.1,
                name: '',
                username: '',
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
        }

        res.json(user);
    } catch (error) {
        console.error('Fehler beim Laden/Speichern:', error);
        res.status(500).json({ error: 'Datenbankfehler' });
    }
});

app.post('/api/user/:telegramId/save', async (req, res) => {
    try {
        const { coins, multiplier, level, upgrades, name, username } = req.body;
        // Lade aktuelle Daten
        const users = await loadUsers();

        // Merge neue Daten mit existierenden Daten
        users[req.params.telegramId] = {
            coins,
            multiplier,
            level,
            upgrades: {
                multiplier: {
                    cost: upgrades.multiplier.cost,
                    increment: upgrades.multiplier.increment,
                    costIncrease: upgrades.multiplier.costIncrease
                },
                autoClicker: {
                    active: upgrades.autoClicker.active,
                    cost: upgrades.autoClicker.cost,
                    value: upgrades.autoClicker.value,
                    upgradeCost: upgrades.autoClicker.upgradeCost,
                    costIncrease: upgrades.autoClicker.costIncrease,
                    lastUpdate: upgrades.autoClicker.lastUpdate
                }
            },
            name,
            username,
            lastUpdated: new Date()
        };

        // Validiere Daten vor dem Speichern
        if (!users[req.params.telegramId] || 
            typeof users[req.params.telegramId].coins !== 'number' || 
            typeof users[req.params.telegramId].multiplier !== 'number' ||
            !users[req.params.telegramId].upgrades ||
            !users[req.params.telegramId].upgrades.multiplier ||
            !users[req.params.telegramId].upgrades.autoClicker) {
            throw new Error('Ungültige Datentypen');
        }

        // Sichere Speicherung mit Backup
        const tempFile = USERS_FILE + '.temp';
        await fs.writeFile(tempFile, JSON.stringify(users, null, 2));
        await fs.writeFile(USERS_FILE + '.backup', JSON.stringify(users, null, 2));
        await fs.rename(tempFile, USERS_FILE);

        res.json({ success: true });
    } catch (error) {
        console.error('Speicherfehler:', error, error.stack);
        res.status(500).json({ error: 'Speicherfehler', details: error.message });
    }
});

// API-Route für die Bestenliste
app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await loadUsers();
        const leaderboard = Object.entries(users).map(([id, user]) => ({
            id,
            name: user.name || 'Unbekannter Spieler',
            level: user.level?.current || 0,
            exp: user.level?.exp || 0,
            coins: user.coins || 0,
            username: user.username || ''
        }));

        // Sortiere nach Level (primär) und EXP (sekundär)
        leaderboard.sort((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            return b.exp - a.exp;
        });

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Laden der Bestenliste' });
    }
});

// Route zum manuellen Zurücksetzen der Daten (nur für Entwicklung)
app.post('/api/reset', async (req, res) => {
    try {
        await saveUsers({});
        res.json({ success: true, message: 'Alle Spielerdaten wurden zurückgesetzt' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Zurücksetzen' });
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