class ClickerGame {
    constructor() {
        this.coins = 0;
        this.multiplier = 1.0;
        this.upgrades = [
            { id: 'multiplier', name: 'Multiplier', baseCost: 10, cost: 10, increment: 0.1 }
        ];
        this.setupGame();
    }

    setupGame() {
        this.initTelegram();
        this.setupEventListeners();
        this.updateUI();
    }

    initTelegram() {
        if (typeof TelegramGameProxy !== 'undefined') {
            try {
                // Set up score sharing
                TelegramGameProxy.shareScore = () => {
                    return Math.floor(this.coins);
                };

                // Set up score updating
                TelegramGameProxy.setScore = (score) => {
                    return fetch('/scores', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: this.getUserId(),
                            score: score
                        })
                    });
                };
            } catch (error) {
                console.error('Error initializing Telegram game:', error);
            }
        }
    }

    getUserId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('user') || 'anonymous';
    }

    setupEventListeners() {
        document.getElementById('coin').addEventListener('click', () => this.handleClick());
        this.renderUpgrades();
    }

    handleClick() {
        this.coins += this.multiplier;
        this.createFloatingText();
        this.updateUI();
        this.saveProgress();
    }

    createFloatingText() {
        const coin = document.getElementById('coin');
        const text = document.createElement('div');
        text.className = 'floating-text';
        text.textContent = `+${this.multiplier.toFixed(1)}`;
        
        const rect = coin.getBoundingClientRect();
        text.style.left = `${rect.left + rect.width / 2}px`;
        text.style.top = `${rect.top}px`;
        
        document.body.appendChild(text);
        
        setTimeout(() => text.remove(), 1000);
    }

    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (upgrade && this.coins >= upgrade.cost) {
            this.coins -= upgrade.cost;
            this.multiplier += upgrade.increment;
            upgrade.cost = Math.round(upgrade.cost * 1.5);
            this.updateUI();
            this.saveProgress();
        }
    }

    renderUpgrades() {
        const container = document.getElementById('upgrades');
        container.innerHTML = this.upgrades.map(upgrade => `
            <button 
                class="upgrade-button" 
                onclick="game.buyUpgrade('${upgrade.id}')"
                ${this.coins < upgrade.cost ? 'disabled' : ''}>
                ${upgrade.name} (${upgrade.cost} Coins)
            </button>
        `).join('');
    }

    updateUI() {
        document.getElementById('coins').textContent = this.coins.toFixed(1);
        document.getElementById('multiplier').textContent = this.multiplier.toFixed(1);
        this.renderUpgrades();
    }

    saveProgress() {
        const score = Math.floor(this.coins);
        if (typeof TelegramGameProxy !== 'undefined') {
            TelegramGameProxy.setScore(score);
        }
    }
}

// Initialize game after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ClickerGame();
});