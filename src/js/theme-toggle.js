/**
 * Theme Toggle Component
 * A simple, reusable theme toggle that can be added to any page
 */

class ThemeToggle {
  constructor(options = {}) {
    this.options = {
      container: options.container || document.body,
      position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left
      size: options.size || 'medium', // small, medium, large
      showLabel: options.showLabel !== false,
      labelText: options.labelText || 'Theme',
      ...options
    };
    
    this.init();
  }

  init() {
    this.createToggle();
    this.positionToggle();
    this.setupEventListeners();
    this.updateToggleState();
  }

  createToggle() {
    this.toggleElement = document.createElement('div');
    this.toggleElement.className = 'theme-toggle-component';
    this.toggleElement.innerHTML = this.generateHTML();
    
    // Add styles
    this.addStyles();
    
    this.options.container.appendChild(this.toggleElement);
  }

  generateHTML() {
    const sizeClass = `size-${this.options.size}`;
    const labelHTML = this.options.showLabel ? `<span class="toggle-label">${this.options.labelText}</span>` : '';
    
    return `
      <div class="toggle-container ${sizeClass}">
        <button class="toggle-button" id="themeToggleBtn" title="Toggle Theme">
          <span class="toggle-icon">🌙</span>
        </button>
        ${labelHTML}
      </div>
    `;
  }

  addStyles() {
    if (document.getElementById('theme-toggle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'theme-toggle-styles';
    style.textContent = this.generateStyles();
    document.head.appendChild(style);
  }

  generateStyles() {
    const sizeMap = {
      small: { width: '32px', height: '32px', fontSize: '14px' },
      medium: { width: '40px', height: '40px', fontSize: '16px' },
      large: { width: '48px', height: '48px', fontSize: '18px' }
    };
    
    const size = sizeMap[this.options.size];
    
    return `
      .theme-toggle-component {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .theme-toggle-component.size-small .toggle-button {
        width: ${sizeMap.small.width};
        height: ${sizeMap.small.height};
        font-size: ${sizeMap.small.fontSize};
      }
      
      .theme-toggle-component.size-medium .toggle-button {
        width: ${sizeMap.medium.width};
        height: ${sizeMap.medium.height};
        font-size: ${sizeMap.medium.fontSize};
      }
      
      .theme-toggle-component.size-large .toggle-button {
        width: ${sizeMap.large.width};
        height: ${sizeMap.large.height};
        font-size: ${sizeMap.large.fontSize};
      }
      
      .toggle-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .toggle-button {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .toggle-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }
      
      .toggle-button:active {
        transform: scale(0.95);
      }
      
      .toggle-button:focus {
        outline: 2px solid var(--primary-color, #0d9488);
        outline-offset: 2px;
      }
      
      .toggle-icon {
        transition: transform 0.3s ease;
      }
      
      .toggle-button:hover .toggle-icon {
        transform: rotate(15deg);
      }
      
      .toggle-label {
        color: white;
        font-size: 12px;
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        white-space: nowrap;
      }
      
      /* Dark theme adjustments */
      .theme-dark .toggle-button {
        background: rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .theme-dark .toggle-button:hover {
        background: rgba(0, 0, 0, 0.3);
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .theme-toggle-component {
          transform: scale(0.9);
        }
      }
      
      @media (max-width: 480px) {
        .theme-toggle-component {
          transform: scale(0.8);
        }
      }
    `;
  }

  positionToggle() {
    const positions = {
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' }
    };
    
    const position = positions[this.options.position] || positions['top-right'];
    
    Object.assign(this.toggleElement.style, position);
  }

  setupEventListeners() {
    const toggleBtn = this.toggleElement.querySelector('#themeToggleBtn');
    
    toggleBtn.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Listen for theme changes from the theme manager
    window.addEventListener('themeChanged', () => {
      this.updateToggleState();
    });
    
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  toggleTheme() {
    if (window.themeManager) {
      // Use the theme manager if available
      const currentTheme = themeManager.getCurrentTheme();
      const themes = themeManager.availableThemes;
      const currentIndex = themes.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];
      
      themeManager.setTheme(nextTheme);
    } else {
      // Fallback to simple light/dark toggle
      const body = document.body;
      if (body.classList.contains('theme-dark')) {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
        localStorage.setItem('simple-theme', 'light');
      } else {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
        localStorage.setItem('simple-theme', 'dark');
      }
    }
    
    // Add click animation
    this.addClickAnimation();
  }

  addClickAnimation() {
    const toggleBtn = this.toggleElement.querySelector('#themeToggleBtn');
    toggleBtn.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      toggleBtn.style.transform = '';
    }, 150);
  }

  updateToggleState() {
    const toggleBtn = this.toggleElement.querySelector('#themeToggleBtn');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (window.themeManager) {
      const currentTheme = themeManager.getCurrentTheme();
      const config = themeManager.getCurrentThemeConfig();
      
      toggleIcon.textContent = config.icon;
      toggleBtn.title = `Current: ${config.name} - Click to change (Ctrl+Shift+T)`;
    } else {
      const isDark = document.body.classList.contains('theme-dark');
      toggleIcon.textContent = isDark ? '☀️' : '🌙';
      toggleBtn.title = `Switch to ${isDark ? 'Light' : 'Dark'} Theme (Ctrl+Shift+T)`;
    }
  }

  // Public methods
  show() {
    this.toggleElement.style.display = 'block';
  }

  hide() {
    this.toggleElement.style.display = 'none';
  }

  destroy() {
    if (this.toggleElement && this.toggleElement.parentNode) {
      this.toggleElement.parentNode.removeChild(this.toggleElement);
    }
  }

  // Method to change position dynamically
  setPosition(newPosition) {
    this.options.position = newPosition;
    this.positionToggle();
  }

  // Method to change size dynamically
  setSize(newSize) {
    this.options.size = newSize;
    const toggleContainer = this.toggleElement.querySelector('.toggle-container');
    toggleContainer.className = `toggle-container size-${newSize}`;
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-create theme toggle if no theme toggle exists
    if (!document.querySelector('.theme-toggle-component')) {
      new ThemeToggle();
    }
  });
} else {
  // Auto-create theme toggle if no theme toggle exists
  if (!document.querySelector('.theme-toggle-component')) {
    new ThemeToggle();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeToggle;
}

// Make available globally
window.ThemeToggle = ThemeToggle;
