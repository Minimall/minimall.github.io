
export const initializeContentLoader = async (section) => {
  if (section === 'header') {
    await loadHeader();
  }
  await loadCaseStudies();
};

const loadHeader = async () => {
  try {
    const response = await fetch('/header.html');
    if (!response.ok) throw new Error('Failed to load header');
    const data = await response.text();
    
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = data;
      return true;
    }
  } catch (error) {
    console.error('Error loading header:', error);
    return false;
  }
};

const loadCaseStudies = async () => {
  const placeholders = document.querySelectorAll('[data-case-file]');
  
  const loadPromises = Array.from(placeholders).map(async placeholder => {
    try {
      const response = await fetch(placeholder.dataset.caseFile);
      if (!response.ok) throw new Error(`Failed to load case study`);
      const data = await response.text();
      placeholder.innerHTML = data;
    } catch (error) {
      console.error(error);
      placeholder.innerHTML = `<div class="case-study-error">Failed to load case study</div>`;
    }
  });

  await Promise.all(loadPromises);
};
// Content loader module
export const initializeContentLoader = async (section) => {
  const loadContent = async (placeholder, file) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      const content = await response.text();
      placeholder.innerHTML = content;
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  };

  // Load initial section
  if (section === 'header') {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      await loadContent(headerPlaceholder, '/header.html');
    }
  }

  // Load case studies and footer
  document.querySelectorAll('[data-case-file]').forEach(async (placeholder) => {
    await loadContent(placeholder, placeholder.dataset.caseFile);
  });
};
