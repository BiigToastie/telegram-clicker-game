const { saveScore, getHighScores } = require('../services/scoreService');

function setupGameRoutes(app) {
  app.get('/game', (req, res) => {
    res.sendFile('index.html', { root: './public' });
  });

  app.post('/scores', async (req, res) => {
    try {
      const { userId, score } = req.body;
      await saveScore(userId, score);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save score' });
    }
  });

  app.get('/highscores', async (req, res) => {
    try {
      const scores = await getHighScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get highscores' });
    }
  });
}

module.exports = { setupGameRoutes };