window.addEventListener('DOMContentLoaded', () => {
  if(!window.THREE) return;
  const hero = document.getElementById('hero-canvas');
  if(hero) initNetwork(hero, { mode: 'hero' });

  function initNetwork(canvas, { mode }) {
    const isHero = mode === 'hero';
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1600);
    camera.position.z = isHero ? 430 : 260;

  // No extra background plane; rely on CSS background to avoid left tint bands

    const group = new THREE.Group();
    scene.add(group);

  // Nodes
  const NODE_COUNT = prefersReduced ? 110 : (isHero ? 190 : 90);
  const spreadXY = isHero ? 680 : 480;
  // Keep a slab-like vertical spread for a planar neural net look
  const spreadY  = isHero ? 200 : 260;
  const spreadZ  = isHero ? 700 : 480;
    const positions = new Float32Array(NODE_COUNT * 3);
    for(let i=0;i<NODE_COUNT;i++){
      const rx=(Math.random()*2-1), ry=(Math.random()*2-1), rz=(Math.random()*2-1);
      const d=Math.cbrt(Math.random());
      positions[i*3]   = rx * spreadXY * d;
  positions[i*3+1] = ry * spreadY * d;
      positions[i*3+2] = rz * spreadZ * d;
    }
    const nodeGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions,3);
    nodeGeo.setAttribute('position', posAttr);
    const velocities = isHero && !prefersReduced ? new Float32Array(NODE_COUNT*3) : null;
    if(velocities){
      for(let i=0;i<NODE_COUNT;i++){
        velocities[i*3]   = (Math.random()*2-1)*0.12;
        velocities[i*3+1] = (Math.random()*2-1)*0.10;
        velocities[i*3+2] = (Math.random()*2-1)*0.12;
      }
    }
    const nodeMat = new THREE.PointsMaterial({ color:0xb7d6ff, size:isHero?2.8:2.6, sizeAttenuation:true, transparent:true, opacity:0.95 });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    // Lines (k-nearest neighbors for cleaner neural graph)
    const K = isHero ? 4 : 3;
    const maxDistSq = isHero ? (160*160) : (120*120);
    const edges = [];
    const edgeSet = new Set();
    for(let i=0;i<NODE_COUNT;i++){
      // Collect distances to all others
      const ax=positions[i*3], ay=positions[i*3+1], az=positions[i*3+2];
      const arr=[];
      for(let j=0;j<NODE_COUNT;j++) if(j!==i){
        const bx=positions[j*3], by=positions[j*3+1], bz=positions[j*3+2];
        const dx=ax-bx, dy=ay-by, dz=az-bz; const distSq=dx*dx+dy*dy+dz*dz;
        if(distSq<maxDistSq) arr.push([j, distSq]);
      }
      arr.sort((a,b)=>a[1]-b[1]);
      const limit = Math.min(K, arr.length);
      for(let n=0;n<limit;n++){
        const j=arr[n][0]; const a=i<j?i:j; const b=i<j?j:i; const key=a+"-"+b;
        if(!edgeSet.has(key)){ edgeSet.add(key); edges.push([a,b]); }
      }
    }
    const lineGeo=new THREE.BufferGeometry();
    const linePositions=new Float32Array(edges.length*6);
    const lineAttr=new THREE.BufferAttribute(linePositions,3);
    lineGeo.setAttribute('position', lineAttr);
    const lineMat=new THREE.LineBasicMaterial({ color:0x3aa0ff, transparent:true, opacity:0.42, blending: THREE.AdditiveBlending });
    const lines=new THREE.LineSegments(lineGeo,lineMat); group.add(lines);

    // Pulse cluster + sweep + tiles (hero only)
    let pulseMat, basePulseSize, sweep, tiles, tileCount=0, dummy;
    if(isHero){
      // Pulse
      const PULSE_COUNT = prefersReduced?12:36;
      const pulseGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(PULSE_COUNT*3);
      for(let i=0;i<PULSE_COUNT;i++){
        const a=Math.random()*Math.PI*2; const r=40+Math.random()*140;
        pPos[i*3]=Math.cos(a)*r; pPos[i*3+1]=(Math.random()*2-1)*38; pPos[i*3+2]=Math.sin(a)*r;
      }
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
      pulseMat = new THREE.PointsMaterial({ color:0x185adb, size:2.1, transparent:true, opacity:0.5 });
      const pulse = new THREE.Points(pulseGeo, pulseMat); group.add(pulse); basePulseSize=pulseMat.size;
      // Sweep
      const sweepGeo=new THREE.PlaneGeometry(1400,1400);
      const sweepMat=new THREE.MeshBasicMaterial({ color:0x185adb, transparent:true, opacity:0.045 });
      sweep=new THREE.Mesh(sweepGeo,sweepMat); sweep.rotation.x=Math.PI/2; sweep.position.y=-480; scene.add(sweep);
      // Tiles
  tileCount = prefersReduced?24:58;
      const tileGeo=new THREE.PlaneGeometry(14,14);
      const tileMat=new THREE.MeshBasicMaterial({ color:0xffc947, transparent:true, opacity:0.7 });
      tiles=new THREE.InstancedMesh(tileGeo,tileMat,tileCount); dummy=new THREE.Object3D();
      for(let i=0;i<tileCount;i++){
        dummy.position.set((Math.random()*2-1)*spreadXY*0.85,(Math.random()*2-1)*400,(Math.random()*2-1)*spreadZ*0.6);
        dummy.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
        const s=0.5+Math.random()*0.45; dummy.scale.set(s,s,s); dummy.updateMatrix(); tiles.setMatrixAt(i,dummy.matrix);
      }
      scene.add(tiles);
    }

    function resize(){
      const rect = canvas.getBoundingClientRect();
      const w = rect.width; const h = rect.height || (isHero?window.innerHeight:400);
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener('resize', resize);

    let mouseX=0, mouseY=0;
    if(isHero && !prefersReduced){
      window.addEventListener('mousemove', e=>{
        const cx=window.innerWidth/2, cy=window.innerHeight/2;
        mouseX=(e.clientX-cx)/cx; mouseY=(e.clientY-cy)/cy;
      }, { passive:true });
    }
    let repulseTimer=0; if(isHero && !prefersReduced){ canvas.addEventListener('click', ()=>{ repulseTimer=1; }); }

    // Animation state
    let t=0, sweepDir=1;

    function animate(){
      requestAnimationFrame(animate);
      t+=0.01;
  group.rotation.y += isHero?0.0005:0.00045;
  group.rotation.x += isHero?0.0002:0.00018;
      if(isHero && !prefersReduced){
        group.position.x += ((mouseX*65)-group.position.x)*0.045;
        group.position.y += ((-mouseY*65)-group.position.y)*0.045;
      }
      // Nodes drift
      if(velocities){
        const p=posAttr.array;
        for(let i=0;i<NODE_COUNT;i++){
          const idx=i*3; p[idx]+=velocities[idx]; p[idx+1]+=velocities[idx+1]; p[idx+2]+=velocities[idx+2];
          if(p[idx]>spreadXY||p[idx]<-spreadXY) velocities[idx]*=-1;
          if(p[idx+1]>spreadY||p[idx+1]<-spreadY) velocities[idx+1]*=-1;
          if(p[idx+2]>spreadZ||p[idx+2]<-spreadZ) velocities[idx+2]*=-1;
          if(repulseTimer>0){ const f=0.014; velocities[idx]+=p[idx]*f; velocities[idx+1]+=p[idx+1]*f; velocities[idx+2]+=p[idx+2]*f; }
        }
        if(repulseTimer>0){ repulseTimer-=0.02; if(repulseTimer<0) repulseTimer=0; }
        posAttr.needsUpdate=true;
      }
      // Update line geometry each frame from current node positions
      if(edges.length){
        const p=posAttr.array; const lp=lineAttr.array;
        for(let e=0;e<edges.length;e++){
          const a=edges[e][0]*3, b=edges[e][1]*3, o=e*6;
          lp[o]   = p[a];   lp[o+1] = p[a+1]; lp[o+2] = p[a+2];
          lp[o+3] = p[b];   lp[o+4] = p[b+1]; lp[o+5] = p[b+2];
        }
        lineAttr.needsUpdate = true;
      }
      // Pulse & breathing & sweep & tiles
      if(isHero){
        if(pulseMat){ pulseMat.size = basePulseSize + Math.sin(t*2.0)*0.75; lineMat.opacity = 0.42 + Math.sin(t*1.1)*0.1; }
        if(sweep){ sweep.position.y += 1.1*sweepDir; if(sweep.position.y>400) sweepDir=-1; else if(sweep.position.y<-480) sweepDir=1; }
        if(tiles && !prefersReduced){
          for(let i=0;i<tileCount;i+=4){ tiles.getMatrixAt(i,dummy.matrix); dummy.rotation.z += 0.0035; dummy.updateMatrix(); tiles.setMatrixAt(i,dummy.matrix); }
          tiles.instanceMatrix.needsUpdate=true;
        }
      }
      renderer.render(scene,camera);
    }
    animate();
  }
});
