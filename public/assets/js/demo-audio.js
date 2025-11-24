// Premium Audio Player with Waveform Animation
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressTrack = document.getElementById('progress-track');
    const progressFill = document.getElementById('progress-fill');
    const progressThumb = document.getElementById('progress-thumb');
    const waveformProgress = document.getElementById('waveform-progress');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const waveformBars = document.querySelectorAll('.bar');

    // Exit if elements don't exist
    if (!audio || !playPauseBtn || !progressTrack) {
        return;
    }

    let isPlaying = false;
    let isDragging = false;

    // Play/Pause functionality
    playPauseBtn.addEventListener('click', (e) => {
        // Ripple effect
        createRipple(e);
        
        if (isPlaying) {
            audio.pause();
            pauseAudio();
        } else {
            audio.play();
            playAudio();
        }
    });

    function playAudio() {
        isPlaying = true;
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        animateWaveform(true);
    }

    function pauseAudio() {
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        animateWaveform(false);
    }

    // Ripple effect
    function createRipple(e) {
        const ripple = playPauseBtn.querySelector('.btn-ripple');
        const rect = playPauseBtn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        
        setTimeout(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(0)';
            ripple.style.opacity = '1';
        }, 600);
    }

    // Waveform animation
    function animateWaveform(animate) {
        waveformBars.forEach((bar, index) => {
            if (animate) {
                bar.style.animationPlayState = 'running';
                bar.style.animationDelay = (index * 0.1) + 's';
            } else {
                bar.style.animationPlayState = 'paused';
            }
        });
    }

    // Update progress
    audio.addEventListener('timeupdate', () => {
        if (!isDragging) {
            const progress = (audio.currentTime / audio.duration) * 100;
            updateProgress(progress);
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    function updateProgress(percentage) {
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        progressFill.style.width = clampedPercentage + '%';
        waveformProgress.style.width = clampedPercentage + '%';
        progressThumb.style.left = clampedPercentage + '%';
    }

    // Set duration when loaded
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Progress bar interaction
    progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        const newTime = (percentage / 100) * audio.duration;
        audio.currentTime = newTime;
        updateProgress(percentage);
    });

    // Progress bar dragging
    let startX = 0;
    let startPercentage = 0;

    progressTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        const rect = progressTrack.getBoundingClientRect();
        startPercentage = ((e.clientX - rect.left) / rect.width) * 100;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const rect = progressTrack.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        updateProgress(percentage);
        
        // Update time display while dragging
        const newTime = (percentage / 100) * audio.duration;
        currentTimeEl.textContent = formatTime(newTime);
    }

    function onMouseUp(e) {
        if (!isDragging) return;
        isDragging = false;
        const rect = progressTrack.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        const newTime = (percentage / 100) * audio.duration;
        audio.currentTime = newTime;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // Audio ended
    audio.addEventListener('ended', () => {
        pauseAudio();
        audio.currentTime = 0;
        updateProgress(0);
        currentTimeEl.textContent = formatTime(0);
    });

    // Format time helper
    function formatTime(seconds) {
        if (!isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Initialize waveform
    animateWaveform(false);
    
    // Enhanced mobile touch support
    if ('ontouchstart' in window) {
        progressTrack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = progressTrack.getBoundingClientRect();
            const percentage = ((touch.clientX - rect.left) / rect.width) * 100;
            const newTime = (percentage / 100) * audio.duration;
            audio.currentTime = newTime;
            updateProgress(percentage);
        });
    }
});
