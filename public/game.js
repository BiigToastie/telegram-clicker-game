// Fluid Particle Animation
class FluidBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = 50;
        
        // Styling
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.3';
        
        // Colors
        this.colors = [
            '#4CAF50', // Light green
            '#43A047',
            '#388E3C',
            '#2E7D32', // Dark green
            '#1B5E20'  // Very dark green
        ];
        
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 100 + 50,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                vx: Math.random() * 0.2 - 0.1,
                vy: Math.random() * 0.2 - 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update and draw particles
        this.particles.forEach(p => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.phase += 0.01;
            
            // Bounce off walls
            if (p.x < -p.radius) p.x = this.width + p.radius;
            if (p.x > this.width + p.radius) p.x = -p.radius;
            if (p.y < -p.radius) p.y = this.height + p.radius;
            if (p.y > this.height + p.radius) p.y = -p.radius;
            
            // Draw particle
            this.ctx.beginPath();
            const radius = p.radius * (1 + Math.sin(p.phase) * 0.2);
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            gradient.addColorStop(0, p.color + '40'); // 25% opacity
            gradient.addColorStop(1, p.color + '00'); // 0% opacity
            
            this.ctx.fillStyle = gradient;
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Start animation when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FluidBackground();
});