/**
 * Dropdown Menu Keyboard Accessibility
 * WCAG 2.1.1 Compliance - Keyboard Access for Navigation Menus
 */

(function () {
    'use strict';

    console.log('🔵 Dropdown Keyboard Navigation: Script loaded!');

    // Initialize keyboard navigation for dropdowns
    function initDropdownKeyboardNav() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        console.log('🔵 Found', dropdownToggles.length, 'dropdown toggles');

        dropdownToggles.forEach(toggle => {
            // Handle Enter and Space to open dropdown
            toggle.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();

                    console.log('🔵 Enter/Space pressed on:', this.textContent.trim());

                    // KEYBOARD HOVER SIMULATION
                    // We toggle the .hover class on the PARENT LI
                    // This matches the CSS rule: .nav-item.dropdown.hover .dropdown-menu
                    const parentItem = this.closest('.nav-item.dropdown');

                    if (parentItem) {
                        if (parentItem.classList.contains('hover')) {
                            // Close
                            parentItem.classList.remove('hover');
                            this.setAttribute('aria-expanded', 'false');
                            console.log('🔴 Closed (removed .hover class)');
                        } else {
                            // Open
                            // First close any other open dropdowns
                            document.querySelectorAll('.nav-item.dropdown.hover').forEach(el => {
                                el.classList.remove('hover');
                                const toggle = el.querySelector('.dropdown-toggle');
                                if (toggle) toggle.setAttribute('aria-expanded', 'false');
                            });

                            parentItem.classList.add('hover');
                            this.setAttribute('aria-expanded', 'true');
                            console.log('🟢 Opened (added .hover class)');

                            // Focus first item
                            const dropdownMenu = this.nextElementSibling;
                            if (dropdownMenu) {
                                setTimeout(() => {
                                    const firstItem = dropdownMenu.querySelector('.dropdown-item');
                                    if (firstItem) firstItem.focus();
                                }, 100);
                            }
                        }
                    } else {
                        console.log('⚠️ Parent .nav-item.dropdown not found');
                        this.click(); // Fallback
                    }
                }

                // Arrow Down - Open dropdown and focus first item
                if (e.key === 'ArrowDown') {
                    e.preventDefault();

                    const isExpanded = this.getAttribute('aria-expanded') === 'true';
                    if (!isExpanded) {
                        this.click(); // Open it
                    }

                    // Focus first item in dropdown
                    const dropdownMenu = this.nextElementSibling;
                    setTimeout(() => {
                        const firstItem = dropdownMenu.querySelector('.dropdown-item');
                        if (firstItem) {
                            firstItem.focus();
                        }
                    }, 100);
                }

                // Escape - Close dropdown
                if (e.key === 'Escape') {
                    e.preventDefault();
                    const isExpanded = this.getAttribute('aria-expanded') === 'true';
                    if (isExpanded) {
                        this.click(); // Close it
                    }
                    this.focus();
                }
            });

            // Handle Tab to close dropdown when leaving
            toggle.addEventListener('blur', function (e) {
                const dropdownMenu = this.nextElementSibling;
                // Check if moving into dropdown, if not close
                setTimeout(() => {
                    const dropdownMenu = this.nextElementSibling;
                    if (dropdownMenu && !dropdownMenu.contains(document.activeElement)) {
                        const isExpanded = this.getAttribute('aria-expanded') === 'true';
                        if (isExpanded && typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                            const instance = bootstrap.Dropdown.getInstance(this);
                            if (instance) instance.hide();
                        }
                    }
                }, 150);
            });
        });

        // Handle keyboard navigation within dropdown menus
        const dropdownMenus = document.querySelectorAll('.dropdown-menu');
        dropdownMenus.forEach(menu => {
            const items = Array.from(menu.querySelectorAll('.dropdown-item'));

            items.forEach((item, index) => {
                item.addEventListener('keydown', function (e) {
                    // Arrow Down - Move to next item
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextItem = items[index + 1];
                        if (nextItem) {
                            nextItem.focus();
                        } else {
                            items[0].focus(); // Loop to first
                        }
                    }

                    // Arrow Up - Move to previous item
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevItem = items[index - 1];
                        if (prevItem) {
                            prevItem.focus();
                        } else {
                            items[items.length - 1].focus(); // Loop to last
                        }
                    }

                    // Escape - Close dropdown and return focus to toggle
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        const dropdown = this.closest('.dropdown');
                        if (dropdown) {
                            const toggle = dropdown.querySelector('.dropdown-toggle');
                            if (toggle) {
                                toggle.focus();
                                toggle.click(); // Close
                            }
                        }
                    }

                    // Tab - Allow natural tab, close dropdown when leaving
                    if (e.key === 'Tab') {
                        setTimeout(() => {
                            if (!menu.contains(document.activeElement)) {
                                const dropdown = this.closest('.dropdown');
                                if (dropdown) {
                                    const toggle = dropdown.querySelector('.dropdown-toggle');
                                    if (toggle) {
                                        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                                        if (isExpanded && typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                                            const instance = bootstrap.Dropdown.getInstance(toggle);
                                            if (instance) instance.hide();
                                        }
                                    }
                                }
                            }
                        }, 100);
                    }
                });
            });
        });
    }

    // Close all dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown')) {
            // Close Bootstrap instances
            const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
            openDropdowns.forEach(menu => {
                const dropdown = menu.closest('.dropdown');
                if (dropdown) {
                    const toggle = dropdown.querySelector('.dropdown-toggle');
                    if (toggle && typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                        const instance = bootstrap.Dropdown.getInstance(toggle);
                        if (instance) instance.hide();
                    }
                }
            });

            // Close our manual .hover class instances
            document.querySelectorAll('.nav-item.dropdown.hover').forEach(el => {
                el.classList.remove('hover');
                const toggle = el.querySelector('.dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        }
    });

    // Handle Escape globally to close .hover instances
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.nav-item.dropdown.hover').forEach(el => {
                el.classList.remove('hover');
                const toggle = el.querySelector('.dropdown-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.focus();
                }
            });
        }
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDropdownKeyboardNav);
    } else {
        initDropdownKeyboardNav();
    }
})();
