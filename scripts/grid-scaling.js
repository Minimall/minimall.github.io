// Script to adjust grid item aspect ratios to match their images
document.addEventListener('DOMContentLoaded', function() {
  // Wait for images to load
  window.addEventListener('load', function() {
    const gridItems = document.querySelectorAll('.grid-item');

    gridItems.forEach(item => {
      const img = item.querySelector('img');
      if (img) {
        // Wait for the image to be fully loaded
        if (img.complete) {
          setAspectRatio(item, img);
        } else {
          img.onload = function() {
            setAspectRatio(item, img);
          };
        }
      }

      // Handle videos too
      const video = item.querySelector('video');
      if (video) {
        video.onloadedmetadata = function() {
          setAspectRatio(item, video);
        };
      }
    });
  });

  // Function to set the aspect ratio of the container
  function setAspectRatio(container, media) {
    const aspectRatio = media.naturalWidth / media.naturalHeight;

    // Apply the aspect ratio to the container using CSS custom property
    container.style.setProperty('--aspect-ratio', aspectRatio);
    container.style.aspectRatio = aspectRatio;
  }
});

// Simple grid initialization script
document.addEventListener('DOMContentLoaded', function() {
  const gridItems = document.querySelectorAll('.grid-item');

  // Add random subtle rotation to some items for dynamic composition
  gridItems.forEach((item, index) => {
    // Apply subtle rotation to every other item
    if (index % 2 === 0) {
      const randomRotation = (Math.random() * 2 - 1) * 0.5; // Between -0.5 and 0.5 degrees
      item.style.transform = `rotate(${randomRotation}deg)`;
    }

    // Basic image loading check
    const media = item.querySelector('img, video');
    if (media) {
      if (media.tagName === 'IMG') {
        // Set z-index randomly between items to create interesting overlaps
        item.style.zIndex = Math.floor(Math.random() * 3) + 1;

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