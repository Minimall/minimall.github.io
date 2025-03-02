
document.addEventListener('DOMContentLoaded', () => {
    // Set up click handlers for grid items
    const gridItems = document.querySelectorAll('.grid-item');
    
    gridItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            openCarousel(index);
        });
    });
    
    // Create carousel elements
    const body = document.body;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'carousel-overlay';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeCarousel();
        }
    });
    
    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    
    // Create navigation arrows
    const prevArrow = document.createElement('button');
    prevArrow.className = 'carousel-nav prev';
    prevArrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
        </svg>
    `;
    prevArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        showPreviousImage();
    });
    
    const nextArrow = document.createElement('button');
    nextArrow.className = 'carousel-nav next';
    nextArrow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
        </svg>
    `;
    nextArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        showNextImage();
    });
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'carousel-image-container';
    
    // Append all elements
    carouselContainer.appendChild(prevArrow);
    carouselContainer.appendChild(imageContainer);
    carouselContainer.appendChild(nextArrow);
    
    overlay.appendChild(carouselContainer);
    body.appendChild(overlay);
    
    // Track current image index
    let currentIndex = 0;
    let gridItemsArray = Array.from(gridItems);
    
    // Function to open carousel
    function openCarousel(index) {
        currentIndex = index;
        
        // Clear previous images
        imageContainer.innerHTML = '';
        
        // Get all image sources
        const imageSources = [];
        gridItemsArray.forEach(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            
            if (img) {
                imageSources.push({
                    type: 'image',
                    src: img.src,
                    alt: img.alt
                });
            } else if (video) {
                imageSources.push({
                    type: 'video',
                    src: video.querySelector('source').src,
                    alt: 'Video'
                });
            }
        });
        
        // Load current image
        loadImage(currentIndex, imageSources);
        
        // Show overlay
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleKeyDown);
    }
    
    // Function to close carousel
    function closeCarousel() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            imageContainer.innerHTML = '';
        }, 300);
        
        // Remove keyboard navigation
        document.removeEventListener('keydown', handleKeyDown);
    }
    
    // Function to load image
    function loadImage(index, sources) {
        if (index < 0 || index >= sources.length) return;
        
        imageContainer.innerHTML = '';
        
        const source = sources[index];
        
        if (source.type === 'image') {
            const img = document.createElement('img');
            img.src = source.src;
            img.alt = source.alt;
            img.className = 'carousel-image';
            imageContainer.appendChild(img);
        } else if (source.type === 'video') {
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.controls = true;
            video.className = 'carousel-image';
            
            const sourceEl = document.createElement('source');
            sourceEl.src = source.src;
            sourceEl.type = 'video/mp4';
            
            video.appendChild(sourceEl);
            imageContainer.appendChild(video);
        }
    }
    
    // Function to show next image
    function showNextImage() {
        const sources = getImageSources();
        currentIndex = (currentIndex + 1) % sources.length;
        loadImage(currentIndex, sources);
    }
    
    // Function to show previous image
    function showPreviousImage() {
        const sources = getImageSources();
        currentIndex = (currentIndex - 1 + sources.length) % sources.length;
        loadImage(currentIndex, sources);
    }
    
    // Function to get all image sources
    function getImageSources() {
        const imageSources = [];
        gridItemsArray.forEach(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video');
            
            if (img) {
                imageSources.push({
                    type: 'image',
                    src: img.src,
                    alt: img.alt
                });
            } else if (video) {
                imageSources.push({
                    type: 'video',
                    src: video.querySelector('source').src,
                    alt: 'Video'
                });
            }
        });
        return imageSources;
    }
    
    // Handle keyboard navigation
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            showPreviousImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        } else if (e.key === 'Escape') {
            closeCarousel();
        }
    }
});
