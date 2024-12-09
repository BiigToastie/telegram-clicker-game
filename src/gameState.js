const gameState = {
  coins: 0,
  clickMultiplier: 1,
  lastMessageId: null,
  upgrades: {
    multiplier: {
      cost: 10,
      increment: 0.5
    }
  }
};

module.exports = { gameState };