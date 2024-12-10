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

        // Einfaches direktes Speichern
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        // Versuche es erneut nach kurzer Verzögerung
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        } catch (retryError) {
            console.error('Erneuter Speicherversuch fehlgeschlagen:', retryError);
        }
    }
}

// Initialisiere die Datei beim Start
(async () => {
    try {
        await fs.writeFile(USERS_FILE, '{}', { flag: 'wx' });
        console.log('Neue Benutzerdatei erstellt');
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Fehler beim Initialisieren der Benutzerdatei:', error);
        }
    }
})();

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
    
    let pollingRetries = 0;
    const MAX_RETRIES = 5;
    let lastErrorTime = 0;
    const ERROR_COOLDOWN = 60000; // 1 Minute Cooldown zwischen Fehlermeldungen

    bot.on('polling_error', (error) => {
        if (error.code === 'ETELEGRAM') {
            pollingRetries++;
            
            // Prüfe ob genug Zeit seit der letzten Fehlermeldung vergangen ist
            const now = Date.now();
            if (now - lastErrorTime > ERROR_COOLDOWN) {
                console.log(`Telegram API nicht erreichbar (Versuch ${pollingRetries}/${MAX_RETRIES})...`);
                lastErrorTime = now;
            }
            
            if (pollingRetries <= MAX_RETRIES) {
                setTimeout(() => {
                    try {
                        bot.stopPolling();
                        setTimeout(() => {
                            bot.startPolling();
                        }, 5000);
                    } catch (restartError) {
                        // Fehler beim Neustart still behandeln
                    }
                }, 10000);
            } else {
                // Still fehlschlagen
                pollingRetries = 0; // Reset für nächsten Versuch
            }
        } else {
            // Andere Fehler still behandeln
        }
    });

    bot.on('polling_error', () => {
        pollingRetries = 0; // Reset counter on successful connection
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

// Backup alle 5 Minuten
setInterval(async () => {
    try {
        const users = await loadUsers();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(
            `/tmp/users_backup_${timestamp}.json`,
            JSON.stringify(users)
        );
        // Behalte nur die letzten 5 Backups
        const backups = await fs.readdir('/tmp');
        const userBackups = backups.filter(f => f.startsWith('users_backup_'));
        if (userBackups.length > 5) {
            const oldestBackup = userBackups.sort()[0];
            await fs.unlink(`/tmp/${oldestBackup}`);
        }
    } catch (error) {
        console.error('Backup error:', error);
    }
}, 5 * 60 * 1000);