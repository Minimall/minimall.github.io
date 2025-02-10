
const text = "dmytro.now.";
const cellWidth = 16;
const minCols = 20;

function createGrid() {
  const main = document.querySelector('.footer-animation');
  if (!main) return;
  
  main.innerHTML = '';
  
  const availableWidth = window.innerWidth - 80;
  const maxCols = Math.floor(availableWidth / cellWidth);
  const cols = Math.max(minCols, maxCols);
  const rows = 16;
  const n = cols * rows;
  
  main.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < n; i++) {
    const x = ((i + 1) % cols) / cols;
    const y = (rows - Math.floor(i / cols)) / rows;
    
    const div = document.createElement('div');
    div.className = 'animation-cell';
    div.textContent = text[i % text.length];
    
    div.style.cssText = `
      --x: ${x};
      --y: ${y};
      --offset-x: calc(var(--x) - 0.5);
      --abs-x: calc(max(var(--offset-x), -1 * var(--offset-x)));
      --offset-y: calc(var(--y) - 0.5);
      --abs-y: calc(max(var(--offset-y), -1 * var(--offset-y)));
      --l: calc(85% - sin(var(--abs-x) / sin(var(--abs-y) * 3.6) * 3 - var(--t) / 400) * 35%);
      --h: calc(200deg + var(--abs-x) * 160deg);
      --color-calc: hsl(var(--h) 90% min(var(--l), 95%));
    `;
    
    fragment.appendChild(div);
  }
  
  main.appendChild(fragment);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.addEventListener('load', createGrid);
window.addEventListener('resize', debounce(createGrid, 150));
