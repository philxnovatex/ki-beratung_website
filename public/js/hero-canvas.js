window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hero-canvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const maxParticles = window.matchMedia('(max-width: 768px)').matches ? 80 : 200;
  const spawnCount = window.matchMedia('(pointer: coarse)').matches ? 2 : 5;
  let dpr = window.devicePixelRatio || 1;

  const useThree = typeof THREE !== 'undefined';
  let camera;
  if (useThree) {
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 400;
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = canvas;
    canvas.width = clientWidth * dpr;
    canvas.height = clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (useThree) {
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }
  }
  resize();
  window.addEventListener('resize', resize);

  function addParticles(x, y) {
    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      const life = 60 + Math.random() * 40;
      const p = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 2 + Math.random() * 3,
        startHue: 200 + Math.random() * 20,
        endHue: 260 + Math.random() * 20
      };
      if (useThree) {
        p.z = Math.random() * 200 - 100;
        p.vz = Math.random() * 0.5 - 0.25;
        p.vector = new THREE.Vector3(x - canvas.clientWidth / 2, y - canvas.clientHeight / 2, p.z);
      }
      particles.push(p);
    }
    while (particles.length > maxParticles) particles.shift();
  }

  function pointerMove(e) {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX ?? e.touches[0].clientX) - rect.left;
    const y = (e.clientY ?? e.touches[0].clientY) - rect.top;
    addParticles(x, y);
  }

  hero.addEventListener('mousemove', pointerMove);
  hero.addEventListener('touchmove', pointerMove, { passive: true });

  // spawn a few particles initially so the effect is visible
  addParticles(canvas.clientWidth / 2, canvas.clientHeight / 2);

  function animate() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;

      let drawX = p.x;
      let drawY = p.y;
      let scale = 1;
      if (useThree) {
        p.z += p.vz;
        p.vector.set(p.x - canvas.clientWidth / 2, p.y - canvas.clientHeight / 2, p.z);
        const projected = p.vector.clone().project(camera);
        drawX = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
        drawY = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;
        scale = Math.max(0.1, 1 - p.z / 400);
      }

      const t = 1 - p.life / p.maxLife;
      const hue = p.startHue + (p.endHue - p.startHue) * t;
      const alpha = 1 - t;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;

      ctx.beginPath();
      ctx.arc(drawX, drawY, p.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  animate();
});
