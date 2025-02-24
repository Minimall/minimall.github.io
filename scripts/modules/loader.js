
// Progressive loading strategy
const loadComponent = async (componentType) => {
  switch(componentType) {
    case 'header':
      try {
        const response = await fetch('/header.html');
        if (!response.ok) throw new Error('Failed to load header');
        const data = await response.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) headerPlaceholder.innerHTML = data;
      } catch (error) {
        console.error('Error loading header:', error);
      }
      break;
      
    case 'intro':
      // Intro section is already in index.html
      break;
      
    case 'case-studies':
      const caseStudies = document.querySelectorAll('[data-case-file]');
      await Promise.all(Array.from(caseStudies).map(async placeholder => {
        try {
          const response = await fetch(placeholder.dataset.caseFile);
          if (!response.ok) throw new Error('Failed to load case study');
          const data = await response.text();
          placeholder.innerHTML = data;
        } catch (error) {
          console.error('Error loading case study:', error);
          placeholder.innerHTML = '<div class="case-study-error">Failed to load case study</div>';
        }
      }));
      break;
  }
};

const preloadComponent = (componentType) => {
  if (componentType === 'case-studies') {
    document.querySelectorAll('[data-case-file]').forEach(placeholder => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = placeholder.dataset.caseFile;
      document.head.appendChild(link);
    });
  }
};

export const initializeContentLoader = async () => {
  // 1. Load critical components first
  await loadComponent('header');
  await loadComponent('intro');
  
  // 2. Start preloading case studies
  preloadComponent('case-studies');
  
  // 3. Initialize animations
  window.requestAnimationFrame(() => {
    document.dispatchEvent(new Event('ContentLoaded'));
  });
  
  // 4. Load remaining components when needed
  const casesObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadComponent('case-studies');
      casesObserver.disconnect();
    }
  });
  
  const mainText = document.querySelector('.main-text');
  if (mainText) casesObserver.observe(mainText);
};

export { loadComponent, preloadComponent };
