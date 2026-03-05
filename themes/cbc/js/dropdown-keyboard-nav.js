/**
 * CBC Dropdown Menu Keyboard Accessibility
 */

(function () {
    'use strict';

    console.log('🔵 CBC Dropdown Keyboard Navigation: Script Loaded');

    let initAttempts = 0;

    const init = () => {
        initAttempts++;
        const navs = document.querySelectorAll('.navbar-nav');

        if (navs.length === 0) {
            if (initAttempts < 10) {
                console.log('⚠️ No .navbar-nav found, retrying attempt ' + initAttempts);
                setTimeout(init, 500);
            }
            return;
        }

        console.log('🟢 CBC Dropdown Keyboard Navigation: Initializing on ' + navs.length + ' nav(s)');

        // Helper: Close all dropdowns
        const closeAll = (exceptParent = null) => {
            document.querySelectorAll('.dropdown.hover, .has-submenu.hover').forEach(el => {
                if (exceptParent && exceptParent.contains(el)) return;
                el.classList.remove('hover');
                const toggle = el.querySelector('.dropdown-toggle');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        };

        // Keydown Handler
        const handleKeyDown = (e) => {
            try {
                const target = e.target;
                const toggle = target.closest('.dropdown-toggle');
                const item = target.closest('.dropdown-item, .sub-item');

                // 1. Handle Toggle (Enter/Space/ArrowDown)
                if (toggle && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
                    const parent = toggle.closest('.dropdown, .has-submenu');
                    if (!parent) return;

                    e.preventDefault();
                    e.stopPropagation();

                    const isCurrentlyOpen = parent.classList.contains('hover');

                    if (!isCurrentlyOpen) {
                        // Close siblings at same level
                        const siblings = parent.parentElement.querySelectorAll(':scope > .hover');
                        siblings.forEach(el => el.classList.remove('hover'));

                        parent.classList.add('hover');
                        toggle.setAttribute('aria-expanded', 'true');
                        console.log('🟢 Keyboard Opened:', toggle.textContent.trim());

                        // Focus first child
                        setTimeout(() => {
                            const first = parent.querySelector('.dropdown-item, .sub-item');
                            if (first) {
                                first.focus();
                            }
                        }, 50);
                    } else if (e.key !== 'ArrowDown') {
                        // Close on Enter/Space if already open
                        parent.classList.remove('hover');
                        toggle.setAttribute('aria-expanded', 'false');
                        console.log('🔴 Keyboard Closed:', toggle.textContent.trim());
                    }
                }

                // 2. Handle Item navigation
                if (item) {
                    const menu = item.closest('.dropdown-menu, .sub-items-container');
                    if (!menu) return;

                    const items = Array.from(menu.querySelectorAll('.dropdown-item, .sub-item'));
                    const index = items.indexOf(item);

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        (items[index + 1] || items[0]).focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        (items[index - 1] || items[items.length - 1]).focus();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        const p = item.closest('.dropdown, .has-submenu');
                        if (p) {
                            const t = p.querySelector('.dropdown-toggle');
                            p.classList.remove('hover');
                            if (t) {
                                t.setAttribute('aria-expanded', 'false');
                                t.focus();
                            }
                        }
                    } else if (e.key === 'ArrowRight' && item.classList.contains('dropdown-toggle')) {
                        // Enter nested menu
                        e.preventDefault();
                        item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                    } else if (e.key === 'ArrowLeft') {
                        // Exit nested menu
                        const nestedMenu = item.closest('.sub-items-container');
                        if (nestedMenu) {
                            e.preventDefault();
                            const p = nestedMenu.closest('.has-submenu');
                            if (p) {
                                p.classList.remove('hover');
                                const t = p.querySelector('.dropdown-toggle');
                                if (t) {
                                    t.setAttribute('aria-expanded', 'false');
                                    t.focus();
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('CBC Keyboard Nav Warning:', err);
            }
        };

        // Attach listeners to each nav
        navs.forEach(nav => {
            if (nav.hasAttribute('data-cbc-nav-init')) return;
            nav.setAttribute('data-cbc-nav-init', 'true');
            nav.addEventListener('keydown', handleKeyDown);

            // Accessiblity fix: update aria-expanded on mouse hover
            nav.querySelectorAll('.dropdown, .has-submenu').forEach(item => {
                item.addEventListener('mouseenter', function() {
                    const toggle = this.querySelector('.dropdown-toggle');
                    if (toggle) toggle.setAttribute('aria-expanded', 'true');
                });
                item.addEventListener('mouseleave', function() {
                    const toggle = this.querySelector('.dropdown-toggle');
                    if (toggle && !this.classList.contains('hover')) {
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                });
            });
        });

        // Global listeners (once)
        if (!document.body.hasAttribute('data-cbc-global-init')) {
            document.body.setAttribute('data-cbc-global-init', 'true');

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown, .has-submenu')) {
                    closeAll();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeAll();
                }
            });
        }
    };

    // Initialize with a few retries for safety
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
        setTimeout(init, 1000);
    }

})();

