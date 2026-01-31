/**
 * HERO: Neural Network Pattern
 * Gleichmäßig verteiltes Netzwerk mit Klick-Magneteffekt
 * 
 * Features:
 * - Viele Nodes gleichmäßig über den gesamten Bereich verteilt
 * - Glow-Effekte auf aktiven Nodes
 * - Maus-Interaktion & Scroll-Parallax
 * - Klick: Magneteffekt - Nodes werden angezogen und verbinden sich
 */
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Config - MEHR NODES, GLEICHMÄSSIG VERTEILT
    const config = {
        nodeCount: prefersReduced ? 80 : 160,
        connectionDistance: 160,
        nodeRadius: 2.5,
        lineWidth: 1,
        baseColor: { r: 24, g: 90, b: 219 },      // #185adb
        accentColor: { r: 0, g: 212, b: 255 },    // #00d4ff
        goldColor: { r: 255, g: 201, b: 71 },     // #ffc947
        mouseRadius: 180,
        pulseSpeed: 0.003
    };

    let width, height;
    let nodes = [];
    let mouseX = -1000, mouseY = -1000;
    let scrollProgress = 0;
    let time = 0;
    
    // Klick-Magnet Effekt
    let magnetActive = false;
    let magnetX = 0, magnetY = 0;
    let magnetStrength = 0;
    
    // Animation frame ID for cleanup (prevent memory leak)
    let animationId = null;

    // Node class
    class Node {
        constructor() {
            this.reset();
        }

        reset() {
            // Gleichmäßig über den gesamten Bereich verteilt
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = config.nodeRadius + Math.random() * 2;
            this.pulseOffset = Math.random() * Math.PI * 2;
            // Zufällig einige aktive (gold) Nodes
            this.isActive = Math.random() < 0.12;
            this.glowIntensity = 0;
            this.magnetInfluence = 0;
        }

        update() {
            if (prefersReduced) return;

            // Sanfte Eigenbewegung
            this.x += this.vx;
            this.y += this.vy;

            // Bounds mit sanftem Zurückfedern
            const margin = 50;
            if (this.x < -margin) this.vx = Math.abs(this.vx);
            if (this.x > width + margin) this.vx = -Math.abs(this.vx);
            if (this.y < -margin) this.vy = Math.abs(this.vy);
            if (this.y > height + margin) this.vy = -Math.abs(this.vy);

            // Maus-Interaktion (abstoßend)
            const dxMouse = this.x - mouseX;
            const dyMouse = this.y - mouseY;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < config.mouseRadius && distMouse > 0) {
                const force = (config.mouseRadius - distMouse) / config.mouseRadius;
                const angle = Math.atan2(dyMouse, dxMouse);
                this.x += Math.cos(angle) * force * 3;
                this.y += Math.sin(angle) * force * 3;
                this.glowIntensity = Math.min(1, this.glowIntensity + 0.1);
            } else {
                this.glowIntensity *= 0.95;
            }

            // Magnet-Effekt (anziehend bei Klick)
            if (magnetActive && magnetStrength > 0) {
                const dxMag = magnetX - this.x;
                const dyMag = magnetY - this.y;
                const distMag = Math.sqrt(dxMag * dxMag + dyMag * dyMag);
                
                if (distMag < 300 && distMag > 20) {
                    const pullForce = magnetStrength * (1 - distMag / 300) * 0.15;
                    this.x += dxMag * pullForce;
                    this.y += dyMag * pullForce;
                    this.magnetInfluence = Math.min(1, this.magnetInfluence + 0.15);
                }
            } else {
                this.magnetInfluence *= 0.92;
            }

            // Scroll-Parallax
            this.y = this.baseY + scrollProgress * 80 * (this.baseY / height - 0.5) * 0.5;
        }

        draw() {
            const pulse = Math.sin(time * 4 + this.pulseOffset) * 0.3 + 0.8;
            const radius = this.radius * pulse;

            // Glow bei Maus-Nähe, Magnet-Einfluss oder aktiven Nodes
            const glowAmount = Math.max(this.glowIntensity, this.magnetInfluence, this.isActive ? 0.6 : 0);
            
            if (this.magnetInfluence > 0.3) {
                // Cyan bei Magnet-Einfluss
                ctx.fillStyle = `rgba(${config.accentColor.r}, ${config.accentColor.g}, ${config.accentColor.b}, ${0.7 + this.magnetInfluence * 0.3})`;
                ctx.shadowColor = `rgba(${config.accentColor.r}, ${config.accentColor.g}, ${config.accentColor.b}, ${0.6 + this.magnetInfluence * 0.4})`;
                ctx.shadowBlur = 12 + this.magnetInfluence * 10;
            } else if (this.isActive || this.glowIntensity > 0.1) {
                const color = this.isActive ? config.goldColor : config.accentColor;
                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 + glowAmount * 0.3})`;
                ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 + glowAmount * 0.4})`;
                ctx.shadowBlur = 12 + glowAmount * 8;
            } else {
                ctx.fillStyle = `rgba(${config.baseColor.r}, ${config.baseColor.g}, ${config.baseColor.b}, 0.7)`;
                ctx.shadowColor = `rgba(${config.baseColor.r}, ${config.baseColor.g}, ${config.baseColor.b}, 0.3)`;
                ctx.shadowBlur = 4;
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        }
    }

    // Initialisierung - Alle Nodes gleichmäßig verteilt
    function init() {
        resize();
        nodes = [];
        
        for (let i = 0; i < config.nodeCount; i++) {
            nodes.push(new Node());
        }
    }

    // Resize Handler
    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width || window.innerWidth;
        height = rect.height || window.innerHeight;
        
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        if (nodes.length > 0) {
            nodes.forEach(node => {
                node.baseX = Math.random() * width;
                node.baseY = Math.random() * height;
                node.x = node.baseX;
                node.y = node.baseY;
            });
        }
    }

    // Verbindungen zeichnen
    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.connectionDistance) {
                    // Opacity basierend auf Distanz
                    let opacity = (1 - dist / config.connectionDistance) * 0.6;
                    
                    // Pulse-Effekt
                    const pulseOpacity = opacity * (0.6 + Math.sin(time * 3 + i * 0.15) * 0.4);
                    
                    // Hellere Verbindungen bei Magnet-Einfluss
                    const magnetBoost = Math.max(nodes[i].magnetInfluence, nodes[j].magnetInfluence);
                    if (magnetBoost > 0.2) {
                        opacity = pulseOpacity * (1 + magnetBoost);
                    }
                    
                    // Verbindungen zwischen aktiven Nodes sind heller
                    if (nodes[i].isActive || nodes[j].isActive) {
                        opacity = pulseOpacity * 1.5;
                    }
                    
                    // Farbe mit Cyan-Anteil
                    const mixRatio = Math.sin(time * 1.5 + i * 0.08) * 0.5 + 0.5;
                    let r = Math.round(config.baseColor.r * (1 - mixRatio * 0.5) + config.accentColor.r * mixRatio * 0.5);
                    let g = Math.round(config.baseColor.g * (1 - mixRatio * 0.5) + config.accentColor.g * mixRatio * 0.5);
                    let b = Math.round(config.baseColor.b * (1 - mixRatio * 0.5) + config.accentColor.b * mixRatio * 0.5);
                    
                    // Mehr Cyan bei Magnet
                    if (magnetBoost > 0.3) {
                        r = Math.round(r * (1 - magnetBoost * 0.5) + config.accentColor.r * magnetBoost * 0.5);
                        g = Math.round(g * (1 - magnetBoost * 0.5) + config.accentColor.g * magnetBoost * 0.5);
                        b = Math.round(b * (1 - magnetBoost * 0.5) + config.accentColor.b * magnetBoost * 0.5);
                    }

                    // Dickere Linien für nahe Verbindungen
                    const lineWidth = config.lineWidth + (1 - dist / config.connectionDistance) * 0.5;

                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${pulseOpacity})`;
                    ctx.lineWidth = lineWidth;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        time += config.pulseSpeed;

        // Magnet-Effekt abklingen lassen
        if (magnetActive) {
            magnetStrength *= 0.97;
            if (magnetStrength < 0.01) {
                magnetActive = false;
                magnetStrength = 0;
            }
        }

        ctx.clearRect(0, 0, width, height);

        // Nodes & Verbindungen
        nodes.forEach(node => node.update());
        drawConnections();
        nodes.forEach(node => node.draw());
    }
    
    // Cleanup on visibility change (prevent memory leak)
    function handleVisibilityChange() {
        if (document.hidden) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            if (!animationId) {
                animate();
            }
        }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Event Listeners
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    function updateScroll() {
        const heroSection = document.getElementById('hero');
        if (!heroSection) return;
        
        const rect = heroSection.getBoundingClientRect();
        const heroHeight = heroSection.offsetHeight;
        scrollProgress = Math.max(0, Math.min(1, -rect.top / heroHeight));
    }
    
    window.addEventListener('scroll', updateScroll, { passive: true });

    // Klick: Magnet-Effekt - Nodes werden angezogen
    canvas.addEventListener('click', (e) => {
        if (prefersReduced) return;
        
        const rect = canvas.getBoundingClientRect();
        magnetX = e.clientX - rect.left;
        magnetY = e.clientY - rect.top;
        magnetActive = true;
        magnetStrength = 1;
        
        // Nodes in der Nähe kurz aktivieren
        nodes.forEach(node => {
            const dx = node.x - magnetX;
            const dy = node.y - magnetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 250) {
                node.isActive = true;
                setTimeout(() => {
                    node.isActive = Math.random() < 0.12;
                }, 1500);
            }
        });
    });

    // Start
    init();
    animate();
});
