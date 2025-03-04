
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.whiskey-cards')) {
        // Slider dragging
        const slider = document.querySelector('.whiskey-cards');
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX); //scroll-fast
            var prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft;
        });

        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.touches[0].pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            cancelMomentumTracking();
        }, { passive: false });

        slider.addEventListener('touchend', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking();
        });

        slider.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.touches[0].pageX - slider.offsetLeft;
            const walk = (x - startX);
            var prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft;
        }, { passive: false });

        // Momentum 
        var velX = 0;
        var momentumID;

        slider.addEventListener('wheel', (e) => {
            cancelMomentumTracking();
        });

        function beginMomentumTracking() {
            cancelMomentumTracking();
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }

        function momentumLoop() {
            slider.scrollLeft += velX * 2;
            velX *= 0.95;
            if (Math.abs(velX) > 0.5) {
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

        // Scroll
        slider.addEventListener("wheel", (evt) => {
            evt.preventDefault();

            window.requestAnimationFrame(() => {
                slider.scrollTo({ top: 0, left: slider.scrollLeft + (evt.deltaY * 2), behavior: "smooth" });
            });
        });
    }
});
