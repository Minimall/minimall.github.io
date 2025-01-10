document.addEventListener("DOMContentLoaded", () => {
    const hoverContainers = document.querySelectorAll('.hover-container');
    
    hoverContainers.forEach(container => {
        const hoverImage = container.querySelector('.hover-image');
        if (!hoverImage) return;
        
        const type = hoverImage.getAttribute('data-type');
        if (type === 'images') {
            const images = hoverImage.getAttribute('data-images').split(',');
            let currentIndex = 0;
            const imgElement = document.createElement('img');
            imgElement.src = images[0];
            hoverImage.appendChild(imgElement);

            let intervalId;

            container.addEventListener('mousemove', (e) => {
                hoverImage.style.display = 'block';
                hoverImage.style.left = e.pageX + 20 + 'px';
                hoverImage.style.top = e.pageY + 20 + 'px';
                hoverImage.style.opacity = 1;
            });

            container.addEventListener('mouseenter', () => {
                intervalId = setInterval(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    imgElement.src = images[currentIndex];
                }, 2000);
            });

            container.addEventListener('mouseleave', () => {
                hoverImage.style.display = 'none';
                hoverImage.style.opacity = 0;
                clearInterval(intervalId);
                currentIndex = 0;
                imgElement.src = images[0];
            });
        } else if (type === 'image') {
            const imageUrl = hoverImage.getAttribute('data-image');
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            hoverImage.appendChild(imgElement);

            container.addEventListener('mousemove', (e) => {
                hoverImage.style.display = 'block';
                hoverImage.style.left = e.pageX + 20 + 'px';
                hoverImage.style.top = e.pageY + 20 + 'px';
                hoverImage.style.opacity = 1;
            });

            container.addEventListener('mouseleave', () => {
                hoverImage.style.display = 'none';
                hoverImage.style.opacity = 0;
            });
        } else if (type === 'video') {
            const videoUrl = hoverImage.getAttribute('data-video');
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.muted = true;
            hoverImage.appendChild(videoElement);

            container.addEventListener('mousemove', (e) => {
                hoverImage.style.display = 'block';
                hoverImage.style.left = e.pageX + 20 + 'px';
                hoverImage.style.top = e.pageY + 20 + 'px';
                hoverImage.style.opacity = 1;
            });

            container.addEventListener('mouseleave', () => {
                hoverImage.style.display = 'none';
                hoverImage.style.opacity = 0;
            });
        }
    });
});