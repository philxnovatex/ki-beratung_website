/**
 * HERO: Knotennetz auf Canvas
 *
 * Ersetzt die frühere Fassung. Wesentliche Unterschiede:
 *
 *  - prefers-reduced-motion hält die Animation jetzt wirklich an. Vorher lief
 *    die requestAnimationFrame-Schleife weiter und nur die Knotenbewegung war
 *    abgeschaltet, die Verbindungslinien pulsierten also weiter. Jetzt wird
 *    genau ein Standbild gezeichnet und die Schleife nie gestartet.
 *  - Die Schleife pausiert, sobald der Hero aus dem Sichtfeld gescrollt ist.
 *    Vorher lief sie über die gesamte Seitenlänge weiter.
 *  - Die Knotenzahl richtet sich nach der Fläche und der Geräteleistung,
 *    statt fest bei 160 zu liegen.
 *  - Die Zeichenfläche berücksichtigt devicePixelRatio, damit die Linien auf
 *    hochauflösenden Displays nicht unscharf wirken.
 */
(function initHeroCanvas() {
    'use strict';

    const start = () => {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const config = {
            connectionDistance: 165,
            nodeRadius: 2.2,
            baseColor:   { r: 24,  g: 90,  b: 219 },  // Interaktionsblau
            accentColor: { r: 120, g: 190, b: 255 },  // helles Blau für Glanzpunkte
            goldColor:   { r: 255, g: 201, b: 71  },  // Markenakzent
            mouseRadius: 180,
            pulseSpeed: 0.003,
            maxNodes: 170,
            minNodes: 40
        };

        let width = 0, height = 0, dpr = 1;
        let nodes = [];
        let mouseX = -9999, mouseY = -9999;
        let time = 0;
        let animationId = null;
        let imSichtfeld = true;
        let magnet = { aktiv: false, x: 0, y: 0, staerke: 0 };

        /* Knotenzahl aus der Fläche ableiten. Ein 4K-Monitor bekommt sonst
           dieselbe Dichte wie ein Telefon, ein Telefon dieselbe Last wie ein
           Desktop. Bei wenigen CPU-Kernen wird zusätzlich reduziert. */
        function knotenzahl() {
            const flaeche = width * height;
            const kerne = navigator.hardwareConcurrency || 4;
            let n = Math.round(flaeche / 11000);
            if (kerne <= 4) n = Math.round(n * 0.6);
            return Math.max(config.minNodes, Math.min(config.maxNodes, n));
        }

        class Node {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = config.nodeRadius + Math.random() * 1.8;
                this.pulseOffset = Math.random() * Math.PI * 2;
                this.istGold = Math.random() < 0.12;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // An den Rändern abprallen statt herausfliegen
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
                this.x = Math.max(0, Math.min(width, this.x));
                this.y = Math.max(0, Math.min(height, this.y));

                // Sanfte Anziehung zum zuletzt angeklickten Punkt
                if (magnet.aktiv) {
                    const dx = magnet.x - this.x;
                    const dy = magnet.y - this.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    if (dist < 320) {
                        this.x += (dx / dist) * magnet.staerke * 1.6;
                        this.y += (dy / dist) * magnet.staerke * 1.6;
                    }
                }
            }

            draw() {
                const puls = Math.sin(time * 2 + this.pulseOffset) * 0.5 + 0.5;
                const dMaus = Math.hypot(this.x - mouseX, this.y - mouseY);
                const nah = dMaus < config.mouseRadius;
                const farbe = this.istGold ? config.goldColor
                            : nah ? config.accentColor
                            : config.baseColor;

                const alpha = 0.35 + puls * 0.35 + (nah ? 0.3 : 0);
                const r = this.radius * (nah ? 1.5 : 1);

                if (nah || this.istGold) {
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = `rgba(${farbe.r}, ${farbe.g}, ${farbe.b}, .8)`;
                }
                ctx.fillStyle = `rgba(${farbe.r}, ${farbe.g}, ${farbe.b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        function drawConnections() {
            const maxDist = config.connectionDistance;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > maxDist) continue;

                    const naehe = 1 - dist / maxDist;
                    const mitte = { x: (nodes[i].x + nodes[j].x) / 2, y: (nodes[i].y + nodes[j].y) / 2 };
                    const nahMaus = Math.hypot(mitte.x - mouseX, mitte.y - mouseY) < config.mouseRadius;
                    const f = nahMaus ? config.accentColor : config.baseColor;
                    const alpha = naehe * (nahMaus ? 0.45 : 0.22);

                    ctx.strokeStyle = `rgba(${f.r}, ${f.g}, ${f.b}, ${alpha})`;
                    ctx.lineWidth = nahMaus ? 1.2 : 0.8;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        function render() {
            ctx.clearRect(0, 0, width, height);
            drawConnections();
            for (const n of nodes) n.draw();
        }

        function frame() {
            time += config.pulseSpeed;

            if (magnet.aktiv) {
                magnet.staerke *= 0.97;
                if (magnet.staerke < 0.01) { magnet.aktiv = false; magnet.staerke = 0; }
            }

            for (const n of nodes) n.update();
            render();

            animationId = requestAnimationFrame(frame);
        }

        function starteSchleife() {
            // Bei reduzierter Bewegung bleibt es beim Standbild.
            if (motionQuery.matches || animationId !== null) return;
            animationId = requestAnimationFrame(frame);
        }

        function stoppeSchleife() {
            if (animationId === null) return;
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            width = rect.width || window.innerWidth;
            height = rect.height || window.innerHeight;

            // Auf 2 begrenzen: darüber steigt die Füllrate stark, der sichtbare
            // Gewinn ist gering.
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const soll = knotenzahl();
            if (nodes.length !== soll) {
                nodes = Array.from({ length: soll }, () => new Node());
            }
            render();
        }

        // ── Start ────────────────────────────────────────────────────────────
        resize();

        if (motionQuery.matches) {
            render();            // genau ein Standbild, keine Schleife
        } else {
            starteSchleife();
        }

        // Umschalten der Systemeinstellung zur Laufzeit berücksichtigen
        const onMotionChange = () => {
            if (motionQuery.matches) { stoppeSchleife(); render(); }
            else if (imSichtfeld) starteSchleife();
        };
        if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
        else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

        // Nur rechnen, solange der Hero sichtbar ist
        const hero = document.getElementById('hero');
        if (hero && 'IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                imSichtfeld = entries[0].isIntersecting;
                if (imSichtfeld) starteSchleife();
                else stoppeSchleife();
            }, { threshold: 0 }).observe(hero);
        }

        // Nicht im Hintergrund weiterrechnen
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stoppeSchleife();
            else if (imSichtfeld) starteSchleife();
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

        canvas.addEventListener('click', (e) => {
            if (motionQuery.matches) return;
            const rect = canvas.getBoundingClientRect();
            magnet = { aktiv: true, x: e.clientX - rect.left, y: e.clientY - rect.top, staerke: 1.6 };
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
