
// Handle hover image effects for desktop
document.addEventListener("DOMContentLoaded", () => {
  // Only apply hover effects on desktop
  if (window.matchMedia('(min-width: 789px)').matches) {
    setupHoverImages();
  }
});

function setupHoverImages() {
  // Find all elements with data-images attribute
  const elements = document.querySelectorAll('[data-images]');
  
  elements.forEach(element => {
    const imageUrls = element.dataset.images.split(',');
    if (imageUrls.length === 0) return;
    
    // Create hover image container
    const hoverContainer = document.createElement('div');
    hoverContainer.className = 'hover-image';
    hoverContainer.style.position = 'fixed';
    hoverContainer.style.zIndex = '9999';
    hoverContainer.style.pointerEvents = 'none';
    hoverContainer.style.opacity = '0';
    hoverContainer.style.transition = 'opacity 0.3s ease';
    hoverContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    hoverContainer.style.borderRadius = '8px';
    hoverContainer.style.overflow = 'hidden';
    hoverContainer.style.transform = 'translate(-50%, -50%) rotate(2deg) scale(0)';
    hoverContainer.style.transformOrigin = 'center center';
    hoverContainer.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.18, 1.3, 0.4, 1)';
    document.body.appendChild(hoverContainer);
    
    // Create image element
    const img = document.createElement('img');
    img.src = `/images/${imageUrls[0]}`;
    img.style.maxWidth = '300px';
    img.style.maxHeight = '300px';
    img.style.display = 'block';
    hoverContainer.appendChild(img);
    
    // Image rotation counter for this element
    let rotationCounter = 0;
    
    // Track current image index for this element
    let currentImageIndex = 0;
    
    // Handle mouse enter
    element.addEventListener('mouseenter', () => {
      hoverContainer.style.opacity = '1';
      const rotation = ((rotationCounter % 2 === 0) ? 2 : -2);
      rotationCounter++;
      hoverContainer.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
    });
    
    // Handle mouse move
    element.addEventListener('mousemove', (e) => {
      // Position the image at the mouse cursor
      const x = e.clientX;
      const y = e.clientY;
      hoverContainer.style.left = `${x}px`;
      hoverContainer.style.top = `${y}px`;
      
      // If we have multiple images, switch on mouse movement
      if (imageUrls.length > 1) {
        // Switch images based on horizontal mouse movement
        const rect = element.getBoundingClientRect();
        const elementWidth = rect.width;
        const mouseX = e.clientX - rect.left;
        const percentage = mouseX / elementWidth;
        const imageIndex = Math.min(
          Math.floor(percentage * imageUrls.length),
          imageUrls.length - 1
        );
        
        if (imageIndex !== currentImageIndex) {
          currentImageIndex = imageIndex;
          img.src = `/images/${imageUrls[currentImageIndex]}`;
        }
      }
    });
    
    // Handle mouse leave
    element.addEventListener('mouseleave', () => {
      hoverContainer.style.opacity = '0';
      hoverContainer.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(0)';
      
      // Reset to first image
      currentImageIndex = 0;
      img.src = `/images/${imageUrls[0]}`;
    });
  });
}
