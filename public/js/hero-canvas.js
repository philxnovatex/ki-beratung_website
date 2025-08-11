window.addEventListener('DOMContentLoaded', () => {
  if (!window.THREE) return;

  const canvases = [];
  const hero = document.getElementById('hero-canvas');
  if (hero) canvases.push(hero);
  document.querySelectorAll('[data-canvas="network"]').forEach(c => canvases.push(c));

  canvases.forEach(initNetworkCanvas);

  function initNetworkCanvas(canvas){
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);
  camera.position.z = 260;
    const group = new THREE.Group();
    scene.add(group);

  const isProblem = canvas.classList.contains('bg-canvas');
  const NODE_COUNT = isProblem ? 90 : 60;
    const positions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      // Spread wider horizontally for background, compress vertically towards top
      positions[i * 3] = (Math.random() - 0.5) * (isProblem ? 600 : 300);
      const yRange = isProblem ? 500 : 300;
      const yBias = isProblem ? -150 : 0; // push upwards so appears from top
      positions[i * 3 + 1] = (Math.random() - 0.1) * yRange + yBias; // slight upward bias
      positions[i * 3 + 2] = (Math.random() - 0.5) * (isProblem ? 600 : 300);
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const nodeMat = new THREE.PointsMaterial({ color: 0xffc947, size: 3, sizeAttenuation: true });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    const linePositions = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (Math.random() < 0.06) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x185adb, transparent: true, opacity: 0.5 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    function resize(){
      // Force bg canvas to match section height if needed
      if(isProblem){
        const section = canvas.closest('.problem-section');
        if(section){
          canvas.style.height = section.offsetHeight + 'px';
        }
      }
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    function animate(){
      requestAnimationFrame(animate);
  group.rotation.y += 0.0008;
  group.rotation.x += 0.00035;
      renderer.render(scene, camera);
    }
    animate();
  }
});
