// Audio player for the integrated demo on the homepage
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');

    // Exit if the player elements are not on the current page
    if (!audio || !playPauseBtn || !progressBar) {
        return;
    }

    // Play & Pause
    playPauseBtn.addEventListener('click', () => {
        const isPlaying = !audio.paused;
        if (isPlaying) {
            audio.pause();
            playPauseBtn.classList.remove('pause');
            playPauseBtn.classList.add('play');
        } else {
            audio.play();
            playPauseBtn.classList.remove('play');
            playPauseBtn.classList.add('pause');
        }
    });

    // Update progress bar
    audio.addEventListener('timeupdate', () => {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    // Set duration on load
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Seek on progress bar click
    progressBar.addEventListener('click', (e) => {
        const width = progressBar.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
    });

    // Reset when audio ends
    audio.addEventListener('ended', () => {
        playPauseBtn.classList.remove('pause');
        playPauseBtn.classList.add('play');
        audio.currentTime = 0;
    });

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
});
