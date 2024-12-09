const { gameConfig } = require('../config/botConfig');

async function initializeBot(bot) {
    try {
        // Remove all commands to keep the interface clean
        await bot.setMyCommands([]);
        
        // Set webhook if in production
        if (process.env.NODE_ENV === 'production' && process.env.PROJECT_DOMAIN) {
            const webhookUrl = `https://${process.env.PROJECT_DOMAIN}/webhook`;
            await bot.setWebHook(webhookUrl);
        }
        
        console.log('Bot initialized successfully');
    } catch (error) {
        console.error('Error initializing bot:', error);
        throw error;
    }
}

module.exports = {
    initializeBot
};