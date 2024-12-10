const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    username: String,
    coins: { type: Number, default: 0 },
    multiplier: { type: Number, default: 0.1 },
    level: {
        current: { type: Number, default: 0 },
        exp: { type: Number, default: 0 },
        nextLevel: { type: Number, default: 100 }
    },
    upgrades: {
        multiplier: {
            cost: { type: Number, default: 5 },
            increment: { type: Number, default: 0.1 },
            costIncrease: { type: Number, default: 1.3 }
        },
        autoClicker: {
            active: { type: Boolean, default: false },
            enabled: { type: Boolean, default: false },
            value: { type: Number, default: 0.1 },
            cost: { type: Number, default: 100 },
            upgradeCost: { type: Number, default: 200 },
            costIncrease: { type: Number, default: 1.5 },
            lastUpdate: { type: Number, default: Date.now }
        }
    }
});

module.exports = mongoose.model('User', userSchema); 