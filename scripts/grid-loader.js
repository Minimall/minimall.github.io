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

            // Ensure container is not smaller than 360px
            gridItem.style.minWidth = '360px';
            gridItem.style.minHeight = '360px';

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

            // Ensure container is not smaller than 360px
            gridItem.style.minWidth = '360px';
            gridItem.style.minHeight = '360px';

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
        
        // Ensure content doesn't overflow viewport
        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

        // Increase the number of rows to give more vertical space
        if (isDesktop) {
            gridContainer.style.setProperty('--grid-columns', '12');
            gridContainer.style.setProperty('--grid-rows', Math.max(24, Math.ceil(itemCount * 1.5)));
            gridContainer.style.setProperty('--grid-gap', '4vw'); // Larger gap to prevent overlap
        } else if (isTablet) {
            gridContainer.style.setProperty('--grid-columns', '8');
            gridContainer.style.setProperty('--grid-rows', Math.max(30, Math.ceil(itemCount * 2)));
            gridContainer.style.setProperty('--grid-gap', '4vw');
        } else {
            // Mobile layout is a single column
            gridContainer.style.setProperty('--grid-columns', '4');
            gridContainer.style.setProperty('--grid-rows', itemCount * 3);
            gridContainer.style.setProperty('--grid-gap', '6vw');
        }

        // Position items according to a strict Swiss modernist grid
        if (!isMobile) {
            const gridItems = gridContainer.querySelectorAll('.grid-item');
            const moduleSize = isDesktop ? 4 : 3; // Base module size in vw
            
            // Define a grid with fixed positions ensuring no overlap
            const positions = [
                { column: 1, row: 1, width: 4, height: 3 },     // Item 1
                { column: 6, row: 2, width: 5, height: 4 },     // Item 2
                { column: 1, row: 6, width: 3, height: 4 },     // Item 3
                { column: 5, row: 8, width: 3, height: 3 },     // Item 4
                { column: 9, row: 7, width: 4, height: 4 },     // Item 5
                { column: 1, row: 12, width: 5, height: 3 },    // Item 6
                { column: 7, row: 13, width: 4, height: 3 },    // Item 7
                { column: 4, row: 4, width: 3, height: 3 },     // Item 8
                { column: 9, row: 1, width: 3, height: 2 },     // Item 9
                { column: 1, row: 17, width: 2, height: 2 },    // Item 10
                { column: 4, row: 16, width: 4, height: 3 },    // Item 11
                { column: 9, row: 12, width: 3, height: 2 }     // Item 12
            ];

            gridItems.forEach((item, i) => {
                if (i < positions.length) {
                    const pos = positions[i];
                    
                    // Apply precise grid positioning with modularity
                    item.style.gridColumn = `${pos.column} / span ${pos.width}`;
                    item.style.gridRow = `${pos.row} / span ${pos.height}`;
                    
                    // Apply margins for visual rhythm
                    item.style.margin = `${moduleSize/2}px`;
                    
                    // Ensure items don't overlap by using precise grid positioning
                    item.style.boxSizing = 'border-box';
                    item.style.zIndex = 1;
                }
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