/**
 * @file
 * JS for Case Studies and Gallery Carousels.
 * Extracted from views-view-unformatted--case_studies--block-1.html.twig for CSP compliance.
 */

// Gallery Carousel Functionality
(function () {
    function initAGKGalleryCarousel() {
        const track = document.querySelector('.gallery-carousel-track');
        const prevBtn = document.querySelector('.gallery-nav-prev');
        const nextBtn = document.querySelector('.gallery-nav-next');

        if (!track || !prevBtn || !nextBtn) return;

        const items = track.querySelectorAll('.gallery-carousel-item');
        if (items.length === 0) return;

        let currentIndex = 0;
        let isTransitioning = false;

        function getItemWidth() {
            return items[0].offsetWidth || 0;
        }

        function updatePosition() {
            if (isTransitioning) return;

            const itemWidth = getItemWidth();
            const gap = 20;
            const translateX = -(currentIndex * (itemWidth + gap));

            track.style.transition = 'transform 0.5s ease';
            track.style.transform = `translateX(${translateX}px)`;

            isTransitioning = true;
            setTimeout(() => {
                isTransitioning = false;

                if (currentIndex >= items.length) {
                    currentIndex = 0;
                    track.style.transition = 'none';
                    track.style.transform = `translateX(0px)`;
                    setTimeout(() => {
                        track.style.transition = 'transform 0.5s ease';
                    }, 50);
                } else if (currentIndex < 0) {
                    currentIndex = items.length - 1;
                    const finalTranslateX = -((items.length - 1) * (itemWidth + gap));
                    track.style.transition = 'none';
                    track.style.transform = `translateX(${finalTranslateX}px)`;
                    setTimeout(() => {
                        track.style.transition = 'transform 0.5s ease';
                    }, 50);
                }
            }, 500);
        }

        prevBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            currentIndex--;
            updatePosition();
        });

        nextBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            currentIndex++;
            updatePosition();
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updatePosition();
            }, 250);
        });

        updatePosition();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAGKGalleryCarousel);
    } else {
        initAGKGalleryCarousel();
    }
})();

// Case Studies Carousel Functionality
(function () {
    function initCaseStudiesCarousel() {
        const track = document.querySelector('.case-studies-carousel-track');
        const prevBtn = document.querySelector('.case-studies-nav-prev');
        const nextBtn = document.querySelector('.case-studies-nav-next');

        if (!track || !prevBtn || !nextBtn) return;

        const items = track.querySelectorAll('.case-studies-carousel-item');
        if (items.length === 0) return;

        let currentIndex = 0;
        let isTransitioning = false;
        const itemsPerView = window.innerWidth >= 992 ? 3 : window.innerWidth >= 768 ? 2 : 1;
        const maxIndex = Math.max(0, items.length - itemsPerView);

        function getItemWidth() {
            if (items.length === 0) return 0;
            const container = track.parentElement;
            const containerWidth = container.offsetWidth;
            const gap = 20;
            return (containerWidth - (itemsPerView - 1) * gap) / itemsPerView;
        }

        function updatePosition() {
            if (isTransitioning) return;

            // Clamp currentIndex to valid range
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > maxIndex) currentIndex = maxIndex;

            const itemWidth = getItemWidth();
            const gap = 20;
            const translateX = -(currentIndex * (itemWidth + gap));

            track.style.transition = 'transform 0.5s ease';
            track.style.transform = `translateX(${translateX}px)`;

            // Update button states
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
            prevBtn.style.cursor = currentIndex === 0 ? 'not-allowed' : 'pointer';
            nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            nextBtn.style.cursor = currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
        }

        prevBtn.addEventListener('click', () => {
            if (isTransitioning || currentIndex === 0) return;
            currentIndex--;
            updatePosition();
        });

        nextBtn.addEventListener('click', () => {
            if (isTransitioning || currentIndex >= maxIndex) return;
            currentIndex++;
            updatePosition();
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newItemsPerView = window.innerWidth >= 992 ? 3 : window.innerWidth >= 768 ? 2 : 1;
                const newMaxIndex = Math.max(0, items.length - newItemsPerView);
                if (currentIndex > newMaxIndex) currentIndex = newMaxIndex;
                updatePosition();
            }, 250);
        });

        updatePosition();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCaseStudiesCarousel);
    } else {
        initCaseStudiesCarousel();
    }
})();
