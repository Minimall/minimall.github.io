document.addEventListener('DOMContentLoaded', () => {
    const hoverContainers = document.querySelectorAll('.hover-container');

    hoverContainers.forEach(container => {
        const hoverImage = container.querySelector('.hover-image');
        if (!hoverImage) return;

        const type = hoverImage.dataset.type;
        let imageElement = document.createElement('img');
        hoverImage.appendChild(imageElement);

        if (type === 'images') {
            const images = hoverImage.dataset.images.split(',');
            let currentIndex = 0;
            let interval;

            imageElement.src = images[0];

            container.addEventListener('mouseenter', () => {
                interval = setInterval(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    imageElement.src = images[currentIndex];
                }, 2000);
            });

            container.addEventListener('mouseleave', () => {
                clearInterval(interval);
                currentIndex = 0;
                imageElement.src = images[0];
            });
        } else if (type === 'image') {
            imageElement.src = hoverImage.dataset.image;
        } else if (type === 'video') {
            hoverImage.removeChild(imageElement);
            const videoElement = document.createElement('video');
            videoElement.src = hoverImage.dataset.video;
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.muted = true;
            hoverImage.appendChild(videoElement);
        }

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            hoverImage.style.left = `${e.pageX + 20}px`;
            hoverImage.style.top = `${e.pageY + 20}px`;
            hoverImage.classList.add('visible');
        });

        container.addEventListener('mouseleave', () => {
            hoverImage.classList.remove('visible');
        });
    });
});