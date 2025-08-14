/**
 * Theme Manager for Muslim Companion Extension
 * Handles theme switching, storage, and provides theme utilities
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.availableThemes = ['light', 'dark', 'soft', 'ramadan', 'eid'];
    this.themeConfigs = {
      light: {
        name: 'Light',
        icon: '☀️',
        colors: {
          primary: '#0d9488',
          secondary: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          accent: '#22d3ee'
        }
      },
      dark: {
        name: 'Dark',
        icon: '🌙',
        colors: {
          primary: '#22d3ee',
          secondary: '#fbbf24',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155',
          accent: '#0d9488'
        }
      },
      soft: {
        name: 'Soft',
        icon: '🌸',
        colors: {
          primary: '#f59e0b',
          secondary: '#0d9488',
          background: '#fafaf9',
          surface: '#f5f5f4',
          text: '#1e293b',
          textSecondary: '#78716c',
          border: '#d6d3d1',
          accent: '#f97316'
        }
      },
      ramadan: {
        name: 'Ramadan',
        icon: '🌙',
        colors: {
          primary: '#fbbf24',
          secondary: '#0d9488',
          background: '#1e3a8a',
          surface: '#1e40af',
          text: '#fef3c7',
          textSecondary: '#fde68a',
          border: '#3b82f6',
          accent: '#f59e0b'
        }
      },
      eid: {
        name: 'Eid',
        icon: '✨',
        colors: {
          primary: '#fbbf24',
          secondary: '#22d3ee',
          background: '#7c3aed',
          surface: '#8b5cf6',
          text: '#fef3c7',
          textSecondary: '#fde68a',
          border: '#a78bfa',
          accent: '#f59e0b'
        }
      }
    };
    
    this.init();
  }

  init() {
    this.loadTheme();
    this.setupEventListeners();
    this.applyTheme();
  }

  loadTheme() {
    // Try to load theme from different sources in order of priority
    const savedTheme = localStorage.getItem('muslim-companion-theme');
    const systemTheme = this.getSystemTheme();
    
    if (savedTheme && this.availableThemes.includes(savedTheme)) {
      this.currentTheme = savedTheme;
    } else if (systemTheme) {
      this.currentTheme = systemTheme;
    }
  }

  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  saveTheme() {
    localStorage.setItem('muslim-companion-theme', this.currentTheme);
    
    // Also save to Chrome storage if available
    if (chrome && chrome.storage) {
      chrome.storage.sync.set({ theme: this.currentTheme });
    }
  }

  setTheme(themeName) {
    if (!this.availableThemes.includes(themeName)) {
      console.warn(`Theme "${themeName}" not found. Available themes:`, this.availableThemes);
      return false;
    }

    this.currentTheme = themeName;
    this.saveTheme();
    this.applyTheme();
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: themeName, config: this.themeConfigs[themeName] }
    }));
    
    return true;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getCurrentThemeConfig() {
    return this.themeConfigs[this.currentTheme];
  }

  getThemeConfig(themeName) {
    return this.themeConfigs[themeName] || null;
  }

  applyTheme() {
    const config = this.getCurrentThemeConfig();
    if (!config) return;

    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${this.currentTheme}`);

    // Update theme toggle button if it exists
    this.updateThemeToggle();
    
    // Update meta theme-color if available
    this.updateMetaThemeColor(config.colors.primary);
  }

  updateThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      const config = this.getCurrentThemeConfig();
      toggleBtn.textContent = config.icon;
      toggleBtn.title = `Current: ${config.name} - Click to change`;
    }
  }

  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }

  cycleTheme() {
    const currentIndex = this.availableThemes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    const nextTheme = this.availableThemes[nextIndex];
    this.setTheme(nextTheme);
    return nextTheme;
  }

  setupEventListeners() {
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('muslim-companion-theme')) {
          // Only auto-switch if user hasn't manually set a theme
          const newTheme = e.matches ? 'dark' : 'light';
          this.setTheme(newTheme);
        }
      });
    }

    // Listen for theme change events from other components
    window.addEventListener('themeChanged', (e) => {
      console.log('Theme changed to:', e.detail.theme);
    });
  }

  // Utility methods for components
  getColor(colorName) {
    const config = this.getCurrentThemeConfig();
    return config?.colors[colorName] || null;
  }

  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  isLightTheme() {
    return this.currentTheme === 'light';
  }

  // Method to get theme-specific styles for dynamic elements
  getThemeStyles(elementType) {
    const config = this.getCurrentThemeConfig();
    const styles = {
      button: {
        backgroundColor: config.colors.primary,
        color: this.getContrastColor(config.colors.primary),
        border: `1px solid ${config.colors.border}`
      },
      card: {
        backgroundColor: config.colors.surface,
        color: config.colors.text,
        border: `1px solid ${config.colors.border}`
      },
      input: {
        backgroundColor: config.colors.surface,
        color: config.colors.text,
        border: `1px solid ${config.colors.border}`
      }
    };
    
    return styles[elementType] || {};
  }

  getContrastColor(hexColor) {
    // Convert hex to RGB and calculate contrast
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Method to create theme-aware CSS
  generateThemeCSS() {
    const config = this.getCurrentThemeConfig();
    return `
      .theme-${this.currentTheme} {
        --primary-color: ${config.colors.primary};
        --secondary-color: ${config.colors.secondary};
        --background-color: ${config.colors.background};
        --surface-color: ${config.colors.surface};
        --text-color: ${config.colors.text};
        --text-secondary-color: ${config.colors.textSecondary};
        --border-color: ${config.colors.border};
        --accent-color: ${config.colors.accent};
      }
    `;
  }

  // Method to export theme configuration
  exportThemeConfig() {
    return {
      currentTheme: this.currentTheme,
      availableThemes: this.availableThemes,
      themeConfigs: this.themeConfigs
    };
  }

  // Method to import theme configuration
  importThemeConfig(config) {
    if (config.themeConfigs) {
      this.themeConfigs = { ...this.themeConfigs, ...config.themeConfigs };
    }
    if (config.currentTheme && this.availableThemes.includes(config.currentTheme)) {
      this.setTheme(config.currentTheme);
    }
  }
}

// Create global theme manager instance
const themeManager = new ThemeManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

// Make available globally
window.themeManager = themeManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
  });
} else {
  themeManager.init();
}
