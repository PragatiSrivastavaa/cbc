/**
 * ACCESSIBILITY MANAGER - GIGW 3.0 Compliant
 * Indian Government Website Accessibility Standards
 * 
 * Features:
 * - Font Size Adjustment (A-, A, A+, A++)
 * - High Contrast Themes
 * - Dark Mode
 * - Hide Images
 * - Cursor Size Control
 * - Highlight Links
 * - Reading Guide
 * - Increased Line Height
 * - Keyboard Navigation
 */

class AccessibilityManager {
  constructor() {
    this.drawer = null;
    this.overlay = null;
    this.settings = this.loadSettings();
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.drawer = document.getElementById('accessibilityDrawer');
    this.overlay = document.getElementById('accessibilityOverlay');

    if (!this.drawer) {
      console.warn('Accessibility drawer markup (#accessibilityDrawer) not found in DOM. Skipping AccessibilityManager initialization.');
      return;
    }

    if (!this.overlay) {
      console.warn('Accessibility overlay (#accessibilityOverlay) not found in DOM. Skipping AccessibilityManager initialization.');
      return;
    }

    this.createReadingGuide();
    this.attachEventListeners();
    this.applySettings();
    this.enableKeyboardShortcuts();
  }

  createReadingGuide() {
    // Reading guide feature removed
  }

  attachEventListeners() {
    if (!this.drawer) return;

    if (!this.drawer.getAttribute('data-state')) {
      this.drawer.setAttribute('data-state', 'closed');
    }
    if (this.overlay && !this.overlay.getAttribute('data-state')) {
      this.overlay.setAttribute('data-state', 'hidden');
    }

    const accessIcon = document.querySelector('.access-icon');
    if (accessIcon && !accessIcon.hasAttribute('data-accessibility-attached')) {
      accessIcon.setAttribute('data-accessibility-attached', 'true');
      const openHandler = (e) => {
        e.preventDefault();
        this.openDrawer();
      };
      accessIcon.addEventListener('click', openHandler);
      accessIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openDrawer();
        }
      });
      console.log('Accessibility icon listener attached successfully');
    } else if (!accessIcon) {
      console.warn('Accessibility icon not found in DOM. Will retry after header loads.');
    }

    const closeBtn = document.getElementById('closeAccessibilityBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.closeDrawer());
    }

    document.querySelectorAll('.text-size-btn').forEach(btn => {
      if (!btn.hasAttribute('aria-pressed')) {
        btn.setAttribute('aria-pressed', 'false');
      }
      btn.addEventListener('click', (e) => {
        const size = e.currentTarget.getAttribute('data-size');
        this.setTextSize(size);
      });
    });

    document.querySelectorAll('.contrast-btn').forEach(btn => {
      if (!btn.hasAttribute('aria-pressed')) {
        btn.setAttribute('aria-pressed', 'false');
      }
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.setTheme(theme);
      });
    });

    document.querySelectorAll('.cursor-size-option').forEach(option => {
      option.setAttribute('tabindex', option.getAttribute('tabindex') || '0');
      option.setAttribute('role', option.getAttribute('role') || 'button');
      option.setAttribute('aria-pressed', option.getAttribute('aria-pressed') || 'false');
      option.addEventListener('click', (e) => {
        const cursor = e.currentTarget.getAttribute('data-cursor');
        this.setCursorSize(cursor);
      });
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const cursor = e.currentTarget.getAttribute('data-cursor');
          this.setCursorSize(cursor);
        }
      });
    });

    document.querySelectorAll('.accessibility-toggle').forEach(toggle => {
      toggle.setAttribute('tabindex', toggle.getAttribute('tabindex') || '0');
      toggle.setAttribute('role', toggle.getAttribute('role') || 'button');
      toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') || 'false');
      toggle.setAttribute('data-state', toggle.getAttribute('data-state') || 'off');
      toggle.addEventListener('click', (e) => {
        const feature = e.currentTarget.getAttribute('data-feature');
        this.toggleFeature(feature);
      });
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const feature = e.currentTarget.getAttribute('data-feature');
          this.toggleFeature(feature);
        }
      });
    });

    const resetBtn = document.getElementById('resetAccessibilityBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllSettings());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawer?.getAttribute('data-state') === 'open') {
        this.closeDrawer();
      }
    });

    // Setup arrow key navigation for control groups
    this.setupGroupNavigation('.text-size-controls', '.text-size-btn');
    this.setupGroupNavigation('.contrast-themes', '.contrast-btn');
    this.setupGroupNavigation('.cursor-size-controls', '.cursor-size-option');
    this.setupGroupNavigation('.accessibility-toggle-group', '.accessibility-toggle');
  }

  setupGroupNavigation(containerSelector, itemSelector) {
    const containers = document.querySelectorAll(containerSelector);
    containers.forEach(container => {
      const items = Array.from(container.querySelectorAll(itemSelector));
      items.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
          let nextIndex = null;

          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (index + 1) % items.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (index - 1 + items.length) % items.length;
          }

          if (nextIndex !== null) {
            items[nextIndex].focus();
          }
        });
      });
    });
  }

  openDrawer() {
    if (!this.drawer || !this.overlay) return;

    this.drawer.setAttribute('data-state', 'open');
    this.overlay.setAttribute('data-state', 'active');

    // Prevent body scroll - store current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';

    // Focus management for accessibility
    const closeBtn = document.getElementById('closeAccessibilityBtn');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  closeDrawer() {
    if (!this.drawer || !this.overlay) return;

    this.drawer.setAttribute('data-state', 'closed');
    this.overlay.setAttribute('data-state', 'hidden');

    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // Restore scroll position
    if (this.scrollPosition !== undefined) {
      window.scrollTo(0, this.scrollPosition);
    }
  }

  setBodyDataAttr(attributeName, value) {
    if (!document.body) return;
    if (value === null || value === undefined || value === '') {
      document.body.removeAttribute(attributeName);
    } else {
      document.body.setAttribute(attributeName, value);
    }
  }

  updatePressedState(selector, attrName, activeValue) {
    document.querySelectorAll(selector).forEach(element => {
      const isActive = element.getAttribute(attrName) === activeValue;
      element.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  setToggleState(toggleEl, isActive) {
    if (!toggleEl) return;
    const state = isActive ? 'on' : 'off';
    toggleEl.setAttribute('data-state', state);
    toggleEl.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    const toggleSwitch = toggleEl.querySelector('.toggle-switch');
    if (toggleSwitch) {
      toggleSwitch.setAttribute('data-state', state);
      toggleSwitch.setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  }

  setTextSize(size, skipSave = false) {
    const validSizes = ['small', 'normal', 'large', 'extra-large'];
    const selectedSize = validSizes.includes(size) ? size : 'normal';
    this.setBodyDataAttr('data-text-size', selectedSize);
    this.updatePressedState('.text-size-btn', 'data-size', selectedSize);
    this.settings.textSize = selectedSize;
    if (!skipSave) {
      this.saveSettings();
    }
  }

  setTheme(theme, skipSave = false) {
    const validThemes = ['default', 'high-contrast', 'dark', 'yellow-black'];
    const selectedTheme = validThemes.includes(theme) ? theme : 'default';
    this.setBodyDataAttr('data-theme', selectedTheme);
    this.updatePressedState('.contrast-btn', 'data-theme', selectedTheme);
    this.settings.theme = selectedTheme;
    if (!skipSave) {
      this.saveSettings();
    }
  }

  setCursorSize(size, skipSave = false) {
    const validSizes = ['normal', 'large', 'extra-large'];
    const selectedSize = validSizes.includes(size) ? size : 'normal';
    this.setBodyDataAttr('data-cursor-size', selectedSize);
    this.updatePressedState('.cursor-size-option', 'data-cursor', selectedSize);
    this.settings.cursorSize = selectedSize;
    if (!skipSave) {
      this.saveSettings();
    }
  }

  toggleFeature(feature) {
    const toggle = document.querySelector(`[data-feature="${feature}"]`);
    if (!toggle) return;
    const isActive = toggle.getAttribute('data-state') === 'on';
    const newState = !isActive;
    this.setToggleState(toggle, newState);
    this.setBodyDataAttr(`data-${feature}`, newState ? 'true' : null);
    this.settings[feature] = newState;
    this.saveSettings();
  }

  resetAllSettings() {
    this.setTextSize('normal', true);
    this.setTheme('default', true);
    this.setCursorSize('normal', true);
    ['hide-images', 'highlight-links', 'increased-line-height', 'keyboard-only'].forEach(feature => {
      const toggle = document.querySelector(`[data-feature="${feature}"]`);
      this.setToggleState(toggle, false);
      this.setBodyDataAttr(`data-${feature}`, null);
      this.settings[feature] = false;
    });
    this.saveSettings();
  }

  applySettings() {
    this.setTextSize(this.settings.textSize || 'normal', true);
    this.setTheme(this.settings.theme || 'default', true);
    this.setCursorSize(this.settings.cursorSize || 'normal', true);
    ['hide-images', 'highlight-links', 'increased-line-height'].forEach(feature => {
      const isActive = !!this.settings[feature];
      const toggle = document.querySelector(`[data-feature="${feature}"]`);
      this.setToggleState(toggle, isActive);
      this.setBodyDataAttr(`data-${feature}`, isActive ? 'true' : null);
    });
  }

  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save accessibility settings:', e);
    }
  }

  loadSettings() {
    const defaults = {
      textSize: 'normal',
      theme: 'default',
      cursorSize: 'normal',
      'hide-images': false,
      'highlight-links': false,
      'increased-line-height': false
    };

    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (!saved) {
        return defaults;
      }
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        'hide-images': parsed['hide-images'] ?? parsed.hideImages ?? defaults['hide-images'],
        'highlight-links': parsed['highlight-links'] ?? parsed.highlightLinks ?? defaults['highlight-links'],
        'increased-line-height': parsed['increased-line-height'] ?? parsed.increasedLineHeight ?? defaults['increased-line-height']
      };
    } catch (e) {
      console.warn('Could not load accessibility settings:', e);
      return defaults;
    }
  }

  enableKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + A: Toggle accessibility drawer
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        if (this.drawer?.getAttribute('data-state') === 'open') {
          this.closeDrawer();
        } else {
          this.openDrawer();
        }
      }

      // Alt + 1: Decrease text size
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(this.settings.textSize);
        if (currentIndex > 0) {
          this.setTextSize(sizes[currentIndex - 1]);
        }
      }

      // Alt + 2: Increase text size
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(this.settings.textSize);
        if (currentIndex < sizes.length - 1) {
          this.setTextSize(sizes[currentIndex + 1]);
        }
      }

      // Alt + R: Reset all settings
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        this.resetAllSettings();
      }

      // Alt + C: Toggle high contrast
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'high-contrast' ? 'default' : 'high-contrast';
        this.setTheme(newTheme);
      }
    });
  }

}

// Initialize accessibility manager when script loads
let accessibilityManager = null;

// Function to initialize or reinitialize the accessibility manager
function initAccessibilityManager() {
  if (accessibilityManager) {
    // If already exists, just reattach to the new icon
    const accessIcon = document.querySelector('.access-icon');
    if (accessIcon && !accessIcon.hasAttribute('data-accessibility-attached')) {
      accessIcon.setAttribute('data-accessibility-attached', 'true');
      accessIcon.addEventListener('click', (e) => {
        e.preventDefault();
        accessibilityManager.openDrawer();
      });

      // Keyboard support for accessibility icon
      accessIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          accessibilityManager.openDrawer();
        }
      });
    }
  } else {
    // Create new instance
    accessibilityManager = new AccessibilityManager();
  }
}

// Initialize on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessibilityManager);
} else {
  initAccessibilityManager();
}

// Also initialize after a delay to catch dynamically loaded headers
setTimeout(initAccessibilityManager, 1000);

// Export for external access if needed
if (typeof window !== 'undefined') {
  window.AccessibilityManager = accessibilityManager;
  window.initAccessibilityManager = initAccessibilityManager;
}

