function createGameKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🪙 Spielen', callback_data: 'click' }],
        [{ text: '🛍 Shop', callback_data: 'shop' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

function createShopKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💰 Multiplier kaufen', callback_data: 'buy_multiplier' }],
        [{ text: '🔙 Zurück zum Spiel', callback_data: 'back' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

module.exports = { createGameKeyboard, createShopKeyboard };