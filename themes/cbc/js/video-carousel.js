(function() {
  const videoContainer = document.getElementById('videoTestimonials');
  const videos = document.querySelectorAll('.testimonial-video');
  const unmuteBtn = document.getElementById('videoUnmuteBtn');
  let currentIndex = 0;
  let isMuted = true;

  if (videos.length === 0) return;

  // Play first video
  videos[currentIndex].play();

  // Unmute toggle
  if (unmuteBtn) {
    unmuteBtn.addEventListener('click', function() {
      isMuted = !isMuted;
      videos.forEach(video => video.muted = isMuted);
      
      const icon = this.querySelector('i');
      if (isMuted) {
        icon.className = 'fas fa-volume-mute';
        this.title = 'Click to unmute';
      } else {
        icon.className = 'fas fa-volume-up';
        this.title = 'Click to mute';
      }
    });
  }

  // Auto-advance to next video when current one ends
  videos.forEach((video, index) => {
    video.addEventListener('ended', function() {
      // Hide current video
      videos[currentIndex].classList.remove('active');
      
      // Move to next video (loop back to start if at end)
      currentIndex = (currentIndex + 1) % videos.length;
      
      // Show and play next video
      videos[currentIndex].classList.add('active');
      videos[currentIndex].muted = isMuted;
      videos[currentIndex].play();
    });
  });
})();
