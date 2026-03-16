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

    // Ensure drawer starts inert (excluded from tab order) when closed
    if (this.drawer.getAttribute('data-state') !== 'open') {
      this.drawer.setAttribute('inert', '');
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
      // Button elements handle role/tabindex implicitly
      option.setAttribute('aria-pressed', option.getAttribute('aria-pressed') || 'false');
      option.addEventListener('click', (e) => {
        const cursor = e.currentTarget.getAttribute('data-cursor');
        this.setCursorSize(cursor);
      });
      // Native button handles keyboard events automatically
    });

    document.querySelectorAll('.accessibility-toggle').forEach(toggle => {
      // Button elements handle role/tabindex implicitly
      toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') || 'false');
      toggle.setAttribute('data-state', toggle.getAttribute('data-state') || 'off');
      toggle.addEventListener('click', (e) => {
        const feature = e.currentTarget.getAttribute('data-feature');
        this.toggleFeature(feature);
      });
      // Native button handles keyboard events automatically
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

    // Track last interacted element for focus restoration
    document.addEventListener('click', (e) => { this.lastInteractionElement = e.target; }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.lastInteractionElement = e.target;
      }
    }, true);

    // Initialize global dialog focus trap
    this.initGlobalDialogFocusTrap();

    // Ensure page scrolls to focused elements (WCAG 2.4.7 focus visible/scroll positioning)
    document.addEventListener('focusin', (e) => {
      const element = e.target;
      if (!element || element === document.body) return;

      // Only scroll if via keyboard (using common focus-visible logic)
      try {
        if (element.matches(':focus-visible')) {
          const rect = element.getBoundingClientRect();
          const threshold = 120; // Enough space for sticky header/navbar

          const isObscured = rect.top < threshold || rect.bottom > (window.innerHeight || document.documentElement.clientHeight);

          if (isObscured) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: rect.top < threshold ? 'center' : 'nearest',
              inline: 'nearest'
            });
          }
        }
      } catch (err) {
        // Fallback or ignore if matches(':focus-visible') not supported
      }
    }, true);
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

    // Remove inert so drawer is reachable by keyboard
    this.drawer.removeAttribute('inert');

    this.drawer.setAttribute('data-state', 'open');
    this.overlay.setAttribute('data-state', 'active');

    // Prevent body scroll - store current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';

    // Focus management for accessibility
    this.lastFocusedElement = document.activeElement;
    const closeBtn = document.getElementById('closeAccessibilityBtn');
    if (closeBtn) {
      setTimeout(() => {
        closeBtn.focus();
        this.setupFocusTrap(this.drawer);
      }, 50);
    }
  }

  closeDrawer() {
    if (!this.drawer || !this.overlay) return;

    this.drawer.setAttribute('data-state', 'closed');
    this.overlay.setAttribute('data-state', 'hidden');

    // Make drawer unreachable via keyboard — prevents focus trap when closed
    this.drawer.setAttribute('inert', '');

    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // Restore scroll position
    if (this.scrollPosition !== undefined) {
      window.scrollTo(0, this.scrollPosition);
    }

    // Restore focus
    if (this.lastFocusedElement && document.body.contains(this.lastFocusedElement)) {
      this.lastFocusedElement.focus();
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

    // Special handling for keyboard-only mode
    if (feature === 'keyboard-only') {
      if (newState) {
        // When enabled: Auto-focus first interactive element
        setTimeout(() => {
          const firstFocusable = document.querySelector('.skip-link, nav a, header a, button, input, [tabindex="0"]');
          if (firstFocusable) {
            firstFocusable.focus();
            // Scroll to element if needed
            firstFocusable.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        // When disabled: Return focus to accessibility icon
        setTimeout(() => {
          const accessIcon = document.querySelector('.access-icon');
          if (accessIcon) {
            accessIcon.focus();
          }
        }, 100);
      }
    }
  }

  resetAllSettings() {
    this.setTextSize('normal', true);
    this.setTheme('default', true);
    this.setCursorSize('normal', true);
    ['hide-images', 'highlight-links', 'increased-line-height', 'keyboard-only', 'pause-animations'].forEach(feature => {
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
    ['hide-images', 'highlight-links', 'increased-line-height', 'pause-animations'].forEach(feature => {
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
      'increased-line-height': false,
      'pause-animations': false
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
        'increased-line-height': parsed['increased-line-height'] ?? parsed.increasedLineHeight ?? defaults['increased-line-height'],
        'pause-animations': parsed['pause-animations'] ?? parsed.pauseAnimations ?? defaults['pause-animations']
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

      // Alt + P: Toggle pause animations
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        this.toggleFeature('pause-animations');
      }

      // Alt + K: Toggle keyboard-only mode
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        this.toggleFeature('keyboard-only');
      }
    });
  }

  initGlobalDialogFocusTrap() {
    // Listen for Drupal/jQuery UI dialog open events
    // Using window event listener for broad compatibility with Drupal's dialog system
    window.addEventListener('dialog:aftercreate', (event) => {
      const dialogContent = event.target;
      if (!dialogContent) return;

      const dialogWrapper = dialogContent.closest('.ui-dialog');
      if (!dialogWrapper) return;

      // Ensure ARIA attributes are present for Drupal UI dialogs
      if (!dialogWrapper.hasAttribute('role')) {
        dialogWrapper.setAttribute('role', 'dialog');
      }
      if (!dialogWrapper.hasAttribute('aria-modal')) {
        dialogWrapper.setAttribute('aria-modal', 'true');
      }

      // Attempt to find a title to label the dialog
      const titleBar = dialogWrapper.querySelector('.ui-dialog-title');
      if (titleBar && titleBar.id && !dialogWrapper.hasAttribute('aria-labelledby')) {
        dialogWrapper.setAttribute('aria-labelledby', titleBar.id);
      } else if (titleBar && !titleBar.id && !dialogWrapper.hasAttribute('aria-labelledby')) {
        const generatedId = 'dialog-title-' + Math.random().toString(36).substr(2, 9);
        titleBar.id = generatedId;
        dialogWrapper.setAttribute('aria-labelledby', generatedId);
      }

      // Ensure close button has an aria-label
      const closeBtn = dialogWrapper.querySelector('.ui-dialog-titlebar-close, .close-btn, .modal-close');
      if (closeBtn && !closeBtn.hasAttribute('aria-label') && !closeBtn.innerText.trim()) {
        closeBtn.setAttribute('aria-label', 'Close');
      }

      // 1. Focus the first focusable element inside the dialog
      const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

      // Delay to ensure DOM is ready and animations started
      setTimeout(() => {
        const focusableElements = dialogWrapper.querySelectorAll(focusableSelectors);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
        this.setupFocusTrap(dialogWrapper);
      }, 100);

      // Restore focus on close for Drupal dialogs
      if (typeof jQuery !== 'undefined') {
        jQuery(dialogContent).on('dialogclose', (event, ui) => {
          if (this.lastInteractionElement && document.body.contains(this.lastInteractionElement)) {
            this.lastInteractionElement.focus();
          }
        });
      }
    });

    // Handle Bootstrap Modals
    document.addEventListener('shown.bs.modal', (e) => {
      this.setupFocusTrap(e.target);
    });

    // Handle Bootstrap Collapses (for drawers/menus)
    document.addEventListener('shown.bs.collapse', (e) => {
      // Small delay to ensure items are visible for focusable check
      setTimeout(() => this.setupFocusTrap(e.target), 100);
    });

    // Handle custom modals that may exist or be added dynamically
    this.observeCustomModals();
  }

  observeCustomModals() {
    // Observer for custom modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.getAttribute('role') === 'dialog' || node.getAttribute('role') === 'alertdialog' || node.querySelector('[role="dialog"], [role="alertdialog"]')) {
              const target = node.hasAttribute('role') ? node : node.querySelector('[role="dialog"], [role="alertdialog"]');
              // Skip accessibility drawer — managed separately via openDrawer/closeDrawer
              if (target && target.id === 'accessibilityDrawer') return;
              this.setupFocusTrap(target);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check — skip the accessibility drawer (it has dedicated open/close management)
    document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(modal => {
      if (modal.id === 'accessibilityDrawer') return;
      this.setupFocusTrap(modal);
    });
  }

  setupFocusTrap(container) {
    if (!container || container.hasAttribute('data-focus-trapAttached')) return;
    container.setAttribute('data-focus-trapAttached', 'true');

    const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      // Only trap focus when this dialog/container is actually open/active/visible
      // 1. Check if it's the drawer with its specific data-state
      const dataState = container.getAttribute('data-state');
      const isDrawer = container.id === 'accessibilityDrawer';
      
      // 2. Check general visibility (important for Bootstrap collapses/modals)
      const isVisible = !!(container.offsetWidth || container.offsetHeight || container.getClientRects().length);
      
      // 3. Determine if it should be active
      let isActive = isVisible;
      if (isDrawer) {
        isActive = (dataState === 'open' || dataState === 'active');
      } else if (container.classList.contains('modal')) {
        isActive = container.classList.contains('show');
      } else if (container.classList.contains('collapse')) {
        isActive = container.classList.contains('show');
      }

      if (!isActive) return;

      const focusableElements = Array.from(container.querySelectorAll(focusableSelectors)).filter(el => {
        // Must be visible and not have inert/tabindex=-1
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && 
               el.getAttribute('tabindex') !== '-1' &&
               !el.hasAttribute('disabled');
      });

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else { // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
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

      // KEYBOARD SUPPORT: Native buttons handle Enter/Space automatically.
      // No manual keydown listener needed.
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

