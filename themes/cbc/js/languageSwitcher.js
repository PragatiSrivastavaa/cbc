/**
 * Language Switcher Handler
 * Shows both languages (English and Hindi) at once
 * Switches to inactive language when clicked
 */

(function() {
  'use strict';

  /**
   * Initialize language switcher
   */
  function initLanguageSwitcher() {
    const languageToggle = document.querySelector('.language-toggle');
    
    if (!languageToggle) {
      return;
    }

    // Process list items - will be shown/hidden based on active state after processing links
    const allListItems = languageToggle.querySelectorAll('li');
    // Don't set display here - let the link processing handle it

    // Find all language links - check multiple selectors for Drupal language switcher
    const allLinks = languageToggle.querySelectorAll('a');
    
    // Determine current language from URL or HTML lang attribute
    const currentLang = getCurrentLanguage();
    
    // Process all language links
    allLinks.forEach(function(link) {
      const linkText = link.textContent.trim().toLowerCase();
      const linkHref = link.getAttribute('href') || '';
      const linkLang = link.getAttribute('hreflang') || '';
      
      // Check if this is a language link (English or Hindi)
      if (isLanguageLink(linkText, linkHref, linkLang)) {
        // Detect language from link
        const detectedLang = detectLanguageFromLink(linkText, linkHref, linkLang);
        
        // Mark as active or inactive based on current language
        if (detectedLang === currentLang) {
          link.classList.add('is-active');
          link.classList.add('lang-active');
          link.classList.remove('lang-inactive');
          // Hide active language
          link.style.display = 'none';
          link.style.visibility = 'hidden';
          // Also mark parent li as active and hide it
          const parentLi = link.closest('li');
          if (parentLi) {
            parentLi.classList.add('is-active');
            parentLi.classList.add('active');
            parentLi.style.display = 'none';
            parentLi.style.visibility = 'hidden';
          }
        } else {
          link.classList.add('lang-inactive');
          link.classList.remove('is-active');
          link.classList.remove('lang-active');
          // Show inactive language
          link.style.display = 'inline-flex';
          link.style.visibility = 'visible';
          // Also mark parent li as inactive and show it
          const parentLi = link.closest('li');
          if (parentLi) {
            parentLi.classList.remove('is-active');
            parentLi.classList.remove('active');
            parentLi.style.display = 'inline-flex';
            parentLi.style.visibility = 'visible';
          }
        }
        
        // Add click handler to switch language
        link.addEventListener('click', function(e) {
          // Let the link navigate normally (it will switch to the other language)
          // The link's href should already point to the correct language version
        });
      }
    });
    
    // Also handle radio buttons if they exist
    const radioButtons = languageToggle.querySelectorAll('input[type="radio"][name*="lang"], input[type="radio"][id*="lang"]');
    radioButtons.forEach(function(radio) {
      // Make radio button visible
      radio.style.display = 'inline-block';
      radio.style.visibility = 'visible';
      
      radio.addEventListener('change', function() {
        const selectedLang = this.value || this.id.replace(/.*lang[_-]?/i, '');
        const targetLink = languageToggle.querySelector('a[href*="' + selectedLang + '"], a[data-lang="' + selectedLang + '"], a[hreflang="' + selectedLang + '"]');
        
        if (targetLink && !targetLink.classList.contains('is-active')) {
          window.location.href = targetLink.getAttribute('href');
        }
      });
    });
    
    // Ensure only inactive language options are visible
    const languageBlock = languageToggle.querySelector('.block-language, .language-switcher-locale-url, nav');
    if (languageBlock) {
      languageBlock.style.display = 'flex';
      const blockLinks = languageBlock.querySelectorAll('a');
      blockLinks.forEach(function(link) {
        // Only show if it's not the active language
        if (!link.classList.contains('is-active')) {
          link.style.display = 'inline-flex';
          link.style.visibility = 'visible';
        } else {
          link.style.display = 'none';
          link.style.visibility = 'hidden';
        }
      });
    }
  }

  /**
   * Get current language from page
   */
  function getCurrentLanguage() {
    // Check HTML lang attribute
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) {
      return htmlLang.split('-')[0].toLowerCase();
    }
    
    // Check body class
    const bodyClasses = document.body.className;
    const langMatch = bodyClasses.match(/lang-(\w+)/);
    if (langMatch) {
      return langMatch[1].toLowerCase();
    }
    
    // Check URL
    const path = window.location.pathname;
    if (path.startsWith('/hi') || path.includes('/hi/')) {
      return 'hi';
    }
    if (path.startsWith('/en') || path.includes('/en/')) {
      return 'en';
    }
    
    // Default to English
    return 'en';
  }

  /**
   * Check if a link is a language link
   */
  function isLanguageLink(text, href, hreflang) {
    const langKeywords = ['english', 'hindi', 'en', 'hi'];
    const textLower = text.toLowerCase();
    const hrefLower = href.toLowerCase();
    const hreflangLower = (hreflang || '').toLowerCase();
    
    // Check hreflang attribute first
    if (hreflangLower === 'en' || hreflangLower === 'hi') {
      return true;
    }
    
    return langKeywords.some(function(keyword) {
      return textLower.includes(keyword) || 
             hrefLower.includes('/' + keyword) || 
             hrefLower.includes('lang=' + keyword) ||
             hrefLower.includes('language=' + keyword);
    });
  }

  /**
   * Detect language from link
   */
  function detectLanguageFromLink(text, href, hreflang) {
    const textLower = text.toLowerCase();
    const hrefLower = href.toLowerCase();
    const hreflangLower = (hreflang || '').toLowerCase();
    
    // Check hreflang attribute first (most reliable)
    if (hreflangLower === 'hi' || hreflangLower === 'hi-in') {
      return 'hi';
    }
    if (hreflangLower === 'en' || hreflangLower === 'en-us' || hreflangLower === 'en-gb') {
      return 'en';
    }
    
    // Check text content
    if (textLower.includes('hindi') || textLower === 'hi') {
      return 'hi';
    }
    if (textLower.includes('english') || textLower === 'en') {
      return 'en';
    }
    
    // Check URL
    if (hrefLower.includes('/hi') || hrefLower.includes('lang=hi') || hrefLower.includes('language=hi')) {
      return 'hi';
    }
    if (hrefLower.includes('/en') || hrefLower.includes('lang=en') || hrefLower.includes('language=en')) {
      return 'en';
    }
    
    // Default detection based on common patterns
    if (hrefLower.includes('/hi')) {
      return 'hi';
    }
    
    return 'en';
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }

  // Also re-initialize after AJAX updates (for Drupal)
  if (typeof Drupal !== 'undefined' && Drupal.behaviors) {
    Drupal.behaviors.languageSwitcher = {
      attach: function(context, settings) {
        if (context === document || context.querySelector('.language-toggle')) {
          initLanguageSwitcher();
        }
      }
    };
  }

})();

