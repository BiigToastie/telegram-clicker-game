const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    coins: {
        type: Number,
        default: 0
    },
    multiplier: {
        type: Number,
        default: 1
    },
    upgrades: {
        multiplier: {
            cost: { type: Number, default: 10 },
            increment: { type: Number, default: 0.5 }
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema); 