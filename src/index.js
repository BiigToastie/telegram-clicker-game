require('dotenv').config();
const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Verbindung
const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Verbindung zur Datenbank
async function connectDB() {
    try {
        await client.connect();
        db = client.db('clickerdb');
        console.log('MongoDB verbunden');
    } catch (error) {
        console.error('DB Fehler:', error);
    }
}

async function loadUsers() {
    try {
        const users = await db.collection('users').find().toArray();
        return users.reduce((acc, user) => {
            acc[user.telegramId] = user;
            return acc;
        }, {});
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        return {};
    }
}

async function saveUser(telegramId, userData) {
    try {
        await db.collection('users').updateOne(
            { telegramId },
            { $set: userData },
            { upsert: true }
        );
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
        const user = await db.collection('users').findOne({ 
            telegramId: req.params.id 
        }) || {
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
        console.error('Fehler beim Laden des Users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/user/:id/save', async (req, res) => {
    try {
        const userData = {
            telegramId: req.params.id,
            ...req.body,
            lastUpdated: Date.now()
        };
        await db.collection('users').updateOne(
            { telegramId: req.params.id },
            { $set: userData },
            { upsert: true }
        );
        res.json(userData);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.collection('users')
            .find({})
            .sort({ coins: -1 })
            .limit(100)
            .toArray();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start Server
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server läuft auf Port ${PORT}`);
});