/**
 * Search Button Icon - Minimal JS
 * Just hides button text, CSS handles the icon
 * Also adds placeholder to search input
 */

(function() {
  'use strict';

  function initSearchButtonIcon() {
    // Handle search button
    const buttons = document.querySelectorAll('.search-wrapper input[type="submit"], .search-wrapper button[type="submit"]');
    
    buttons.forEach(function(button) {
      if (button.classList.contains('search-icon-processed')) {
        return;
      }
      
      button.classList.add('search-icon-processed');
      
      // Store text for accessibility
      const buttonText = button.textContent || button.value || 'Search';
      button.setAttribute('aria-label', buttonText);
      
      // Hide text (CSS handles the icon)
      if (button.tagName === 'BUTTON') {
        button.textContent = '';
      } else {
        button.value = '';
      }
    });

    // Add placeholder to search input
    const searchInputs = document.querySelectorAll('.search-wrapper input[type="search"], .search-wrapper input.form-search, .search-wrapper input[name="keys"]');
    
    searchInputs.forEach(function(input) {
      if (!input.getAttribute('placeholder')) {
        input.setAttribute('placeholder', 'Search');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchButtonIcon);
  } else {
    initSearchButtonIcon();
  }

  if (typeof Drupal !== 'undefined' && Drupal.behaviors) {
    Drupal.behaviors.searchButtonIcon = {
      attach: function(context) {
        if (context === document || context.querySelector('.search-wrapper')) {
          initSearchButtonIcon();
        }
      }
    };
  }
})();

