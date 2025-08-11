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
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 200;
    const group = new THREE.Group();
    scene.add(group);

    const NODE_COUNT = 60;
    const positions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
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
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    function animate(){
      requestAnimationFrame(animate);
      group.rotation.y += 0.001;
      group.rotation.x += 0.0005;
      renderer.render(scene, camera);
    }
    animate();
  }
});
