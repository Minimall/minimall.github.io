/**
 * Grid Loader Script
 * Dynamically loads and arranges items in a Swiss typographic grid design
 * using hardcoded image paths
 */
document.addEventListener('DOMContentLoaded', function() {
    // Function to create grid items
    function createGridItem(file, index) {
        // Check if the file is a supported format
        const isVideo = file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov');

        const gridItem = document.createElement('div');
        gridItem.className = `grid-item item-${index + 1}`;
        gridItem.setAttribute('data-index', index);

        if (isVideo) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            
            // Ensure container is not smaller than 40% of original size
            gridItem.style.minWidth = '40%';
            gridItem.style.minHeight = '40%';

            // Set default aspect ratio for videos (16:9)
            gridItem.style.aspectRatio = '16/9';
            
            // Update aspect ratio when video metadata is loaded
            video.addEventListener('loadedmetadata', function() {
                const aspectRatio = this.videoWidth / this.videoHeight;
                gridItem.style.aspectRatio = aspectRatio;
            });

            const source = document.createElement('source');
            source.src = `images/lab/${file}`;
            source.type = file.endsWith('.mp4') ? 'video/mp4' : 
                          file.endsWith('.webm') ? 'video/webm' : 'video/quicktime';

            video.appendChild(source);
            gridItem.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = `images/lab/${file}`;
            img.alt = file.split('.')[0].replace(/-/g, ' ');
            
            // Ensure container is not smaller than 40% of original size
            gridItem.style.minWidth = '40%';
            gridItem.style.minHeight = '40%';
            
            // Set aspect ratio once image is loaded
            img.onload = function() {
                const aspectRatio = this.naturalWidth / this.naturalHeight;
                gridItem.style.aspectRatio = aspectRatio;
            };

            gridItem.appendChild(img);
        }

        return gridItem;
    }

    // Main function to load and display grid items
    function loadLabGrid() {
        const gridContainer = document.getElementById('dynamic-grid');
        if (!gridContainer) return;

        // Clear existing items
        gridContainer.innerHTML = '';

        // Hardcoded list of files in the lab directory
        const files = [
            '2-week-sprint.avif',
            'design-skillset.avif',
            'healthcare.avif',
            'innomatix.avif',
            'medavante.avif',
            'monte.avif',
            'wcg.webp',
            'heateye-graphics.jpg',
            'heateye-logos.jpg',
            'heateye-tote.jpg',
            'graphic.mp4',
            'globallogic.mp4',
            'color-wave.png',
            'singularity.png'
        ];

        // If there are no files, show a message
        if (!files || files.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'No images found in the lab folder.';
            message.style.textAlign = 'center';
            message.style.gridColumn = '1 / -1';
            gridContainer.appendChild(message);
            return;
        }

        // Create grid items for each file
        files.forEach((file, index) => {
            const gridItem = createGridItem(file, index);
            gridContainer.appendChild(gridItem);
        });

        // Apply Swiss design principles - positioning, overlaps, etc.
        applySwissDesignPrinciples(gridContainer, files.length);
    }

    // Apply Swiss design principles to the grid
    function applySwissDesignPrinciples(gridContainer, itemCount) {
        // Set custom grid properties based on number of items
        // This helps maintain the proper density and spatial distribution

        // Adjust grid properties based on screen size
        const isDesktop = window.matchMedia('(min-width: 1201px)').matches;
        const isTablet = window.matchMedia('(min-width: 789px) and (max-width: 1200px)').matches;
        const isMobile = window.matchMedia('(max-width: 788px)').matches;

        if (isDesktop) {
            gridContainer.style.setProperty('--grid-columns', '12');
            gridContainer.style.setProperty('--grid-rows', Math.max(12, Math.ceil(itemCount / 2)));
        } else if (isTablet) {
            gridContainer.style.setProperty('--grid-columns', '8');
            gridContainer.style.setProperty('--grid-rows', Math.max(16, Math.ceil(itemCount / 1.5)));
        } else {
            // Mobile layout is a single column
            gridContainer.style.setProperty('--grid-columns', '4');
            gridContainer.style.setProperty('--grid-rows', itemCount * 2);
        }

        // Apply module-based spacing for all views
        if (!isMobile) {
            const gridItems = gridContainer.querySelectorAll('.grid-item');
            const baseModuleSize = isDesktop ? 1.5 : 1.2; // Module size in vw
            
            gridItems.forEach((item, i) => {
                // Apply consistent module-based margins
                const marginDirection = i % 2 === 0 ? 'Top' : 'Left';
                const moduleMultiplier = (i % 3) + 1; // 1, 2, or 3 modules
                const marginValue = baseModuleSize * moduleMultiplier;
                
                item.style[`margin${marginDirection}`] = `${marginValue}vw`;
                
                // Set uniform z-index to prevent any overlap rendering issues
                item.style.zIndex = 1;
            });
        }
    }

    // Start the grid loading process
    loadLabGrid();

    // Reload grid on resize to ensure proper layout
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(loadLabGrid, 250);
    });
});