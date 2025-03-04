
document.addEventListener('DOMContentLoaded', function() {
    // Function to load the lab grid
    function loadLabGrid() {
        const gridContainer = document.getElementById('dynamic-grid');
        
        if (!gridContainer) {
            console.error('Grid container not found');
            return;
        }

        // Hardcoded list of files in the lab directory
        const files = [
            // Original content
            '2-week-sprint.avif',
            'design-skillset.avif',
            'healthcare.avif',
            'heateye-graphics.jpg',
            'heateye-logos.jpg',
            'heateye-tote.jpg',
            'graphic.mp4',
            'globallogic.mp4',
            // New content
            'color-wave.png',
            'singularity.png',
            'innomatix.avif',
            'medavante.avif',
            'monte.avif',
            'wcg.webp'
        ];

        // If there are no files, show a message
        if (files.length === 0) {
            const noImagesMessage = document.createElement('div');
            noImagesMessage.className = 'no-images-message';
            noImagesMessage.textContent = 'No images found in the lab directory.';
            gridContainer.appendChild(noImagesMessage);
            return;
        }

        // Shuffle the array to create a random arrangement
        const shuffledFiles = [...files].sort(() => Math.random() - 0.5);

        // Create grid items for each file
        shuffledFiles.forEach((file, index) => {
            const gridItem = document.createElement('div');
            gridItem.className = `grid-item item-${(index % 6) + 1}`;
            
            // Determine if the file is a video
            const isVideo = file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov');
            
            if (isVideo) {
                const video = document.createElement('video');
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;
                video.controls = false; // No controls for clean UI
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                
                // Special handling for specific videos if needed
                if (file === 'globallogic.mp4') {
                    console.log('Loading GlobalLogic video');
                    video.addEventListener('loadeddata', () => {
                        console.log('GlobalLogic video loaded successfully');
                    });
                    video.addEventListener('error', (e) => {
                        console.error('Error loading GlobalLogic video:', e);
                    });
                }

                const source = document.createElement('source');
                source.src = `images/lab/${file}`;
                source.type = file.endsWith('.mp4') ? 'video/mp4' : 
                              file.endsWith('.webm') ? 'video/webm' : 
                              'video/quicktime';

                video.appendChild(source);
                gridItem.appendChild(video);
                
                // Force video play
                setTimeout(() => {
                    video.play().catch(e => console.warn('Auto-play prevented:', e));
                }, 100);
            } else {
                const img = document.createElement('img');
                img.src = `images/lab/${file}`;
                img.alt = file.split('.')[0].replace(/-/g, ' ');
                img.loading = "lazy";
                gridItem.appendChild(img);
            }

            // Add click event to open in full view
            gridItem.addEventListener('click', function() {
                if (window.hoverJS && window.hoverJS.handleImageClick) {
                    window.hoverJS.handleImageClick(this);
                }
            });

            gridContainer.appendChild(gridItem);
        });

        // Initialize hover effects after grid is loaded
        if (window.hoverJS && window.hoverJS.setupHoverEffects) {
            setTimeout(() => {
                window.hoverJS.setupHoverEffects();
            }, 500);
        }
    }

    // Log for debugging
    console.log('Starting lab grid loading process...');
    
    // Start the grid loading process
    loadLabGrid();
    
    // Log completion
    console.log('Lab grid loading process initiated');

    // Reload grid on resize to ensure proper layout
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Clear the grid
            const gridContainer = document.getElementById('dynamic-grid');
            if (gridContainer) {
                gridContainer.innerHTML = '';
                loadLabGrid();
            }
        }, 250);
    });
});
