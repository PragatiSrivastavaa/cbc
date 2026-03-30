/**
 * SADHANA SAPTAH — Landing Page JavaScript
 * File: sadhana-saptah.js
 *
 * Zero external dependencies. Contains:
 *   1. CbcCarousel — lightweight carousel replacing Swiper CDN (~140 KB saved)
 *   2. Tab switcher (schedule, courses, testimonials)
 *   3. Calendar interactivity
 *   4. Event swiper data-driven update
 *
 * ★ Adding carousel items needs only HTML changes — no JS edits.
 */

(function () {
    'use strict';

    /* =================================================================
       CbcCarousel — Lightweight Carousel Engine
       Supports: slide | fade effects, autoplay, pagination, nav buttons,
                 touch/swipe, pause on hover, dynamic slide update.
       ================================================================= */
    function CbcCarousel(containerEl, options) {
        if (!containerEl) return;

        this.el       = containerEl;
        this.wrapper  = containerEl.querySelector('.swiper-wrapper');
        this.pagEl    = containerEl.querySelector('.swiper-pagination');
        this.nextEl   = containerEl.querySelector('.cbc-next-btn');
        this.prevEl   = containerEl.querySelector('.cbc-prev-btn');

        var opts = options || {};
        this.effect        = opts.effect        || 'slide';    // 'slide' | 'fade'
        this.loop          = opts.loop          !== false;
        this.autoplay      = opts.autoplay      || false;
        this.autoplayDelay = opts.autoplayDelay || 3500;

        this.current    = 0;
        this.timer      = null;
        this.bullets    = [];

        this._init();
    }

    CbcCarousel.prototype._slides = function () {
        return Array.from(this.wrapper ? this.wrapper.querySelectorAll('.swiper-slide') : []);
    };

    CbcCarousel.prototype._init = function () {
        if (!this.wrapper) return;

        var slides = this._slides();
        if (slides.length === 0) return;

        /* Apply effect class to container so CSS handles layout */
        if (this.effect === 'fade') {
            this.el.classList.add('cbc-fade');
        }

        this._buildPagination(slides.length);
        this._bindNav();
        this._bindTouch();
        this._goTo(0, false);

        if (this.autoplay) {
            this._startAutoplay();
            /* Pause autoplay while hovering */
            var self = this;
            this.el.addEventListener('mouseenter', function () { self._stopAutoplay(); });
            this.el.addEventListener('mouseleave', function () { self._startAutoplay(); });
        }
    };

    CbcCarousel.prototype._buildPagination = function (count) {
        if (!this.pagEl) return;
        this.pagEl.innerHTML = '';
        this.bullets = [];
        var self = this;

        for (var i = 0; i < count; i++) {
            var b = document.createElement('span');
            b.className = 'swiper-pagination-bullet';
            (function (idx) {
                b.addEventListener('click', function () { self._goTo(idx); });
            })(i);
            this.pagEl.appendChild(b);
            this.bullets.push(b);
        }
    };

    CbcCarousel.prototype._goTo = function (index, animate) {
        var slides = this._slides();
        var total  = slides.length;
        if (total === 0) return;

        /* Normalise index with looping */
        this.current = ((index % total) + total) % total;

        if (this.effect === 'fade') {
            /* Fade: toggle active class; CSS handles opacity transition */
            slides.forEach(function (s, i) {
                s.classList.toggle('cbc-slide-active', i === this.current);
            }, this);
        } else {
            /* Slide: translate the wrapper */
            if (animate === false) {
                this.wrapper.style.transition = 'none';
            } else {
                this.wrapper.style.transition = '';
            }
            /* Force reflow so 'none' takes effect before the transform */
            if (animate === false) { void this.wrapper.offsetWidth; }
            var pct = -(this.current * (100 / total));
            this.wrapper.style.width     = total + '00%';
            this.wrapper.style.transform = 'translateX(' + pct + '%)';
            slides.forEach(function (s) { s.style.width = (100 / total) + '%'; });
        }

        /* Update pagination bullets */
        this.bullets.forEach(function (b, i) {
            b.classList.toggle('swiper-pagination-bullet-active', i === this.current);
        }, this);
    };

    CbcCarousel.prototype.next = function () {
        this._goTo(this.current + 1);
    };

    CbcCarousel.prototype.prev = function () {
        this._goTo(this.current - 1);
    };

    CbcCarousel.prototype.slideTo = function (idx) {
        this._goTo(idx);
    };

    /* Re-query slides after DOM changes (used by event gallery updater) */
    CbcCarousel.prototype.update = function () {
        var slides = this._slides();
        if (slides.length === 0) return;

        if (this.effect === 'slide') {
            var total = slides.length;
            this.wrapper.style.width = total + '00%';
            slides.forEach(function (s) { s.style.width = (100 / total) + '%'; });
        }
        this._buildPagination(slides.length);
        this._goTo(0, false);
    };

    CbcCarousel.prototype._bindNav = function () {
        var self = this;
        if (this.nextEl) this.nextEl.addEventListener('click', function () { self.next(); });
        if (this.prevEl) this.prevEl.addEventListener('click', function () { self.prev(); });
    };

    CbcCarousel.prototype._bindTouch = function () {
        var self   = this;
        var startX = 0;
        this.el.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
        }, { passive: true });
        this.el.addEventListener('touchend', function (e) {
            var diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                diff > 0 ? self.next() : self.prev();
            }
        }, { passive: true });
    };

    CbcCarousel.prototype._startAutoplay = function () {
        var self = this;
        this._stopAutoplay();
        this.timer = setInterval(function () { self.next(); }, this.autoplayDelay);
    };

    CbcCarousel.prototype._stopAutoplay = function () {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    };

    CbcCarousel.prototype.destroy = function () {
        this._stopAutoplay();
    };

    /* =================================================================
       EVENT DATA — Read from DOM (id="cbc-events-data" in the HTML).
       To add/change events: edit the HTML in the Drupal basic page.
       ZERO JS edits needed.
       ================================================================= */

    /**
     * Reads all <div data-day="..."> elements inside #cbc-events-data
     * and returns an object keyed by day number: { '2': [{...}], '3': [...] }
     */
    function readEventsFromDOM() {
        var data = {};
        var container = document.getElementById('cbc-events-data');
        if (!container) return data;

        var rows = container.querySelectorAll('[data-day]');
        rows.forEach(function (el) {
            var day = el.getAttribute('data-day');
            if (!day) return;
            if (!data[day]) data[day] = [];
            data[day].push({
                img:      el.getAttribute('data-img')      || '',
                title:    el.getAttribute('data-title')    || 'Event',
                location: el.getAttribute('data-location') || '',
                date:     el.getAttribute('data-date')     || ''
            });
        });
        return data;
    }

    var eventCarousel = null;

    /* =================================================================
       HELPERS
       ================================================================= */
    function getOrdinal(d) {
        d = parseInt(d, 10);
        if (d === 1) return 'st';
        if (d === 2) return 'nd';
        if (d === 3) return 'rd';
        return 'th';
    }

    /* =================================================================
       GENERIC TAB SWITCHER
       Works for any tab group: data-tab / data-test-tab / data-course
       ================================================================= */
    function initTabGroup(tabSelector, contentSelector, attr, prefix) {
        var tabs     = document.querySelectorAll(tabSelector);
        var contents = document.querySelectorAll(contentSelector);
        if (!tabs.length) return;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = this.getAttribute(attr);
                tabs.forEach(function (t) { t.classList.remove('active'); });
                this.classList.add('active');
                contents.forEach(function (c) {
                    c.classList.remove('active');
                    if (c.id === prefix + target) c.classList.add('active');
                });
            });
        });
    }

    /* =================================================================
       EVENT GALLERY UPDATER (calendar-driven)
       ================================================================= */
    function updateEventGallery(day) {
        var wrapper  = document.querySelector('.eventSwiper .swiper-wrapper');
        var fraction = document.querySelector('.cbc-event-fraction');
        if (!wrapper) return;

        /* Read content from HTML every time — no JS object to maintain */
        var eventsData = readEventsFromDOM();
        var events = eventsData[day] || [];
        wrapper.innerHTML = '';

        if (events.length === 0) {
            wrapper.innerHTML =
                '<div class="swiper-slide">' +
                '<div class="cbc-event-card" style="display:flex;align-items:center;justify-content:center;">' +
                '<span style="color:#94a3b8;font-size:17px;">No events scheduled for this day</span>' +
                '</div></div>';
        } else {
            events.forEach(function (ev) {
                wrapper.insertAdjacentHTML('beforeend',
                    '<div class="swiper-slide">' +
                    '<div class="cbc-event-card">' +
                    '<img src="' + ev.img + '" class="event-img" alt="' + ev.title + '">' +
                    '<div class="event-overlay">' +
                    '<h3>' + ev.title + '</h3>' +
                    '<div class="event-meta">' +
                    '<span>📍 ' + ev.location + '</span>' +
                    '<span class="event-date-badge">' + ev.date + '</span>' +
                    '</div></div></div></div>');
            });
        }

        if (fraction) fraction.textContent = events.length > 0 ? '1 of ' + events.length : '0 of 0';

        if (eventCarousel) {
            eventCarousel.update();
        }
    }

    /* =================================================================
       CALENDAR INTERACTIVITY
       ================================================================= */
    function initCalendar() {
        var days = document.querySelectorAll('.cbc-calendar-day:not(.muted)');
        if (!days.length) return;

        days.forEach(function (dayEl) {
            dayEl.addEventListener('click', function () {
                document.querySelectorAll('.cbc-calendar-day').forEach(function (el) {
                    el.classList.remove('active');
                });
                this.classList.add('active');

                var day = this.textContent.trim();
                var headerSpan = document.querySelector('.cbc-calendar-header span');
                if (headerSpan) headerSpan.textContent = day + getOrdinal(day) + ' April, 2026';
                updateEventGallery(day);
            });
        });
    }

    /* =================================================================
       COURSE SUB-TABS
       ================================================================= */
    function initCourseTabs() {
        var tabs = document.querySelectorAll('.cbc-course-tab');
        if (!tabs.length) return;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var type = this.getAttribute('data-course');
                tabs.forEach(function (t) { t.classList.remove('active'); });
                this.classList.add('active');

                var aiTable = document.getElementById('course-ai-table');
                var mkTable = document.getElementById('course-marketplace-table');
                if (aiTable) aiTable.style.display = (type === 'ai')          ? 'block' : 'none';
                if (mkTable) mkTable.style.display  = (type === 'marketplace') ? 'block' : 'none';
            });
        });
    }

    /* =================================================================
       MAIN INIT
       ================================================================= */
    function init() {
        /* ── Carousels ── */

        /* Photo gallery: fade, autoplay 3.5s */
        var photoEl = document.querySelector('.photoSwiper');
        if (photoEl) {
            new CbcCarousel(photoEl, { effect: 'fade', loop: true, autoplay: true, autoplayDelay: 3500 });
        }

        /* Video gallery: slide, autoplay 7s */
        var videoEl = document.querySelector('.videoSwiper');
        if (videoEl) {
            new CbcCarousel(videoEl, { effect: 'slide', loop: true, autoplay: true, autoplayDelay: 7000 });
        }

        /* Leaders' Voices: slide, manual nav — no autoplay (video carousel) */
        var leadersEl = document.querySelector('.leadersSwiper');
        if (leadersEl) {
            new CbcCarousel(leadersEl, { effect: 'slide', loop: true, autoplay: false });
        }

        /* Testimonial Videos: slide, manual nav only */
        var testVideoEl = document.querySelector('.testimonialVideoSwiper');
        if (testVideoEl) {
            new CbcCarousel(testVideoEl, { effect: 'slide', loop: true, autoplay: false });
        }

        /* Event gallery (calendar-driven): slide, no autoplay */
        var eventEl = document.querySelector('.eventSwiper');
        if (eventEl) {
            eventCarousel = new CbcCarousel(eventEl, { effect: 'slide', loop: false, autoplay: false });
            updateEventGallery('2'); /* default to April 2nd */
        }

        /* ── Tabs ── */
        initTabGroup('.cbc-schedule-tab',    '.cbc-schedule-content',    'data-tab',       'tab-');
        initTabGroup('.cbc-testimonial-tab', '.cbc-testimonial-content', 'data-test-tab',  'test-');
        initCourseTabs();

        /* ── Calendar ── */
        initCalendar();
    }

    /* Run when DOM is ready */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
