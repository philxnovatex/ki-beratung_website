/**
 * background-canvas.js – Das Knotennetz als durchgehender Seitenhintergrund
 *
 * Nachfolger von hero-canvas.js. Der Unterschied ist nicht die Technik, sondern
 * die Rolle: Das Netz lag vorher im Hero und wurde nach rund 700 von 6000
 * Pixeln Seitenlänge abgeschaltet. Jetzt liegt es fest hinter der gesamten
 * Seite und wird vom Scrollfortschritt gesteuert.
 *
 * Die Idee dahinter ist die Positionierung selbst:
 *
 *   oben   verstreute Knoten, lose Verbindungen, kaltes Blau, viel Eigenleben
 *          -> das Bild der teuren Experimente
 *   unten  geordnetes Raster, dichte Verbindungen, Goldanteil, ruhige Lage
 *          -> das Bild des planbaren Erfolgs
 *
 * Der Übergang läuft über die volle Seitenlänge. Er ist an den Scroll gekoppelt
 * und nicht getaktet, lässt sich also vor- und zurückfahren.
 *
 * Grenzen, die bewusst gesetzt sind:
 *
 *  - Unterhalb von 900 px Breite läuft gar nichts. Das CSS blendet die Fläche
 *    dort ohnehin aus, und ein dauerhaft rechnender Hintergrund kostet auf
 *    Telefonen zu viel Akku.
 *  - prefers-reduced-motion zeichnet genau ein Standbild, ohne Schleife.
 *  - Im Hintergrundtab wird die Schleife angehalten.
 */
(function initBackgroundCanvas() {
    'use strict';

    const start = () => {
        const canvas = document.getElementById('site-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const schmalQuery = window.matchMedia('(max-width: 900px)');

        const config = {
            // Verbindungsreichweite wächst mit der Ordnung: Das Netz wirkt oben
            // zerfasert und unten zusammenhängend.
            distanzLose: 150,
            distanzFest: 215,
            nodeRadius: 2.6,
            baseColor:   { r: 24,  g: 90,  b: 219 },  // Interaktionsblau
            accentColor: { r: 120, g: 190, b: 255 },  // helles Blau für Glanzpunkte
            goldColor:   { r: 255, g: 201, b: 71  },  // Markenakzent
            mouseRadius: 190,
            pulseSpeed: 0.003,
            maxNodes: 210,
            minNodes: 50
        };

        let width = 0, height = 0, dpr = 1;
        let nodes = [];
        let mouseX = -9999, mouseY = -9999;
        let time = 0;
        let animationId = null;
        let magnet = { aktiv: false, x: 0, y: 0, staerke: 0 };

        // Scrollfortschritt 0 bis 1 über die gesamte Seite, und daraus die
        // geglättete Ordnung. Der Wert wird pro Bild gelesen, nicht pro
        // Scrollereignis: Die Schleife läuft ohnehin.
        let ordnung = 0;

        function scrollFortschritt() {
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            if (max <= 0) return 0;
            const p = window.scrollY / max;
            return p < 0 ? 0 : p > 1 ? 1 : p;
        }

        // Weiche Kurve: Die Ordnung setzt nicht sofort ein und rastet am Ende
        // nicht hart ein, sondern nähert sich an.
        function glaetten(t) { return t * t * (3 - 2 * t); }

        function mische(a, b, t) { return a + (b - a) * t; }

        function knotenzahl() {
            const flaeche = width * height;
            const kerne = navigator.hardwareConcurrency || 4;
            let n = Math.round(flaeche / 9200);
            if (kerne <= 4) n = Math.round(n * 0.6);
            return Math.max(config.minNodes, Math.min(config.maxNodes, n));
        }

        class Node {
            constructor(index, gesamt) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.45;
                this.vy = (Math.random() - 0.5) * 0.45;
                this.radius = config.nodeRadius + Math.random() * 1.8;
                this.pulseOffset = Math.random() * Math.PI * 2;
                this.istGold = Math.random() < 0.12;
                // Streuung des Zielpunkts, damit das geordnete Netz wie ein
                // Sternbild wirkt und nicht wie Karopapier.
                this.jitterX = (Math.random() - 0.5) * 0.55;
                this.jitterY = (Math.random() - 0.5) * 0.55;
                this.setzeZiel(index, gesamt);
            }

            /* Zielpunkt im Raster. Spalten und Zeilen folgen dem Seitenverhältnis,
               damit die Abstände in beide Richtungen ähnlich ausfallen. */
            setzeZiel(index, gesamt) {
                const spalten = Math.max(2, Math.round(Math.sqrt(gesamt * (width / Math.max(1, height)))));
                const zeilen = Math.max(2, Math.ceil(gesamt / spalten));
                const sp = index % spalten;
                const ze = Math.floor(index / spalten);
                const zellBreite = width / spalten;
                const zellHoehe = height / zeilen;
                this.zielX = (sp + 0.5 + this.jitterX) * zellBreite;
                this.zielY = (ze + 0.5 + this.jitterY) * zellHoehe;
            }

            update() {
                // Je geordneter, desto ruhiger das Eigenleben.
                const daempfung = 1 - ordnung * 0.8;
                this.x += this.vx * daempfung;
                this.y += this.vy * daempfung;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
                this.x = Math.max(0, Math.min(width, this.x));
                this.y = Math.max(0, Math.min(height, this.y));

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

            /* Die gezeichnete Lage liegt zwischen freier Bewegung und Zielpunkt.
               Nur dieser Wert wandert, die freie Bewegung läuft darunter
               unverändert weiter. Dadurch bleibt der Weg zurück nach oben
               genauso flüssig wie der Weg nach unten. */
            get zeichenX() { return mische(this.x, this.zielX, ordnung); }
            get zeichenY() { return mische(this.y, this.zielY, ordnung); }

            draw() {
                const px = this.zeichenX, py = this.zeichenY;
                const puls = Math.sin(time * 2 + this.pulseOffset) * 0.5 + 0.5;
                const dMaus = Math.hypot(px - mouseX, py - mouseY);
                const nah = dMaus < config.mouseRadius;

                // Der Goldanteil wächst mit der Ordnung. Oben tragen nur die
                // wenigen Sonderknoten Gold, unten kippt das ganze Netz dorthin.
                const goldAnteil = this.istGold
                    ? mische(0.75, 1, ordnung)
                    : mische(0, 0.88, ordnung);

                const grund = nah ? config.accentColor : config.baseColor;
                const farbe = {
                    r: Math.round(mische(grund.r, config.goldColor.r, goldAnteil)),
                    g: Math.round(mische(grund.g, config.goldColor.g, goldAnteil)),
                    b: Math.round(mische(grund.b, config.goldColor.b, goldAnteil))
                };

                const alpha = 0.5 + puls * 0.3 + ordnung * 0.15 + (nah ? 0.25 : 0);
                const r = this.radius * (nah ? 1.5 : 1);

                if (nah || this.istGold) {
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = `rgba(${farbe.r}, ${farbe.g}, ${farbe.b}, .8)`;
                }
                ctx.fillStyle = `rgba(${farbe.r}, ${farbe.g}, ${farbe.b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        function drawConnections() {
            const maxDist = mische(config.distanzLose, config.distanzFest, ordnung);
            const grundAlpha = mische(0.30, 0.58, ordnung);

            for (let i = 0; i < nodes.length; i++) {
                const ax = nodes[i].zeichenX, ay = nodes[i].zeichenY;
                for (let j = i + 1; j < nodes.length; j++) {
                    const bx = nodes[j].zeichenX, by = nodes[j].zeichenY;
                    const dx = ax - bx, dy = ay - by;
                    const dist = Math.hypot(dx, dy);
                    if (dist > maxDist) continue;

                    const naehe = 1 - dist / maxDist;
                    const mx = (ax + bx) / 2, my = (ay + by) / 2;
                    const nahMaus = Math.hypot(mx - mouseX, my - mouseY) < config.mouseRadius;

                    const grund = nahMaus ? config.accentColor : config.baseColor;
                    const goldAnteil = mische(0, 0.8, ordnung);
                    const f = {
                        r: Math.round(mische(grund.r, config.goldColor.r, goldAnteil)),
                        g: Math.round(mische(grund.g, config.goldColor.g, goldAnteil)),
                        b: Math.round(mische(grund.b, config.goldColor.b, goldAnteil))
                    };
                    const alpha = naehe * (nahMaus ? grundAlpha + 0.2 : grundAlpha);

                    ctx.strokeStyle = `rgba(${f.r}, ${f.g}, ${f.b}, ${alpha})`;
                    ctx.lineWidth = nahMaus ? 1.4 : mische(0.8, 1.25, ordnung);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
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
            ordnung = glaetten(scrollFortschritt());

            if (magnet.aktiv) {
                magnet.staerke *= 0.97;
                if (magnet.staerke < 0.01) { magnet.aktiv = false; magnet.staerke = 0; }
            }

            for (const n of nodes) n.update();
            render();

            animationId = requestAnimationFrame(frame);
        }

        function darfLaufen() {
            return !motionQuery.matches && !schmalQuery.matches && !document.hidden;
        }

        function starteSchleife() {
            if (!darfLaufen() || animationId !== null) return;
            animationId = requestAnimationFrame(frame);
        }

        function stoppeSchleife() {
            if (animationId === null) return;
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;

            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const soll = knotenzahl();
            if (nodes.length !== soll) {
                nodes = Array.from({ length: soll }, (unused, i) => new Node(i, soll));
            } else {
                // Zielraster an die neue Fläche anpassen, ohne die Knoten
                // neu zu würfeln.
                nodes.forEach((n, i) => n.setzeZiel(i, nodes.length));
            }
            ordnung = glaetten(scrollFortschritt());
            render();
        }

        // ── Start ────────────────────────────────────────────────────────────
        resize();
        if (darfLaufen()) starteSchleife();
        else render();   // genau ein Standbild, keine Schleife

        const beiModusWechsel = () => {
            if (darfLaufen()) starteSchleife();
            else { stoppeSchleife(); render(); }
        };
        [motionQuery, schmalQuery].forEach(q => {
            if (q.addEventListener) q.addEventListener('change', beiModusWechsel);
            else if (q.addListener) q.addListener(beiModusWechsel);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stoppeSchleife();
            else starteSchleife();
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 150);
        });

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget) { mouseX = -9999; mouseY = -9999; }
        });

        // Klick auf den freien Hintergrund zieht die Knoten kurz zusammen.
        // Bedienelemente bleiben unberührt, die Fläche nimmt keine Klicks an.
        document.addEventListener('click', (e) => {
            if (!darfLaufen()) return;
            if (e.target.closest('a, button, input, textarea, select, label, summary')) return;
            magnet = { aktiv: true, x: e.clientX, y: e.clientY, staerke: 1.6 };
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
