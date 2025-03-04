
/**
 * Swiss Modernist Grid Loader
 * Implements a modular typographic grid with precise image placement
 * following principles of Swiss design
 */
document.addEventListener('DOMContentLoaded', function() {
    // Core function to create a grid item
    function createGridItem(file, index) {
        const isVideo = file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov');
        
        // Create container with appropriate class
        const gridItem = document.createElement('div');
        gridItem.className = `grid-item item-${index + 1}`;
        gridItem.setAttribute('data-index', index);
        
        // Add appropriate media element
        if (isVideo) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.classList.add('media-content');
            
            const source = document.createElement('source');
            source.src = `images/lab/${file}`;
            source.type = file.endsWith('.mp4') ? 'video/mp4' : 
                          file.endsWith('.webm') ? 'video/webm' : 'video/quicktime';
            
            video.appendChild(source);
            gridItem.appendChild(video);
            
            // Set data attribute for aspect ratio management
            gridItem.setAttribute('data-media-type', 'video');
            
            // When video metadata is loaded, set the aspect ratio
            video.addEventListener('loadedmetadata', function() {
                const aspectRatio = this.videoWidth / this.videoHeight;
                gridItem.style.setProperty('--aspect-ratio', aspectRatio);
                gridItem.setAttribute('data-aspect', aspectRatio);
            });
        } else {
            const img = document.createElement('img');
            img.src = `images/lab/${file}`;
            img.alt = file.split('.')[0].replace(/-/g, ' ');
            img.classList.add('media-content');
            
            gridItem.appendChild(img);
            gridItem.setAttribute('data-media-type', 'image');
            
            // When image is loaded, set the aspect ratio
            img.onload = function() {
                const aspectRatio = this.naturalWidth / this.naturalHeight;
                gridItem.style.setProperty('--aspect-ratio', aspectRatio);
                gridItem.setAttribute('data-aspect', aspectRatio);
            };
        }
        
        return gridItem;
    }
    
    // Function to load and arrange the grid
    function loadSwissGrid() {
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
        
        // Apply Swiss design principles
        applySwissDesignPrinciples(gridContainer, files.length);
    }
    
    // Apply Swiss design principles to the grid
    function applySwissDesignPrinciples(gridContainer, itemCount) {
        // Get viewport dimensions
        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        
        // Determine layout based on screen size
        const isDesktop = window.matchMedia('(min-width: 1201px)').matches;
        const isTablet = window.matchMedia('(min-width: 789px) and (max-width: 1200px)').matches;
        const isMobile = window.matchMedia('(max-width: 788px)').matches;
        
        // Set grid properties based on screen size
        if (isDesktop) {
            gridContainer.style.setProperty('--grid-columns', '12');
            gridContainer.style.setProperty('--grid-rows', Math.max(36, Math.ceil(itemCount * 2)));
            gridContainer.style.setProperty('--grid-module', '4vw');
            gridContainer.style.setProperty('--grid-gap', '2vw');
        } else if (isTablet) {
            gridContainer.style.setProperty('--grid-columns', '8');
            gridContainer.style.setProperty('--grid-rows', Math.max(48, Math.ceil(itemCount * 3)));
            gridContainer.style.setProperty('--grid-module', '5vw');
            gridContainer.style.setProperty('--grid-gap', '3vw');
        } else {
            gridContainer.style.setProperty('--grid-columns', '4');
            gridContainer.style.setProperty('--grid-rows', itemCount * 4);
            gridContainer.style.setProperty('--grid-module', '6vw');
            gridContainer.style.setProperty('--grid-gap', '4vw');
        }
        
        // Define Swiss grid positions
        if (!isMobile) {
            const gridItems = gridContainer.querySelectorAll('.grid-item');
            
            // Swiss design grid positions - carefully calculated to avoid overlap
            // and respect modular rhythm
            const positions = [
                // Desktop positions (will adjust for tablet)
                { col: 1, row: 1, width: 4, height: 6 },      // Item 1
                { col: 6, row: 2, width: 6, height: 8 },      // Item 2
                { col: 1, row: 8, width: 4, height: 6 },      // Item 3
                { col: 6, row: 12, width: 5, height: 7 },     // Item 4
                { col: 1, row: 15, width: 4, height: 5 },     // Item 5
                { col: 7, row: 20, width: 5, height: 6 },     // Item 6
                { col: 2, row: 21, width: 4, height: 5 },     // Item 7
                { col: 7, row: 1, width: 3, height: 4 },      // Item 8
                { col: 1, row: 27, width: 6, height: 5 },     // Item 9
                { col: 8, row: 27, width: 4, height: 4 },     // Item 10
                { col: 3, row: 33, width: 5, height: 4 },     // Item 11
                { col: 9, row: 32, width: 3, height: 5 },     // Item 12
                { col: 1, row: 38, width: 7, height: 5 }      // Item 13
            ];
            
            // For tablet, adjust positions to prevent overflow
            const tabletPositions = isTablet ? [
                { col: 1, row: 1, width: 3, height: 5 },      // Item 1
                { col: 5, row: 2, width: 3, height: 6 },      // Item 2
                { col: 1, row: 7, width: 4, height: 5 },      // Item 3
                { col: 6, row: 9, width: 2, height: 4 },      // Item 4
                { col: 1, row: 13, width: 3, height: 5 },     // Item 5
                { col: 5, row: 15, width: 3, height: 6 },     // Item 6
                { col: 2, row: 19, width: 3, height: 4 },     // Item 7
                { col: 6, row: 1, width: 2, height: 4 },      // Item 8
                { col: 1, row: 24, width: 4, height: 4 },     // Item 9
                { col: 6, row: 22, width: 2, height: 3 },     // Item 10
                { col: 2, row: 29, width: 4, height: 3 },     // Item 11
                { col: 5, row: 27, width: 3, height: 4 },     // Item 12
                { col: 1, row: 33, width: 5, height: 4 }      // Item 13
            ] : positions;
            
            const finalPositions = isTablet ? tabletPositions : positions;
            
            // Apply positions to each grid item
            gridItems.forEach((item, i) => {
                if (i < finalPositions.length) {
                    const pos = finalPositions[i];
                    
                    // Apply precise positioning and prevent overflow
                    const maxCol = isTablet ? 8 : 12;
                    const effectiveWidth = Math.min(pos.width, maxCol - pos.col + 1);
                    
                    item.style.gridColumn = `${pos.col} / span ${effectiveWidth}`;
                    item.style.gridRow = `${pos.row} / span ${pos.height}`;
                    
                    // Apply modular spacing
                    const moduleSize = isDesktop ? 1 : 0.5;
                    item.style.margin = `${moduleSize}vw`;
                }
            });
        } else {
            // Mobile layout - stack items vertically
            const gridItems = gridContainer.querySelectorAll('.grid-item');
            gridItems.forEach((item, i) => {
                item.style.gridColumn = '1 / span 4';
                item.style.gridRow = `${(i * 5) + 1} / span 4`;
                item.style.margin = '1.5vw';
            });
        }
    }
    
    // Load the grid
    loadSwissGrid();
    
    // Reapply layout on resize with debouncing
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(loadSwissGrid, 250);
    });
    
    // Check if media items have been loaded correctly and apply aspect ratios
    window.addEventListener('load', function() {
        const mediaItems = document.querySelectorAll('.media-content');
        mediaItems.forEach(media => {
            if (media.tagName === 'IMG' && media.complete) {
                const container = media.parentElement;
                const aspectRatio = media.naturalWidth / media.naturalHeight;
                container.style.setProperty('--aspect-ratio', aspectRatio);
                container.setAttribute('data-aspect', aspectRatio);
            }
        });
    });
});
