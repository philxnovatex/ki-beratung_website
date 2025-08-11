window.addEventListener('DOMContentLoaded', () => {
  if(!window.THREE) return;

  const hero = document.getElementById('hero-canvas');
  if(hero){ initNetwork(hero, { mode: 'hero' }); }

  function initNetwork(canvas, { mode }) {
    const isHero = mode === 'hero';
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1600);
    camera.position.z = isHero ? 410 : 260;

    // Subtle gradient backdrop plane (adds depth if hero)
    if(isHero){
      const gradGeo = new THREE.PlaneGeometry(1600, 1600, 1, 1);
      const gradMat = new THREE.MeshBasicMaterial({ color: 0x0b1733, transparent: true, opacity: 0.6 });
      const plane = new THREE.Mesh(gradGeo, gradMat);
      plane.position.z = -400;
      scene.add(plane);
    }

    const group = new THREE.Group();
    scene.add(group);

    // Parameters
    const NODE_COUNT = isHero ? 160 : 90;
    const spreadXY = isHero ? 650 : 500;
    const spreadZ = isHero ? 800 : 500;
    const positions = new Float32Array(NODE_COUNT * 3);

    for(let i=0;i<NODE_COUNT;i++){
      // Distribute in a sphere-ish volume with bias to center but full height
      const rx = (Math.random()*2-1);
      const ry = (Math.random()*2-1);
      const rz = (Math.random()*2-1);
      const d = Math.cbrt(Math.random()); // denser core
      positions[i*3]     = rx * spreadXY * d;
      positions[i*3 + 1] = ry * (isHero ? 420 : 300) * d; // full vertical coverage
      positions[i*3 + 2] = rz * spreadZ * d;
    }
    const nodeGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    nodeGeo.setAttribute('position', posAttr);
    // Velocity array for subtle autonomous motion (hero only)
    const velocities = isHero ? new Float32Array(NODE_COUNT * 3) : null;
    if(velocities){
      for(let i=0;i<NODE_COUNT;i++){
        velocities[i*3] = (Math.random()*2-1)*0.15;
        velocities[i*3+1] = (Math.random()*2-1)*0.12;
        velocities[i*3+2] = (Math.random()*2-1)*0.15;
      }
    }
  const nodeMat = new THREE.PointsMaterial({ color: 0xffc947, size: isHero ? 3.2 : 2.8, sizeAttenuation: true });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    // Lines (proximity based instead of random probability alone)
    const linePositions = [];
    const maxLinks = isHero ? 9 : 7;
    const maxDistSq = isHero ? 140*140 : 120*120;
    for(let i=0;i<NODE_COUNT;i++){
      let links = 0;
      const ax = positions[i*3], ay = positions[i*3+1], az = positions[i*3+2];
      for(let j=i+1;j<NODE_COUNT && links < maxLinks;j++){
        const bx = positions[j*3], by = positions[j*3+1], bz = positions[j*3+2];
        const dx = ax-bx, dy = ay-by, dz = az-bz;
        const distSq = dx*dx+dy*dy+dz*dz;
        if(distSq < maxDistSq && Math.random() < 0.55){
          linePositions.push(ax,ay,az,bx,by,bz); links++;
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x185adb, transparent: true, opacity: 0.55 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    // Add a pulsing radial sprite cluster for subtle WOW
  if(isHero){
      const pulseGeo = new THREE.BufferGeometry();
      const PULSE_COUNT = 40;
      const pPositions = new Float32Array(PULSE_COUNT * 3);
      for(let i=0;i<PULSE_COUNT;i++){
        const a = Math.random()*Math.PI*2;
        const r = 40 + Math.random()*140;
        pPositions[i*3] = Math.cos(a)*r;
        pPositions[i*3+1] = (Math.random()*2-1)*40;
        pPositions[i*3+2] = Math.sin(a)*r;
      }
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pPositions,3));
      const pulseMat = new THREE.PointsMaterial({ color: 0x185adb, size: 2.2, transparent:true, opacity:0.55 });
      const pulse = new THREE.Points(pulseGeo, pulseMat);
      group.add(pulse);
      let t=0;
      const baseSize = pulseMat.size;
      function pulseTick(){
        t+=0.01; pulseMat.size = baseSize + Math.sin(t*2)*0.7; requestAnimationFrame(pulseTick);
      }
      pulseTick();
      // Light sweep plane to simulate scanning
      const sweepGeo = new THREE.PlaneGeometry(1400, 1400);
      const sweepMat = new THREE.MeshBasicMaterial({ color: 0x185adb, transparent:true, opacity:0.05 });
      const sweep = new THREE.Mesh(sweepGeo, sweepMat);
      sweep.rotation.x = Math.PI/2;
      sweep.position.y = -500;
      scene.add(sweep);
      let sweepDir = 1;
      function sweepTick(){
        sweep.position.y += 1.2 * sweepDir;
        if(sweep.position.y > 420) sweepDir = -1; else if(sweep.position.y < -500) sweepDir = 1;
        requestAnimationFrame(sweepTick);
      }
      sweepTick();
    }

    function resize(){
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height || (isHero ? window.innerHeight : 400);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0, mouseY = 0;
    if(isHero){
      window.addEventListener('mousemove', e => {
        const cx = window.innerWidth/2;
        const cy = window.innerHeight/2;
        mouseX = (e.clientX - cx)/cx;
        mouseY = (e.clientY - cy)/cy;
      }, { passive:true });
    }

    let repulseTimer = 0;
    if(isHero){
      canvas.addEventListener('click', () => { repulseTimer = 1; });
    }

    function animate(){
      requestAnimationFrame(animate);
  group.rotation.y += isHero ? 0.0007 : 0.00055;
  group.rotation.x += isHero ? 0.00028 : 0.00022;
      if(isHero){
        // Parallax shift
        group.position.x += ((mouseX * 40) - group.position.x) * 0.03;
        group.position.y += ((-mouseY * 40) - group.position.y) * 0.03;

        // Autonomous node drift + occasional repulsion burst
        if(velocities){
          const p = posAttr.array;
            for(let i=0;i<NODE_COUNT;i++){
              const idx = i*3;
              p[idx]   += velocities[idx];
              p[idx+1] += velocities[idx+1];
              p[idx+2] += velocities[idx+2];
              // Bounds & bounce
              if(p[idx] > spreadXY || p[idx] < -spreadXY) velocities[idx] *= -1;
              if(p[idx+1] > 420 || p[idx+1] < -420) velocities[idx+1] *= -1;
              if(p[idx+2] > spreadZ || p[idx+2] < -spreadZ) velocities[idx+2] *= -1;
              if(repulseTimer > 0){
                const fx = p[idx] * 0.015;
                const fy = p[idx+1] * 0.015;
                const fz = p[idx+2] * 0.015;
                velocities[idx]   += fx;
                velocities[idx+1] += fy;
                velocities[idx+2] += fz;
              }
            }
            if(repulseTimer > 0){
              repulseTimer -= 0.02;
              if(repulseTimer < 0) repulseTimer = 0;
            }
            posAttr.needsUpdate = true;
        }
      }
      renderer.render(scene, camera);
    }
    animate();
  }
});
