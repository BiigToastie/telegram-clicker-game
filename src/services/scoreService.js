const scores = new Map();

async function saveScore(userId, score) {
  const currentScore = scores.get(userId) || 0;
  if (score > currentScore) {
    scores.set(userId, score);
  }
  return true;
}

async function getHighScores() {
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, score]) => ({ userId, score }));
}

module.exports = { saveScore, getHighScores };