
document.addEventListener('DOMContentLoaded', () => {
    const hoverWord = document.querySelector('.hover-word');
    const hoverImage = document.querySelector('.hover-image');

    hoverWord.addEventListener('mousemove', (e) => {
        hoverImage.style.left = e.pageX + 20 + 'px';
        hoverImage.style.top = e.pageY + 20 + 'px';
    });
});
