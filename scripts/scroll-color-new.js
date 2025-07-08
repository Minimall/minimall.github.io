// SCROLL COLOR CHANGER - V3.0 - WORKING VERSION
console.log('🚀 Scroll color manager loaded successfully');

// Check if any previous scroll managers exist
if (window.scrollColorManager) {
  console.log('⚠️ Stopping existing scroll manager');
  if (window.scrollColorManager.stop) {
    window.scrollColorManager.stop();
  }
}

class ScrollColorManager {
  constructor() {
    this.currentBg = '#FFFFFF';
    this.targetBg = '#FFFFFF';
    this.isRunning = false;
    this.instanceId = Math.random().toString(36).substr(2, 9);
    
    this.initialize();
  }

  initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    console.log('🎬 Starting scroll color manager');
    
    const sections = document.querySelectorAll('.case-study-container');
    console.log(`🔍 Found ${sections.length} case study containers`);
    
    if (sections.length === 0) {
      console.error('❌ No case study containers found!');
      return;
    }

    this.isRunning = true;
    this.updateLoop();
    
    // Add scroll listener for smooth updates
    window.addEventListener('scroll', () => {
      // Throttle scroll events
    }, { passive: true });
    
    console.log('✅ Scroll color manager started successfully');
  }

  calculateSectionVisibility(element) {
    const rect = element.getBoundingClientRect();
    const viewHeight = window.innerHeight;
    
    // Check if element is in viewport at all
    if (rect.bottom <= 0 || rect.top >= viewHeight) {
      return 0;
    }
    
    // Calculate overlap with viewport center area (30% to 70% of viewport)
    const centerStart = viewHeight * 0.3;
    const centerEnd = viewHeight * 0.7;
    
    const overlapStart = Math.max(rect.top, centerStart);
    const overlapEnd = Math.min(rect.bottom, centerEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    const centerHeight = centerEnd - centerStart;
    
    const visibility = overlap / centerHeight;
    return Math.min(1, visibility);
  }

  updateLoop() {
    if (!this.isRunning) return;
    
    const sections = document.querySelectorAll('.case-study-container');
    let bestSection = null;
    let maxVisibility = 0;
    
    sections.forEach((section, index) => {
      const visibility = this.calculateSectionVisibility(section);
      const bgColor = getComputedStyle(section).getPropertyValue('--data-bg').trim();
      
      if (visibility > maxVisibility) {
        maxVisibility = visibility;
        bestSection = { color: bgColor, visibility };
      }
    });
    
    // Determine target background (require 30% visibility to trigger change)
    const newTarget = maxVisibility > 0.3 ? (bestSection?.color || '#FFFFFF') : '#FFFFFF';
    
    // Apply background change with smooth transition
    if (newTarget !== this.currentBg) {
      console.log(`🎨 Background: ${this.currentBg} → ${newTarget}`);
      document.body.style.transition = 'background-color 0.6s ease-out';
      document.body.style.backgroundColor = newTarget;
      this.currentBg = newTarget;
      
      // Reset transition after animation
      setTimeout(() => {
        document.body.style.transition = 'none';
      }, 600);
    }
    
    // Continue loop at 60fps
    requestAnimationFrame(() => this.updateLoop());
  }

  stop() {
    console.log('⏹️ Stopping scroll color manager');
    this.isRunning = false;
  }
}

// Create and start the manager
window.scrollColorManager = new ScrollColorManager(); 