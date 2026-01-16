/**
 * @file
 * JS for Know Your CBC Carousel.
 * Extracted from views-view-unformatted--know_your_cbc--page_1.html.twig for CSP compliance.
 */

(function () {
    function initKnowYourCbc() {
        const track = document.getElementById('documentCarouselTrack');
        const nextBtn = document.getElementById('documentNextBtn');
        const prevBtn = document.getElementById('documentPrevBtn');
        const currentPageEl = document.getElementById('currentPage');
        const totalPages = 28;
        let currentPageIndex = 0;

        if (!track || !nextBtn || !prevBtn) return;

        // Get all page elements
        const pages = track.querySelectorAll('.document-page');
        if (pages.length === 0) return;

        // Update page indicator
        function updatePageIndicator() {
            if (currentPageEl) {
                currentPageEl.textContent = currentPageIndex + 1;
            }
        }

        // Scroll to page using native scrollIntoView (no complex logic)
        function scrollToPage(index) {
            if (index < 0) index = totalPages - 1;
            if (index >= totalPages) index = 0;

            currentPageIndex = index;
            const targetPage = document.getElementById('kyc-page-' + (index + 1));
            if (targetPage) {
                targetPage.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            }
            updatePageIndicator();
        }

        // Next button
        nextBtn.addEventListener('click', function () {
            scrollToPage(currentPageIndex + 1);
        });

        // Previous button
        prevBtn.addEventListener('click', function () {
            scrollToPage(currentPageIndex - 1);
        });

        // Update indicator on scroll (debounced for performance)
        let scrollTimeout;
        track.addEventListener('scroll', function () {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                const scrollLeft = track.scrollLeft;
                const pageWidth = track.clientWidth;
                const newIndex = Math.round(scrollLeft / pageWidth);
                if (newIndex >= 0 && newIndex < totalPages && newIndex !== currentPageIndex) {
                    currentPageIndex = newIndex;
                    updatePageIndicator();
                }
            }, 100);
        });

        // Keyboard navigation
        document.addEventListener('keydown', function (e) {
            if (track.getBoundingClientRect().top < window.innerHeight && track.getBoundingClientRect().bottom > 0) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    scrollToPage(currentPageIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    scrollToPage(currentPageIndex + 1);
                }
            }
        });

        // Initialize
        updatePageIndicator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKnowYourCbc);
    } else {
        initKnowYourCbc();
    }
})();
