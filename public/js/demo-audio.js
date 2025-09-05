// Simple player UI for demo audio
const audio = document.getElementById('demo-audio');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const currentEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
const downloadBtn = document.getElementById('downloadBtn');

function formatTime(sec){
  if(!isFinite(sec)) return '—:—';
  const m = Math.floor(sec/60); const s = Math.floor(sec%60); return `${m}:${s.toString().padStart(2,'0')}`;
}

audio.addEventListener('loadedmetadata', ()=>{
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', ()=>{
  const pct = (audio.currentTime / audio.duration) * 100 || 0;
  progressBar.style.width = pct + '%';
  currentEl.textContent = formatTime(audio.currentTime);
});

playBtn.addEventListener('click', ()=>{
  if(audio.paused){ audio.play(); playBtn.textContent = 'Pause'; }
  else { audio.pause(); playBtn.textContent = 'Play'; }
});

// click to seek
progress.addEventListener('click', (e)=>{
  const rect = progress.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = Math.max(0, Math.min(1, pct)) * audio.duration;
});

// update download link timestamp to bust cache
(async function(){
  try{
    const resp = await fetch(downloadBtn.href, { method: 'HEAD' });
    if(resp && resp.headers){
      const size = resp.headers.get('content-length');
      if(size) downloadBtn.textContent = `Download (${Math.round(Number(size)/1024)} KB)`;
    }
  }catch(e){}
})();
