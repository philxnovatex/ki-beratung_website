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

    if(isHero){
      const gradGeo = new THREE.PlaneGeometry(1600, 1600);
      const gradMat = new THREE.MeshBasicMaterial({ color: 0x0b1733, transparent: true, opacity: 0.55 });
      const plane = new THREE.Mesh(gradGeo, gradMat);
      plane.position.z = -420;
      scene.add(plane);
    }

    const group = new THREE.Group();
    scene.add(group);

    // Nodes
    const NODE_COUNT = prefersReduced ? 120 : (isHero ? 210 : 90);
    const spreadXY = isHero ? 700 : 480;
    const spreadZ  = isHero ? 820 : 480;
    const positions = new Float32Array(NODE_COUNT * 3);
    for(let i=0;i<NODE_COUNT;i++){
      const rx=(Math.random()*2-1), ry=(Math.random()*2-1), rz=(Math.random()*2-1);
      const d=Math.cbrt(Math.random());
      positions[i*3]   = rx * spreadXY * d;
      positions[i*3+1] = ry * (isHero?400:300) * d;
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
    const nodeMat = new THREE.PointsMaterial({ color:0xffc947, size:isHero?3:2.8, sizeAttenuation:true });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    // Lines (proximity)
    const linePositions=[]; const maxLinks=isHero?10:7; const maxDistSq=isHero?160*160:120*120;
    for(let i=0;i<NODE_COUNT;i++){
      let links=0; const ax=positions[i*3], ay=positions[i*3+1], az=positions[i*3+2];
      for(let j=i+1;j<NODE_COUNT && links<maxLinks;j++){
        const bx=positions[j*3], by=positions[j*3+1], bz=positions[j*3+2];
        const dx=ax-bx, dy=ay-by, dz=az-bz; const distSq=dx*dx+dy*dy+dz*dz;
        if(distSq<maxDistSq && Math.random()<0.6){ linePositions.push(ax,ay,az,bx,by,bz); links++; }
      }
    }
    const lineGeo=new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions),3));
    const lineMat=new THREE.LineBasicMaterial({ color:0x185adb, transparent:true, opacity:0.55 });
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
      tileCount = prefersReduced?25:65;
      const tileGeo=new THREE.PlaneGeometry(14,14);
      const tileMat=new THREE.MeshBasicMaterial({ color:0xffc947, transparent:true, opacity:0.7 });
      tiles=new THREE.InstancedMesh(tileGeo,tileMat,tileCount); dummy=new THREE.Object3D();
      for(let i=0;i<tileCount;i++){
        dummy.position.set((Math.random()*2-1)*spreadXY*0.85,(Math.random()*2-1)*400,(Math.random()*2-1)*spreadZ*0.6);
        dummy.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
        const s=0.55+Math.random()*0.85; dummy.scale.set(s,s,s); dummy.updateMatrix(); tiles.setMatrixAt(i,dummy.matrix);
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
      group.rotation.y += isHero?0.0006:0.0005;
      group.rotation.x += isHero?0.00024:0.0002;
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
          if(p[idx+1]>400||p[idx+1]<-400) velocities[idx+1]*=-1;
          if(p[idx+2]>spreadZ||p[idx+2]<-spreadZ) velocities[idx+2]*=-1;
          if(repulseTimer>0){ const f=0.018; velocities[idx]+=p[idx]*f; velocities[idx+1]+=p[idx+1]*f; velocities[idx+2]+=p[idx+2]*f; }
        }
        if(repulseTimer>0){ repulseTimer-=0.02; if(repulseTimer<0) repulseTimer=0; }
        posAttr.needsUpdate=true;
      }
      // Pulse & breathing & sweep & tiles
      if(isHero){
        if(pulseMat){ pulseMat.size = basePulseSize + Math.sin(t*2.2)*0.85; lineMat.opacity = 0.50 + Math.sin(t*1.1)*0.12; }
        if(sweep){ sweep.position.y += 1.1*sweepDir; if(sweep.position.y>400) sweepDir=-1; else if(sweep.position.y<-480) sweepDir=1; }
        if(tiles && !prefersReduced){
          for(let i=0;i<tileCount;i+=3){ tiles.getMatrixAt(i,dummy.matrix); dummy.rotation.z += 0.004; dummy.updateMatrix(); tiles.setMatrixAt(i,dummy.matrix); }
          tiles.instanceMatrix.needsUpdate=true;
        }
      }
      renderer.render(scene,camera);
    }
    animate();
  }
});
