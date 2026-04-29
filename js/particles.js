/* ══════════════════════════════════════════════════════════════════════
   Particle Network Animation — Connecting dots / constellation effect
   Lightweight, custom Canvas-based, black & white
   ══════════════════════════════════════════════════════════════════════ */

(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouse = { x: null, y: null };

    // ── Configuration ────────────────────────────────────────────────
    const config = {
        particleCount: getParticleCount(),
        maxDistance: 150,
        particleSize: { min: 0.5, max: 1.5 },
        speed: 0.3,
        lineOpacity: 0.08,
        particleOpacity: { min: 0.15, max: 0.5 },
        mouseRadius: 200,
        mouseLineOpacity: 0.15,
        color: '255, 255, 255', // white RGB
        shimmerSpeed: 0.005,
    };

    function getParticleCount() {
        const width = window.innerWidth;
        if (width < 640) return 40;
        if (width < 968) return 60;
        return 90;
    }

    // ── Resize ───────────────────────────────────────────────────────
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ── Particle Class ───────────────────────────────────────────────
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
            this.speedX = (Math.random() - 0.5) * config.speed;
            this.speedY = (Math.random() - 0.5) * config.speed;
            this.opacity = config.particleOpacity.min + Math.random() * (config.particleOpacity.max - config.particleOpacity.min);
            this.baseOpacity = this.opacity;
            this.shimmerOffset = Math.random() * Math.PI * 2;
        }

        update(time) {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;

            // Shimmer effect
            this.opacity = this.baseOpacity + Math.sin(time * config.shimmerSpeed + this.shimmerOffset) * 0.1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${config.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    // ── Initialise Particles ─────────────────────────────────────────
    function initParticles() {
        particles = [];
        const count = getParticleCount();
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    // ── Draw Connections ─────────────────────────────────────────────
    function drawConnections(time) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.maxDistance) {
                    const opacity = config.lineOpacity * (1 - distance / config.maxDistance);
                    // Subtle shimmer on lines
                    const shimmer = 1 + Math.sin(time * 0.002 + i * 0.5) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${config.color}, ${opacity * shimmer})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Mouse connections
            if (mouse.x !== null && mouse.y !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.mouseRadius) {
                    const opacity = config.mouseLineOpacity * (1 - distance / config.mouseRadius);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(${config.color}, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // ── Animation Loop ───────────────────────────────────────────────
    function animate(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update(time);
            p.draw();
        });

        drawConnections(time);
        animationId = requestAnimationFrame(animate);
    }

    // ── Event Listeners ──────────────────────────────────────────────
    window.addEventListener('resize', () => {
        resize();
        initParticles();
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // ── Start ────────────────────────────────────────────────────────
    resize();
    initParticles();
    animate(0);
})();
