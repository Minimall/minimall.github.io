
document.addEventListener('DOMContentLoaded', () => {
  // Handle video hover playback
  const videoElements = document.querySelectorAll('.grid-item video');
  
  videoElements.forEach(video => {
    // Set initial size of container to 80%
    const container = video.closest('.grid-item');
    
    // Handle hover events for video playback
    container.addEventListener('mouseenter', () => {
      // First change z-index instantly
      container.style.zIndex = '9999';
      
      // Set transform to 100% scale
      requestAnimationFrame(() => {
        container.style.transform = 'scale(1.25)';
      });
      
      // Play the video
      video.play();
    });
    
    container.addEventListener('mouseleave', () => {
      // First reset the z-index immediately
      container.style.zIndex = '1';
      
      // Reset scale
      requestAnimationFrame(() => {
        container.style.transform = '';
      });
      
      // Pause the video and reset to beginning
      video.pause();
      video.currentTime = 0;
    });
  });
  
  // Touch screen support
  if ('ontouchstart' in window) {
    videoElements.forEach(video => {
      const container = video.closest('.grid-item');
      
      container.addEventListener('touchstart', () => {
        if (video.paused) {
          video.play();
          container.style.zIndex = '9999';
          container.style.transform = 'scale(1.25)';
        } else {
          video.pause();
          container.style.zIndex = '1';
          container.style.transform = '';
        }
      });
    });
  }
});
