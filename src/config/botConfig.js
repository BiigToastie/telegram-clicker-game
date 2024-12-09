const gameConfig = {
    shortName: 'clicker_game',
    title: 'Clicker Game',
    description: 'Click to earn coins and upgrade your multiplier!',
    buttonText: '🎮 Play Clicker Game'
};

const serverConfig = {
    getGameUrl: (query) => {
        // Use HTTPS for production, HTTP for local development
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const domain = process.env.PROJECT_DOMAIN || 'localhost:3000';
        const queryParams = new URLSearchParams({
            id: query.id,
            user: query.from.id,
            hash: query.game_short_name
        }).toString();
        
        return `${protocol}://${domain}/game?${queryParams}`;
    }
};

module.exports = { gameConfig, serverConfig };