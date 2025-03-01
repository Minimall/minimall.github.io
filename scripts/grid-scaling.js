// Simple image loading script
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');

  // Basic image loading check
  gridItems.forEach(item => {
    const media = item.querySelector('img, video');
    if (media) {
      if (media.tagName === 'IMG') {
        // Log when images are loaded
        media.addEventListener('load', function() {
          console.log(`Image loaded: ${media.src.split('/').pop()}`);
        });

        // Log if image fails to load
        media.addEventListener('error', function() {
          console.error(`Failed to load image: ${media.src.split('/').pop()}`);
        });
      } else if (media.tagName === 'VIDEO') {
        // Log when videos are loaded
        media.addEventListener('loadeddata', function() {
          console.log(`Video loaded: ${media.src ? media.src.split('/').pop() : 'embedded video'}`);
        });

        // Log if video fails to load
        media.addEventListener('error', function() {
          console.error(`Failed to load video: ${media.src ? media.src.split('/').pop() : 'embedded video'}`);
        });
      }
    }
  });
});