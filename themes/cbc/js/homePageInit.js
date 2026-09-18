// It will be called when navigating to the home page via the router

let lastFocusedElement;

function initializeHomePage() {
  // Wait for DOM to be fully ready and elements to be available
  const initFunctions = () => {
    initializeCarousel();
    initializeAlertBar();
    initializeCountSection();
    initializeBlogSection();
    initializeCollaborationCarousel();
    initializeNewsBanner();
    initializeMediaCorner();
    initializeBlockSection();
    initializeNewsletters();
    initializeYouTubeCarousel();
    initializePhotoCarousel();
    initializeSocialCarousel();
    initializeInfocusSection();
    initializeHomeEvents();
    initializePartnerSlider();
    initializeChairpersonModal();
    initializeSocialLinkAccessibility(); // Fix for empty social links
    initializeContactIconsAccessibility(); // Fix for missing accessible names on contact icons
    initializeTestimonialsCarousel(); // WCAG: Pause/Next/Prev for testimonials
    updateHeroHeight();
  };

  // Add resize listener for dynamic height adjustment
  window.addEventListener('resize', updateHeroHeight);

  // If DOM is already loaded, wait a bit for elements to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initFunctions, 200);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initFunctions, 200);
    });
  }
}

// --------------------- Carousel -----------------------------------//
function initializeCarousel() {
  const buttons = document.querySelectorAll('.nav-buttons button');
  const slides = document.querySelectorAll('.slide-content');
  const video = document.getElementById('bg-video');
  const image = document.getElementById('bg-image');

  // Read media items data from JSON script tag
  let slideMedia = [];
  const mediaDataScript = document.getElementById('carousel-media-data');
  const videoDataScript = document.getElementById('carousel-video-data');

  if (mediaDataScript) {
    try {
      slideMedia = JSON.parse(mediaDataScript.textContent);
    } catch (e) {
      console.error('Error parsing slideMedia:', e);
    }
  } else if (videoDataScript) {
    try {
      const legacyVideos = JSON.parse(videoDataScript.textContent);
      slideMedia = legacyVideos.map(url => ({
        type: url ? 'video' : 'none',
        url: url,
        alt: 'CBC Banner'
      }));
    } catch (e) {
      console.error('Error parsing videoDataScript:', e);
    }
  }

  if ((!video && !image) || !buttons.length || !slides.length) return;

  let currentSlide = 0;
  let carouselAutoSlide = null;
  let isCarouselPaused = false;
  let isVideoMuted = true;
  const carouselPauseBtn = document.getElementById('carouselPauseBtn');
  const videoMuteBtn = document.getElementById('videoMuteBtn');
  const heroPauseContainer = document.querySelector('.hero-pause-container');

  function showSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      if (i === index) {
        slide.setAttribute('aria-current', 'page');
      } else {
        slide.removeAttribute('aria-current');
      }
    });

    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      if (i === index) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    const mediaItem = slideMedia[index];

    if (mediaItem && mediaItem.type === 'image' && mediaItem.url) {
      // Show Image slide
      if (video) {
        video.pause();
        video.style.display = 'none';
      }
      if (image) {
        image.src = mediaItem.url;
        image.alt = mediaItem.alt || mediaItem.title || 'CBC Banner Image';
        image.style.display = 'block';
      }
      if (heroPauseContainer) {
        heroPauseContainer.style.setProperty('display', 'none', 'important');
      }
    } else if (mediaItem && mediaItem.type === 'video' && mediaItem.url) {
      // Show Video slide
      if (image) {
        image.style.display = 'none';
      }
      if (video) {
        video.style.display = 'block';

        // Update video source
        while (video.firstChild) video.removeChild(video.firstChild);
        const source = document.createElement('source');
        source.src = mediaItem.url;
        source.type = 'video/mp4';
        video.appendChild(source);

        // Filter for first video if applicable
        if (index === 0) {
          video.style.filter = 'brightness(115%) saturate(150%)';
        } else {
          video.style.filter = 'none';
        }

        video.load();
        video.muted = isVideoMuted;
        if (isVideoMuted) {
          video.setAttribute('muted', 'muted');
        } else {
          video.removeAttribute('muted');
        }
        if (!isCarouselPaused && document.body.getAttribute('data-pause-animations') !== 'true') {
          video.play().catch(err => console.log('Video play failed:', err));
        }
      }
      if (heroPauseContainer) {
        heroPauseContainer.style.setProperty('display', 'flex', 'important');
      }
      if (videoMuteBtn) {
        videoMuteBtn.style.setProperty('display', 'flex', 'important');
      }
    }

    restartAutoSlide();
  }

  function startAutoSlide() {
    stopAutoSlide();
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (isCarouselPaused || globalPauseActive) return;

    const mediaItem = slideMedia[currentSlide];
    // If it's an image slide, auto transition after 6 seconds
    // If it's a video, use a 60-second fallback timer (main transition is handled by 'ended' event)
    const duration = (mediaItem && mediaItem.type === 'image') ? 6000 : 60000;

    carouselAutoSlide = setTimeout(() => {
      const isPausedNow = isCarouselPaused || document.body.getAttribute('data-pause-animations') === 'true';
      if (!isPausedNow) {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
      }
    }, duration);
  }

  function stopAutoSlide() {
    if (carouselAutoSlide) {
      clearTimeout(carouselAutoSlide);
      carouselAutoSlide = null;
    }
  }

  function restartAutoSlide() {
    if (!isCarouselPaused) {
      stopAutoSlide();
      startAutoSlide();
    }
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      showSlide(i);
    });
  });

  // Navigation Arrows
  const prevArrow = document.querySelector('.carousel-prev');
  const nextArrow = document.querySelector('.carousel-next');

  if (prevArrow) {
    prevArrow.setAttribute('aria-label', 'Previous Slide');
    prevArrow.addEventListener('click', () => {
      const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(prevIndex);
    });
  }

  if (nextArrow) {
    nextArrow.setAttribute('aria-label', 'Next Slide');
    nextArrow.addEventListener('click', () => {
      const nextIndex = (currentSlide + 1) % slides.length;
      showSlide(nextIndex);
    });
  }

  // Pause/Play Button
  if (carouselPauseBtn) {
    carouselPauseBtn.addEventListener('click', () => {
      const icon = carouselPauseBtn.querySelector('i');
      if (isCarouselPaused) {
        // Resume
        isCarouselPaused = false;
        const mediaItem = slideMedia[currentSlide];
        if (video && mediaItem && mediaItem.type === 'video') {
          video.play().catch(err => console.log('Video resume failed:', err));
        }
        startAutoSlide();
        if (icon) {
          icon.classList.remove('fa-play');
          icon.classList.add('fa-pause');
        }
        carouselPauseBtn.setAttribute('aria-label', 'Pause Video and Carousel');
      } else {
        // Pause
        isCarouselPaused = true;
        if (video) {
          video.pause();
        }
        stopAutoSlide();
        if (icon) {
          icon.classList.remove('fa-pause');
          icon.classList.add('fa-play');
        }
        carouselPauseBtn.setAttribute('aria-label', 'Play Video and Carousel');
      }
    });
  }

  // Mute/Unmute Button
  if (videoMuteBtn) {
    videoMuteBtn.addEventListener('click', () => {
      const icon = videoMuteBtn.querySelector('i');
      isVideoMuted = !isVideoMuted;
      if (video) {
        video.muted = isVideoMuted;
        if (isVideoMuted) {
          video.setAttribute('muted', 'muted');
        } else {
          video.removeAttribute('muted');
        }
      }

      if (isVideoMuted) {
        if (icon) {
          icon.classList.remove('fa-volume-up');
          icon.classList.add('fa-volume-mute');
        }
        videoMuteBtn.setAttribute('aria-label', 'Unmute Video');
      } else {
        if (icon) {
          icon.classList.remove('fa-volume-mute');
          icon.classList.add('fa-volume-up');
        }
        videoMuteBtn.setAttribute('aria-label', 'Mute Video');
      }
    });
  }

  // Listen for global pause-animations changes
  const carouselObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-pause-animations') {
        const globalPaused = document.body.getAttribute('data-pause-animations') === 'true';
        if (globalPaused) {
          if (video) video.pause();
          stopAutoSlide();
          if (carouselPauseBtn) {
            const icon = carouselPauseBtn.querySelector('i');
            if (icon) {
              icon.classList.remove('fa-pause');
              icon.classList.add('fa-play');
            }
            carouselPauseBtn.setAttribute('aria-label', 'Play Video and Carousel');
          }
        } else if (!isCarouselPaused) {
          const mediaItem = slideMedia[currentSlide];
          if (video && mediaItem && mediaItem.type === 'video') {
            video.play().catch(err => console.log('Video resume failed:', err));
          }
          startAutoSlide();
          if (carouselPauseBtn) {
            const icon = carouselPauseBtn.querySelector('i');
            if (icon) {
              icon.classList.remove('fa-play');
              icon.classList.add('fa-pause');
            }
            carouselPauseBtn.setAttribute('aria-label', 'Pause Video and Carousel');
          }
        }
      }
    });
  });
  carouselObserver.observe(document.body, { attributes: true, attributeFilter: ['data-pause-animations'] });

  // Handle video ended to automatically go to next slide
  if (video) {
    video.addEventListener('ended', () => {
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isCarouselPaused && !globalPauseActive) {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
      }
    });
  }

  // Initialize first slide
  showSlide(0);
}

/**
 * Synchronize the heights of the Photo and Video gallery cards
 */
function syncGalleryHeights() {
  const galleries = document.querySelectorAll('.glimpses-card');
  if (galleries.length < 2) return;

  if (window.innerWidth <= 768) {
    // Don't sync on mobile where they are stacked
    galleries.forEach(g => g.style.height = 'auto');
    return;
  }

  // Reset heights first to get natural content height
  galleries.forEach(g => g.style.height = 'auto');

  // Small delay to allow layout to settle
  setTimeout(() => {
    let maxHeight = 0;
    galleries.forEach(g => {
      const h = g.offsetHeight;
      if (h > maxHeight) maxHeight = h;
    });

    if (maxHeight > 0) {
      galleries.forEach(g => {
        g.style.height = `${maxHeight}px`;
      });
    }
  }, 50);
}

// Initial sync
syncGalleryHeights();
window.addEventListener('load', syncGalleryHeights);
if (window.ResizeObserver) {
  const observer = new ResizeObserver(() => {
    syncGalleryHeights();
  });
  const galleries = document.querySelectorAll('.glimpses-card');
  galleries.forEach(g => observer.observe(g));
} else {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncGalleryHeights, 150);
  });
}
setTimeout(syncGalleryHeights, 1000);
setTimeout(syncGalleryHeights, 3000);

// Initialize everything
initializeHomePage();

// --------------------- Dynamic Height Calculation -------------------------//
function updateHeroHeight() {
  const header = document.querySelector('header');
  const alertBar = document.querySelector('.alert-bar-container');
  const root = document.documentElement;

  if (header) {
    const headerHeight = header.offsetHeight;
    root.style.setProperty('--header-height', `${headerHeight}px`);
  }

  if (alertBar) {
    const alertBarHeight = alertBar.offsetHeight;
    root.style.setProperty('--alert-height', `${alertBarHeight}px`);
  }
}



// ----------------------- Contact Icons Accessibility ----------------------- //
function initializeContactIconsAccessibility() {
  const contactSection = document.querySelector('.footer-contact');
  if (!contactSection) return;

  // Helper to add label to icon
  const addLabelToIcon = (icon, label) => {
    if (icon) {
      if (!icon.hasAttribute('aria-label') && !icon.hasAttribute('aria-labelledby')) {
        icon.setAttribute('aria-label', label);
        icon.setAttribute('role', 'img');
      }
    }
  };

  // 1. Phone Icons
  // Look for icons inside links with tel: protocol
  const phoneLinks = contactSection.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(link => {
    const icon = link.querySelector('i, svg');
    if (icon) addLabelToIcon(icon, 'Phone');
  });

  // Look for standalone phone icons if not found in links (fallback)
  const phoneIcons = contactSection.querySelectorAll('.fa-phone, .fa-phone-alt, .fa-mobile, .fa-mobile-alt');
  phoneIcons.forEach(icon => {
    if (!icon.closest('a[href^="tel:"]')) { // Avoid double labeling
      addLabelToIcon(icon, 'Phone');
    }
  });

  // 2. Email Icons
  // Look for icons inside links with mailto: protocol
  const emailLinks = contactSection.querySelectorAll('a[href^="mailto:"]');
  emailLinks.forEach(link => {
    const icon = link.querySelector('i, svg');
    if (icon) addLabelToIcon(icon, 'Email');
  });

  // Look for standalone email icons (fallback)
  const emailIcons = contactSection.querySelectorAll('.fa-envelope, .fa-envelope-open');
  emailIcons.forEach(icon => {
    if (!icon.closest('a[href^="mailto:"]')) {
      addLabelToIcon(icon, 'Email');
    }
  });

  // 3. Location/Address Icon
  // Usually map marker
  const locationIcons = contactSection.querySelectorAll('.fa-map-marker, .fa-map-marker-alt, .fa-location-arrow, .fa-location-dot');
  locationIcons.forEach(icon => {
    addLabelToIcon(icon, 'Location');
  });
}


// ----------------------- Alert Bar Section ---------------------------------//
function initializeAlertBar() {
  const alertTrack = document.getElementById('alertTrack');
  const pauseBtn = document.getElementById('alertPauseBtn');
  const prevBtn = document.getElementById('alertPrevBtn');
  const nextBtn = document.getElementById('alertNextBtn');

  if (!alertTrack || !pauseBtn || !prevBtn || !nextBtn) return;

  // Duplicate items for seamless scrolling
  if (!alertTrack.hasAttribute('data-cloned')) {
    const originalItems = alertTrack.querySelectorAll('.alert-item');
    if (originalItems.length > 0) {
      originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        alertTrack.appendChild(clone);
      });
      alertTrack.setAttribute('data-cloned', 'true');
    }
  }

  // Dynamic animation speed adjustment based on content length
  let currentAnimationDuration = 15; // default fallback

  function updateAnimationSpeed() {
    // Calculate total width of ONE set of items (half the scrollWidth because we duplicated)
    const contentWidth = alertTrack.scrollWidth / 2;

    // Desired speed: pixels per second. Higher is faster.
    // 100px/s for a brisker scroll speed.
    const speed = 100;

    const duration = contentWidth / speed;
    currentAnimationDuration = Math.max(duration, 15); // Ensure at least 15s for short content

    alertTrack.style.animationDuration = `${currentAnimationDuration}s`;
  }

  // Initialize speed calculation
  updateAnimationSpeed();
  window.addEventListener('resize', updateAnimationSpeed);

  let isPaused = false;
  let animationOffset = 0;
  const alertItems = alertTrack.querySelectorAll('.alert-item');

  // Calculate step size based on first item
  function getStepSize() {
    if (alertItems.length === 0) return 400;
    const firstItem = alertItems[0];
    const itemWidth = firstItem.offsetWidth;
    const gap = 40; // Matched to CSS gap
    return itemWidth + gap;
  }

  // Get current animation transform value
  function getCurrentTransform() {
    const style = window.getComputedStyle(alertTrack);
    const matrix = style.transform || style.webkitTransform;
    if (matrix && matrix !== 'none') {
      const values = matrix.split('(')[1].split(')')[0].split(',');
      return parseFloat(values[4] || 0);
    }
    return 0;
  }

  // Pause/Play functionality
  const newPauseBtn = pauseBtn.cloneNode(true);
  pauseBtn.parentNode.replaceChild(newPauseBtn, pauseBtn);
  const newPauseIcon = newPauseBtn.querySelector('i');

  // Set initial accessible label
  newPauseBtn.setAttribute('aria-label', 'Pause Alerts');

  function pauseAnimation() {
    if (!isPaused) {
      const currentPos = getCurrentTransform();
      animationOffset = currentPos;
      alertTrack.classList.add('paused');
      alertTrack.style.animationPlayState = 'paused';
      alertTrack.style.transform = `translateX(${animationOffset}px)`;
      newPauseIcon.classList.remove('fa-pause');
      newPauseIcon.classList.add('fa-play');
      newPauseBtn.setAttribute('aria-label', 'Play Alerts'); // Update label
      isPaused = true;
    }
  }

  function resumeAnimation() {
    if (isPaused) {
      // Reset to continue animation from current position
      animationOffset = 0;
      alertTrack.classList.remove('paused');
      alertTrack.style.animationPlayState = 'running';
      alertTrack.style.transform = '';
      newPauseIcon.classList.remove('fa-play');
      newPauseIcon.classList.add('fa-pause');
      newPauseBtn.setAttribute('aria-label', 'Pause Alerts'); // Update label
      isPaused = false;
    }
  }

  newPauseBtn.addEventListener('click', () => {
    if (isPaused) {
      resumeAnimation();
    } else {
      pauseAnimation();
    }
  });

  // Navigation functionality - scrolls content left/right
  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);

  // Set accessible labels
  newPrevBtn.setAttribute('aria-label', 'Previous Alert');
  newNextBtn.setAttribute('aria-label', 'Next Alert');

  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

  function scrollContent(direction) {
    const step = getStepSize();
    const trackWidth = alertTrack.scrollWidth / 2;

    // Get current visual position from the running animation
    const currentPos = getCurrentTransform();

    // Calculate what percentage through the animation we are
    // The animation goes from 0 to -trackWidth (translateX(-50%))
    const currentProgress = Math.abs(currentPos) / trackWidth;

    // Shift by one item
    const shiftAmount = step / trackWidth;
    let newProgress;
    if (direction === 'left') {
      newProgress = currentProgress - shiftAmount;
    } else {
      newProgress = currentProgress + shiftAmount;
    }

    // Keep within 0-1 range
    if (newProgress < 0) newProgress += 1;
    if (newProgress > 1) newProgress -= 1;

    // Convert progress to animation-delay to "seek" the animation
    const newDelay = -(newProgress * currentAnimationDuration);

    // Restart the animation from the new position
    alertTrack.style.animation = 'none';
    alertTrack.offsetHeight; // Force reflow
    alertTrack.style.animation = '';
    alertTrack.style.animationDuration = `${currentAnimationDuration}s`;
    alertTrack.style.animationDelay = `${newDelay}s`;

    if (isPaused) {
      alertTrack.style.animationPlayState = 'paused';
    }
  }

  newPrevBtn.addEventListener('click', () => {
    scrollContent('left');
  });

  newNextBtn.addEventListener('click', () => {
    scrollContent('right');
  });
}

// ----------------------- Count Section ---------------------------------//
// Store observer reference to prevent multiple observers
let countObserver = null;
let countAnimationRunning = false;

function initializeCountSection() {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) {
    console.log('No counters found');
    return;
  }

  // Disconnect previous observer if it exists
  if (countObserver) {
    countObserver.disconnect();
    countObserver = null;
  }

  // Reset animation flag for new page load
  countAnimationRunning = false;

  const speed = 200;

  const animateCount = () => {
    // Prevent multiple animations
    if (countAnimationRunning) {
      return;
    }
    countAnimationRunning = true;

    counters.forEach((counter) => {
      // Reset to 0 before animating
      counter.innerText = '0';
      const target = +counter.getAttribute('data-target');

      if (!target || isNaN(target)) {
        console.warn('Invalid data-target for counter:', counter, 'target:', target);
        return;
      }

      const updateCount = () => {
        const currentText = counter.innerText.replace(/,/g, '');
        const count = +currentText;
        const increment = target / speed;

        if (count < target) {
          const nextValue = Math.min(Math.ceil(count + increment), target);
          counter.innerText = nextValue.toLocaleString();
          setTimeout(updateCount, 20);
        } else {
          counter.innerText = target.toLocaleString();
        }
      };
      updateCount();
    });
  };

  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) {
    console.log('Stats section not found');
    return;
  }

  // Check if section is already visible
  const checkVisibility = () => {
    const rect = statsSection.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const isVisible = rect.top < windowHeight && rect.bottom > 0;
    return isVisible;
  };

  // Try to animate immediately if section is visible
  if (checkVisibility()) {
    setTimeout(() => {
      if (!countAnimationRunning) {
        animateCount();
      }
    }, 500);
  }

  // Set up observer for when section comes into view
  countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countAnimationRunning) {
        animateCount();
        if (countObserver) {
          countObserver.disconnect();
          countObserver = null;
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  countObserver.observe(statsSection);

  // Fallback: If observer doesn't trigger within 2 seconds and section is visible, animate anyway
  setTimeout(() => {
    if (!countAnimationRunning && checkVisibility()) {
      animateCount();
      if (countObserver) {
        countObserver.disconnect();
        countObserver = null;
      }
    }
  }, 2000);
}

// ----------------------------- Blog Section ---------------------------------//
function initializeBlogSection() {
  const track = document.getElementById("opinionCarouselTrack");
  const nextBtn = document.getElementById("blogNextBtn");
  const prevBtn = document.getElementById("blogPrevBtn");

  if (!track || !nextBtn || !prevBtn) return;

  const cards = track.querySelectorAll(".home-opinion-card");
  if (!cards.length) return;

  const cardWidth = cards[0].offsetWidth + 15 || 320;

  // Clone items for infinite scroll
  const originalCards = Array.from(cards);
  const singleSetWidth = cardWidth * originalCards.length;

  // Clone logic: duplicate content if not already done
  if (track.children.length === originalCards.length) {
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  let blogAutoScroll;
  let isBlogPaused = false;
  let isBlogManuallyPaused = false;

  const pauseBtn = document.getElementById("blogPauseBtn");

  function updateBlogAriaCurrent() {
    const currentIndex = Math.round(track.scrollLeft / cardWidth) % originalCards.length;
    originalCards.forEach((card, i) => {
      const link = card.querySelector('a');
      if (link) {
        if (i === currentIndex) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    });
  }

  // Scroll Listener for Infinite Loop
  track.addEventListener('scroll', () => {
    // If we have scrolled past the original set, snap back to start
    if (track.scrollLeft >= singleSetWidth) {
      track.style.scrollBehavior = 'auto'; // Disable smooth for instant snap
      track.scrollLeft -= singleSetWidth;
      track.style.scrollBehavior = 'smooth'; // Re-enable
    }
    updateBlogAriaCurrent();
  });

  function slideBlogNext() {
    track.scrollBy({ left: cardWidth, behavior: 'smooth' });
  }

  function slideBlogPrev() {
    // If at start (or close to it), snap to end of original set first
    if (track.scrollLeft <= 5) {
      track.style.scrollBehavior = 'auto';
      track.scrollLeft += singleSetWidth;
      track.style.scrollBehavior = 'smooth';
    }
    track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  }

  // Remove old listeners
  const newNextBtn = nextBtn.cloneNode(true);
  const newPrevBtn = prevBtn.cloneNode(true);

  // Set accessible labels
  newNextBtn.setAttribute('aria-label', 'Next Opinion');
  newPrevBtn.setAttribute('aria-label', 'Previous Opinion');

  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

  newNextBtn.addEventListener("click", () => {
    slideBlogNext();
    restartBlogAuto();
  });

  newPrevBtn.addEventListener("click", () => {
    slideBlogPrev();
    restartBlogAuto();
  });

  // Remove the old opacity logic since we have infinite scroll now
  newPrevBtn.style.opacity = "1";
  newNextBtn.style.opacity = "1";

  // Auto Scroll Functions
  function startBlogAuto() {
    blogAutoScroll = setInterval(() => {
      // Check if global accessibility pause is active
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isBlogPaused && !isBlogManuallyPaused && !globalPauseActive) {
        slideBlogNext();
      }
    }, 4000);
  }

  function stopBlogAuto() {
    if (blogAutoScroll) clearInterval(blogAutoScroll);
  }

  function restartBlogAuto() {
    stopBlogAuto();
    startBlogAuto();
  }

  // Pause on hover
  track.addEventListener('mouseenter', () => { isBlogPaused = true; });
  track.addEventListener('mouseleave', () => { if (!isBlogManuallyPaused) isBlogPaused = false; });

  newNextBtn.addEventListener('mouseenter', () => { isBlogPaused = true; });
  newNextBtn.addEventListener('mouseleave', () => { if (!isBlogManuallyPaused) isBlogPaused = false; });
  newPrevBtn.addEventListener('mouseenter', () => { isBlogPaused = true; });
  newPrevBtn.addEventListener('mouseleave', () => { if (!isBlogManuallyPaused) isBlogPaused = false; });

  if (pauseBtn) {
    pauseBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const icon = pauseBtn.querySelector('i');
      if (isBlogManuallyPaused) {
        // Resume
        isBlogManuallyPaused = false;
        isBlogPaused = false;
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        pauseBtn.setAttribute('aria-label', 'Pause Opinions Carousel');
        restartBlogAuto();
      } else {
        // Pause
        isBlogManuallyPaused = true;
        isBlogPaused = true;
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        pauseBtn.setAttribute('aria-label', 'Play Opinions Carousel');
        stopBlogAuto();
      }
    };
  }

  // Start auto scroll
  startBlogAuto();
  updateBlogAriaCurrent();
}

// ----------------------- Collaboration Carousel ----------------------- //
function initializeCollaborationCarousel() {
  const collabTrack = document.getElementById('collabTrack');
  const nextBtn = document.getElementById('collabNextBtn');
  const prevBtn = document.getElementById('collabPrevBtn');
  const collabPauseBtn = document.getElementById('collabPauseBtn');

  if (!collabTrack || !nextBtn || !prevBtn) return;

  // Use direct children (should be <a> tags wrapping the boxes) to preserve layout styles
  const originalItems = Array.from(collabTrack.children);

  if (originalItems.length === 0) return;

  const cardWidth = 365; // 350px width + 15px gap

  // Clone items for infinite scroll
  // We double the content. When we reach the start of the cloned set, we snap back to 0.
  const singleSetWidth = cardWidth * originalItems.length;

  // Check if we already cloned (in case of re-init)
  if (!collabTrack.hasAttribute('data-cloned')) {
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      collabTrack.appendChild(clone);
    });
    collabTrack.setAttribute('data-cloned', 'true');
  }

  let collabAutoSlide;
  let isCollabPaused = false;
  let isCollabManuallyPaused = false; // WCAG 2.2.2: Track user's explicit pause action

  function updateCollabAriaCurrent() {
    const currentIndex = Math.round(collabTrack.scrollLeft / cardWidth) % originalItems.length;
    originalItems.forEach((item, i) => {
      if (item.tagName === 'A') {
        if (i === currentIndex) {
          item.setAttribute('aria-current', 'page');
        } else {
          item.removeAttribute('aria-current');
        }
      } else {
        const link = item.querySelector('a');
        if (link) {
          if (i === currentIndex) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        }
      }
    });
  }

  // Scroll Listener for Infinite Loop (Forward)
  collabTrack.addEventListener('scroll', () => {
    if (collabTrack.scrollLeft >= singleSetWidth) {
      collabTrack.style.scrollBehavior = 'auto';
      collabTrack.scrollLeft -= singleSetWidth;
      collabTrack.style.scrollBehavior = 'smooth';
    }
    updateCollabAriaCurrent();
  });

  // Next Slide
  function slideCollabNext() {
    collabTrack.scrollBy({ left: cardWidth, behavior: 'smooth' });
  }

  // Prev Slide
  function slideCollabPrev() {
    if (collabTrack.scrollLeft <= 5) {
      collabTrack.style.scrollBehavior = 'auto';
      collabTrack.scrollLeft += singleSetWidth;
      collabTrack.style.scrollBehavior = 'smooth';
    }
    collabTrack.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  }

  // Remove old listeners
  const newNextBtn = nextBtn.cloneNode(true);
  const newPrevBtn = prevBtn.cloneNode(true);

  // Set accessible labels
  newNextBtn.setAttribute('aria-label', 'Next Collaboration');
  newPrevBtn.setAttribute('aria-label', 'Previous Collaboration');

  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

  // Button Controls
  newNextBtn.addEventListener('click', () => {
    slideCollabNext();
    if (!isCollabManuallyPaused) restartCollabAuto();
  });

  newPrevBtn.addEventListener('click', () => {
    slideCollabPrev();
    if (!isCollabManuallyPaused) restartCollabAuto();
  });

  // Auto Slide
  function startCollabAuto() {
    if (collabAutoSlide) clearInterval(collabAutoSlide);
    collabAutoSlide = setInterval(() => {
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isCollabPaused && !isCollabManuallyPaused && !globalPauseActive) {
        slideCollabNext();
      }
    }, 4000);
  }

  function stopCollabAuto() {
    if (collabAutoSlide) {
      clearInterval(collabAutoSlide);
      collabAutoSlide = null;
    }
  }

  function restartCollabAuto() {
    stopCollabAuto();
    startCollabAuto();
  }

  // --- WCAG 2.2.2: Pause/Play Button ---
  if (collabPauseBtn) {
    const newCollabPauseBtn = collabPauseBtn.cloneNode(true);
    collabPauseBtn.parentNode.replaceChild(newCollabPauseBtn, collabPauseBtn);

    newCollabPauseBtn.addEventListener('click', () => {
      const icon = newCollabPauseBtn.querySelector('i');
      if (isCollabManuallyPaused) {
        // Resume
        isCollabManuallyPaused = false;
        startCollabAuto();
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        newCollabPauseBtn.setAttribute('aria-label', 'Pause Collaboration Carousel');
      } else {
        // Pause
        isCollabManuallyPaused = true;
        stopCollabAuto();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        newCollabPauseBtn.setAttribute('aria-label', 'Play Collaboration Carousel');
      }
    });
  }

  // Start auto slide
  startCollabAuto();
  updateCollabAriaCurrent();

  // Pause on hover
  collabTrack.addEventListener('mouseenter', () => { isCollabPaused = true; });
  collabTrack.addEventListener('mouseleave', () => { isCollabPaused = false; });

  newNextBtn.addEventListener('mouseenter', () => { isCollabPaused = true; });
  newNextBtn.addEventListener('mouseleave', () => { isCollabPaused = false; });
  newPrevBtn.addEventListener('mouseenter', () => { isCollabPaused = true; });
  newPrevBtn.addEventListener('mouseleave', () => { isCollabPaused = false; });
}

// --------------------- What's New Section ---------------------------------------//
function initializeNewsBanner() {
  const newsTrack = document.getElementById('newsTrack');
  const toggleBtn = document.getElementById('toggleSlideBtn');

  if (!newsTrack || !toggleBtn) return;

  // Prevent double initialization
  if (newsTrack.hasAttribute('data-initialized')) return;
  newsTrack.setAttribute('data-initialized', 'true');

  // Duplicate banners for seamless scrolling (only once)
  if (!newsTrack.hasAttribute('data-cloned')) {
    const banners = newsTrack.querySelectorAll('.news-banner');
    banners.forEach(banner => {
      const clone = banner.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      newsTrack.appendChild(clone);
    });
    newsTrack.setAttribute('data-cloned', 'true');
  }

  const newsWrapper = newsTrack.closest('.news-wrapper') || newsTrack.parentElement;

  // --- State ---
  let isManuallyPaused = false;  // user clicked pause button
  let isHovered = false;         // mouse is over the section
  let scrollInterval;

  // --- Icon Helper ---
  // Remove old listener by cloning
  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
  const icon = newToggleBtn.querySelector('i');

  function updateIcon() {
    // Show play icon when paused (either manually or by hover)
    // Show pause icon when scrolling
    const effectivelyPaused = isManuallyPaused || isHovered;
    if (effectivelyPaused) {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      newToggleBtn.setAttribute('aria-label', 'Play News Updates');
    } else {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      newToggleBtn.setAttribute('aria-label', 'Pause News Updates');
    }
  }

  // --- Auto-scroll ---
  function step() {
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!isManuallyPaused && !isHovered && !globalPauseActive) {
      const halfHeight = newsTrack.scrollHeight / 2;
      newsWrapper.scrollTop += 0.8;
      if (newsWrapper.scrollTop >= halfHeight) {
        newsWrapper.scrollTop = 0;
      }
    }
    scrollInterval = requestAnimationFrame(step);
  }
  scrollInterval = requestAnimationFrame(step);

  // --- Manual Pause/Play Button ---
  newToggleBtn.addEventListener('click', () => {
    isManuallyPaused = !isManuallyPaused;
    updateIcon();
  });

  // --- Hover Pause ---
  newsWrapper.addEventListener('mouseenter', () => {
    isHovered = true;
    updateIcon();
  });
  newsWrapper.addEventListener('mouseleave', () => {
    isHovered = false;
    updateIcon();
  });

  // --- Focus Pause (keyboard accessibility) ---
  newsWrapper.addEventListener('focusin', () => {
    isHovered = true;
    updateIcon();
  });
  newsWrapper.addEventListener('focusout', () => {
    isHovered = false;
    updateIcon();
  });
}

// ============================= Media Corner ------------------------------------//
function initializeMediaCorner() {
  const mediaCornerTrack = document.getElementById("mediaTrack");
  const mediaCornerBtn = document.getElementById("toggleMediaSlideBtn");

  if (!mediaCornerTrack || !mediaCornerBtn) return;

  // Prevent double initialization
  if (mediaCornerTrack.hasAttribute('data-initialized')) return;
  mediaCornerTrack.setAttribute('data-initialized', 'true');

  // Duplicate items for seamless scrolling
  const mediaItems = mediaCornerTrack.querySelectorAll(".media-item");
  if (mediaItems.length > 0) {
    mediaItems.forEach(item => {
      const clone = item.cloneNode(true);
      mediaCornerTrack.appendChild(clone);
    });
  }

  const mediaWrapper = mediaCornerTrack.closest('.media-corner-box');

  // --- State ---
  let isManuallyPaused = false;
  let isHovered = false;
  let scrollInterval;

  // --- Icon Helper ---
  const newMediaCornerBtn = mediaCornerBtn.cloneNode(true);
  mediaCornerBtn.parentNode.replaceChild(newMediaCornerBtn, mediaCornerBtn);
  const icon = newMediaCornerBtn.querySelector("i");

  function updateIcon() {
    const effectivelyPaused = isManuallyPaused || isHovered;
    if (effectivelyPaused) {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      newMediaCornerBtn.setAttribute('aria-label', 'Play Media Corner');
    } else {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      newMediaCornerBtn.setAttribute('aria-label', 'Pause Media Corner');
    }
  }

  // --- Auto-scroll ---
  function step() {
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!isManuallyPaused && !isHovered && !globalPauseActive && mediaWrapper) {
      const halfHeight = mediaCornerTrack.scrollHeight / 2;
      mediaWrapper.scrollTop += 0.5;
      if (mediaWrapper.scrollTop >= halfHeight - 1) {
        mediaWrapper.scrollTop = 0;
      }
    }
    scrollInterval = requestAnimationFrame(step);
  }
  scrollInterval = requestAnimationFrame(step);

  // --- Manual Pause/Play Button ---
  newMediaCornerBtn.addEventListener("click", () => {
    isManuallyPaused = !isManuallyPaused;
    updateIcon();
  });

  // --- Hover Pause ---
  if (mediaWrapper) {
    mediaWrapper.addEventListener('mouseenter', () => {
      isHovered = true;
      updateIcon();
    });
    mediaWrapper.addEventListener('mouseleave', () => {
      isHovered = false;
      updateIcon();
    });
    mediaWrapper.addEventListener('focusin', () => {
      isHovered = true;
      updateIcon();
    });
    mediaWrapper.addEventListener('focusout', () => {
      isHovered = false;
      updateIcon();
    });
  }
}

// ============================= Block Section ------------------------------------//
function initializeBlockSection() {
  const blockTrack = document.getElementById("blockTrack");
  const blockBtn = document.getElementById("toggleBlockSlideBtn");

  if (!blockTrack || !blockBtn) return;

  // Prevent double initialization
  if (blockTrack.hasAttribute('data-initialized')) return;
  blockTrack.setAttribute('data-initialized', 'true');

  // Duplicate items for seamless scrolling
  const blockItems = blockTrack.querySelectorAll(".media-item");
  if (blockItems.length > 0) {
    blockItems.forEach(item => {
      const clone = item.cloneNode(true);
      blockTrack.appendChild(clone);
    });
  }

  const blockWrapper = blockTrack.closest('.media-corner-box');

  // --- State ---
  let isManuallyPaused = false;
  let isHovered = false;
  let scrollInterval;

  // --- Icon Helper ---
  const newBlockBtn = blockBtn.cloneNode(true);
  blockBtn.parentNode.replaceChild(newBlockBtn, blockBtn);
  const icon = newBlockBtn.querySelector("i");

  function updateIcon() {
    const effectivelyPaused = isManuallyPaused || isHovered;
    if (effectivelyPaused) {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      newBlockBtn.setAttribute('aria-label', 'Play Block Section');
    } else {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      newBlockBtn.setAttribute('aria-label', 'Pause Block Section');
    }
  }

  // --- Auto-scroll ---
  function step() {
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!isManuallyPaused && !isHovered && !globalPauseActive && blockWrapper) {
      const halfHeight = blockTrack.scrollHeight / 2;
      blockWrapper.scrollTop += 0.5;
      if (blockWrapper.scrollTop >= halfHeight - 1) {
        blockWrapper.scrollTop = 0;
      }
    }
    scrollInterval = requestAnimationFrame(step);
  }
  scrollInterval = requestAnimationFrame(step);

  // --- Manual Pause/Play Button ---
  newBlockBtn.addEventListener("click", () => {
    isManuallyPaused = !isManuallyPaused;
    updateIcon();
  });

  // --- Hover Pause ---
  if (blockWrapper) {
    blockWrapper.addEventListener('mouseenter', () => {
      isHovered = true;
      updateIcon();
    });
    blockWrapper.addEventListener('mouseleave', () => {
      isHovered = false;
      updateIcon();
    });
    blockWrapper.addEventListener('focusin', () => {
      isHovered = true;
      updateIcon();
    });
    blockWrapper.addEventListener('focusout', () => {
      isHovered = false;
      updateIcon();
    });
  }
}

// ============================= Newsletters Section ------------------------------------//
function initializeNewsletters() {
  const newslettersTrack = document.getElementById("newslettersTrack");
  const newslettersBtn = document.getElementById("toggleNewslettersSlideBtn");

  if (!newslettersTrack || !newslettersBtn) return;

  // Prevent double initialization
  if (newslettersTrack.hasAttribute('data-initialized')) return;
  newslettersTrack.setAttribute('data-initialized', 'true');

  // Duplicate items for seamless scrolling
  const newslettersItems = newslettersTrack.querySelectorAll(".newsletters-item");
  if (newslettersItems.length > 0) {
    newslettersItems.forEach(item => {
      const clone = item.cloneNode(true);
      newslettersTrack.appendChild(clone);
    });
  }

  const newslettersWrapper = newslettersTrack.closest('.newsletters-box');

  // --- State ---
  let isManuallyPaused = false;
  let isHovered = false;
  let scrollInterval;

  // --- Icon Helper ---
  const newNewslettersBtn = newslettersBtn.cloneNode(true);
  newslettersBtn.parentNode.replaceChild(newNewslettersBtn, newslettersBtn);
  const icon = newNewslettersBtn.querySelector("i");

  function updateIcon() {
    const effectivelyPaused = isManuallyPaused || isHovered;
    if (effectivelyPaused) {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
      newNewslettersBtn.setAttribute('aria-label', 'Play Newsletters');
    } else {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
      newNewslettersBtn.setAttribute('aria-label', 'Pause Newsletters');
    }
  }

  // --- Auto-scroll ---
  function step() {
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!isManuallyPaused && !isHovered && !globalPauseActive && newslettersWrapper) {
      const halfHeight = newslettersTrack.scrollHeight / 2;
      newslettersWrapper.scrollTop += 0.5;
      if (newslettersWrapper.scrollTop >= halfHeight - 1) {
        newslettersWrapper.scrollTop = 0;
      }
    }
    scrollInterval = requestAnimationFrame(step);
  }
  scrollInterval = requestAnimationFrame(step);

  // --- Manual Pause/Play Button ---
  newNewslettersBtn.addEventListener("click", () => {
    isManuallyPaused = !isManuallyPaused;
    updateIcon();
  });

  // --- Hover Pause ---
  if (newslettersWrapper) {
    newslettersWrapper.addEventListener('mouseenter', () => {
      isHovered = true;
      updateIcon();
    });
    newslettersWrapper.addEventListener('mouseleave', () => {
      isHovered = false;
      updateIcon();
    });
    newslettersWrapper.addEventListener('focusin', () => {
      isHovered = true;
      updateIcon();
    });
    newslettersWrapper.addEventListener('focusout', () => {
      isHovered = false;
      updateIcon();
    });
  }
}
// ---------------------------- Photo Carousel Section ----------------------------------//
function initializePhotoCarousel() {
  const photoCarousel = document.getElementById('photoCarousel');
  const photoNext = document.querySelector('.photo-next');
  const photoPrev = document.querySelector('.photo-prev');

  if (!photoCarousel || !photoNext || !photoPrev) {
    console.log('Photo carousel elements not found');
    return;
  }

  const photoCards = photoCarousel.querySelectorAll('.youtube-card');
  if (photoCards.length === 0) {
    console.log('No photo cards found');
    return;
  }

  let photoIndex = 0;
  let photoAutoSlide;
  let isTransitioning = false;

  // Initialize carousel position
  photoCarousel.style.transform = 'translateX(0%)';

  // Show slide
  function showPhotoSlide(index) {
    if (isTransitioning) return;
    if (index < 0 || index >= photoCards.length) return;

    isTransitioning = true;
    photoIndex = index;

    // Ensure all cards are visible during transition
    photoCards.forEach((card, i) => {
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.display = 'flex';

      // Set aria-current on the link inside the card if it's the active slide
      const link = card.querySelector('a');
      if (link) {
        if (i === index) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      }

      const img = card.querySelector('img');
      if (img) {
        img.style.opacity = '1';
        img.style.visibility = 'visible';
      }
    });

    // Apply transform
    photoCarousel.style.transform = `translateX(-${index * 100}%)`;

    setTimeout(() => {
      photoCards.forEach((card, i) => {
        if (i !== index) {
          card.style.visibility = 'hidden';
        }
      });
      isTransitioning = false;
    }, 600);
  }

  // Next slide
  function slideNext() {
    if (isTransitioning) return;
    const nextIndex = (photoIndex + 1) % photoCards.length;
    showPhotoSlide(nextIndex);
    if (!photoIsPaused) restartAutoSlide();
  }

  // Previous slide
  function slidePrev() {
    if (isTransitioning) return;
    const prevIndex = (photoIndex - 1 + photoCards.length) % photoCards.length;
    showPhotoSlide(prevIndex);
    if (!photoIsPaused) restartAutoSlide();
  }

  // Remove old listeners
  const newPhotoNext = photoNext.cloneNode(true);
  const newPhotoPrev = photoPrev.cloneNode(true);

  // accessibility
  newPhotoNext.setAttribute('aria-label', 'Next Photo');
  newPhotoPrev.setAttribute('aria-label', 'Previous Photo');

  photoNext.parentNode.replaceChild(newPhotoNext, photoNext);
  photoPrev.parentNode.replaceChild(newPhotoPrev, photoPrev);

  newPhotoNext.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    slideNext();
  });

  newPhotoPrev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    slidePrev();
  });

  // Pause button
  let photoIsPaused = false;
  const photoPauseBtn = document.getElementById('photoPauseBtn');
  if (photoPauseBtn) {
    photoPauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const icon = photoPauseBtn.querySelector('i');
      if (photoIsPaused) {
        photoIsPaused = false;
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        startAutoSlide();
      } else {
        photoIsPaused = true;
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        stopAutoSlide();
      }
    });
  }

  // Auto slide functionality
  function startAutoSlide() {
    if (photoAutoSlide) {
      clearInterval(photoAutoSlide);
    }
    if (photoIsPaused) return;

    photoAutoSlide = setInterval(() => {
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isTransitioning && !globalPauseActive && !photoIsPaused) {
        slideNext();
      }
    }, 5000);
  }

  function stopAutoSlide() {
    if (photoAutoSlide) {
      clearInterval(photoAutoSlide);
      photoAutoSlide = null;
    }
  }

  function restartAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  // Pause auto slide on hover
  const photoSection = photoCarousel.closest('.youtube-section');
  if (photoSection) {
    photoSection.addEventListener('mouseenter', stopAutoSlide);
    photoSection.addEventListener('mouseleave', startAutoSlide);
  }

  // Initialize first slide
  showPhotoSlide(0);

  // Start auto slide after a delay
  setTimeout(() => {
    startAutoSlide();
  }, 1000);
}


// ---------------------------- Social Media Section ----------------------------------//
function initializeYouTubeCarousel() {
  const ytCarousel = document.getElementById('youtubeCarousel');
  const ytNext = document.querySelector('.youtube-next');
  const ytPrev = document.querySelector('.youtube-prev');

  if (!ytCarousel || !ytNext || !ytPrev) {
    console.log('YouTube carousel elements not found');
    return;
  }

  const ytCards = ytCarousel.querySelectorAll('.youtube-card');
  if (ytCards.length === 0) {
    console.log('No video cards found');
    return;
  }

  let ytIndex = 0;
  let ytAutoSlide;
  let isTransitioning = false;

  // Initialize carousel position
  ytCarousel.style.transform = 'translateX(0%)';

  // Stop all videos and iframes
  function stopAllMedia() {
    ytCards.forEach(card => {
      const video = card.querySelector('video');
      const iframe = card.querySelector('iframe');

      if (video) {
        video.pause();
        video.currentTime = 0;
      }

      if (iframe) {
        const src = iframe.src;
        iframe.src = src;
      }
    });
  }

  // Show slide
  function showYouTubeSlide(index) {
    if (isTransitioning) return;
    if (index < 0 || index >= ytCards.length) return;

    isTransitioning = true;
    ytIndex = index;

    // Ensure all cards are visible during transition
    ytCards.forEach((card, i) => {
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.display = 'flex';

      // Set aria-current on the active slide
      if (i === index) {
        card.setAttribute('aria-current', 'page');
      } else {
        card.removeAttribute('aria-current');
      }

      const video = card.querySelector('video');
      if (video) {
        video.style.opacity = '1';
        video.style.visibility = 'visible';
      }
    });

    // Apply transform
    ytCarousel.style.transform = `translateX(-${index * 100}%)`;

    // Stop media only for non-active slides after transition
    setTimeout(() => {
      ytCards.forEach((card, i) => {
        if (i !== index) {
          card.style.visibility = 'hidden';
          const video = card.querySelector('video');
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
      isTransitioning = false;
    }, 600);
  }

  // Next slide
  function slideNext() {
    if (isTransitioning) return;
    const nextIndex = (ytIndex + 1) % ytCards.length;
    showYouTubeSlide(nextIndex);
    if (!ytIsPaused) restartAutoSlide();
  }

  // Previous slide
  function slidePrev() {
    if (isTransitioning) return;
    const prevIndex = (ytIndex - 1 + ytCards.length) % ytCards.length;
    showYouTubeSlide(prevIndex);
    if (!ytIsPaused) restartAutoSlide();
  }

  // Remove old listeners
  const newYtNext = ytNext.cloneNode(true);
  const newYtPrev = ytPrev.cloneNode(true);

  // accessibility
  newYtNext.setAttribute('aria-label', 'Next Video');
  newYtPrev.setAttribute('aria-label', 'Previous Video');

  ytNext.parentNode.replaceChild(newYtNext, ytNext);
  ytPrev.parentNode.replaceChild(newYtPrev, ytPrev);

  newYtNext.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    slideNext();
  });

  newYtPrev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    slidePrev();
  });

  // Pause button
  let ytIsPaused = false;
  const ytPauseBtn = document.getElementById('youtubePauseBtn');
  if (ytPauseBtn) {
    ytPauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const icon = ytPauseBtn.querySelector('i');
      if (ytIsPaused) {
        ytIsPaused = false;
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        startAutoSlide();
      } else {
        ytIsPaused = true;
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        stopAutoSlide();
      }
    });
  }

  // Auto slide functionality
  function startAutoSlide() {
    if (ytAutoSlide) {
      clearInterval(ytAutoSlide);
    }
    if (ytIsPaused) return;

    ytAutoSlide = setInterval(() => {
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isTransitioning && !globalPauseActive && !ytIsPaused) {
        slideNext();
      }
    }, 5000);
  }

  function stopAutoSlide() {
    if (ytAutoSlide) {
      clearInterval(ytAutoSlide);
      ytAutoSlide = null;
    }
  }

  function restartAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  // Pause auto slide on hover
  const ytSection = ytCarousel.closest('.youtube-section');
  if (ytSection) {
    ytSection.addEventListener('mouseenter', stopAutoSlide);
    ytSection.addEventListener('mouseleave', startAutoSlide);
  }

  // Initialize first slide
  showYouTubeSlide(0);

  // Start auto slide after a delay
  setTimeout(() => {
    startAutoSlide();
  }, 1000);
}

function initializeSocialCarousel() {
  const socialCarousel = document.getElementById('socialCarousel');
  const socialNext = document.querySelector('.social-next');
  const socialPrev = document.querySelector('.social-prev');

  if (!socialCarousel || !socialNext || !socialPrev) return;

  function setupCarousel() {
    const slideStep = () => socialCarousel.querySelector('div')?.offsetWidth + 25 || 300;

    function slide(dir) {
      socialCarousel.scrollBy({ left: dir * slideStep(), behavior: 'smooth' });
    }

    // Remove old listeners
    const newSocialNext = socialNext.cloneNode(true);
    const newSocialPrev = socialPrev.cloneNode(true);

    // accessibility
    newSocialNext.setAttribute('aria-label', 'Next Social Post');
    newSocialPrev.setAttribute('aria-label', 'Previous Social Post');

    socialNext.parentNode.replaceChild(newSocialNext, socialNext);
    socialPrev.parentNode.replaceChild(newSocialPrev, socialPrev);

    newSocialNext.addEventListener('click', () => slide(1));
    newSocialPrev.addEventListener('click', () => slide(-1));

    function updateSocialAriaCurrent() {
      const step = slideStep();
      const currentIndex = Math.round(socialCarousel.scrollLeft / step);
      const socialItems = socialCarousel.querySelectorAll('div > div'); // Adjust based on structure
      socialItems.forEach((item, i) => {
        const link = item.querySelector('a');
        if (link) {
          if (i === currentIndex) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        }
      });
    }

    socialCarousel.addEventListener('scroll', updateSocialAriaCurrent);

    let autoSlide = setInterval(() => slide(1), 6000);
    socialCarousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
    socialCarousel.addEventListener('mouseleave', () => {
      autoSlide = setInterval(() => slide(1), 6000);
    });

    updateSocialAriaCurrent();
  }

  setupCarousel();
}

// ----------------------------- Infocus Section --------------------------------------//
function initializeInfocusSection() {
  const infocusContainer = document.querySelector('.infocus-container');
  if (!infocusContainer) {
    // Try again after a short delay if element not found
    setTimeout(() => {
      const retryContainer = document.querySelector('.infocus-container');
      if (retryContainer) {
        setupInfocusObserver(retryContainer);
      }
    }, 300);
    return;
  }

  setupInfocusObserver(infocusContainer);
  addMapIslands(infocusContainer);
}

function setupInfocusObserver(container) {
  // Make IN FOCUS appear directly without waiting for scroll
  const content = container.querySelector('.infocus-content');
  container.classList.add('animate-in');
  if (content) {
    content.classList.add('animate-in');
  }
}

function addMapIslands(container) {
  return;
  if (!container) return;

  // Find the map image to ensure we overlay correctly
  const img = container.querySelector('img');
  if (!img) return;

  // Use the image's parent for positioning to ensure dots stay with the map
  const parent = img.parentElement;

  // Check if islands already added
  if (parent.querySelector('.map-islands-container')) return;

  if (window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const islandContainer = document.createElement('div');
  islandContainer.className = 'map-islands-container';
  islandContainer.style.position = 'absolute';
  islandContainer.style.top = '0';
  islandContainer.style.left = '0';
  islandContainer.style.width = '100%';
  islandContainer.style.height = '100%';
  islandContainer.style.pointerEvents = 'none';
  islandContainer.style.zIndex = '1';

  // DEBUG: Click to get coordinates
  // Remove this in production or leave enabled for admin/dev
  islandContainer.style.pointerEvents = 'auto'; // Enable events key for debugging
  islandContainer.addEventListener('click', (e) => {
    const rect = islandContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const leftPercent = (x / rect.width) * 100;
    const topPercent = (y / rect.height) * 100;
    console.log(`{ top: ${topPercent.toFixed(1)}, left: ${leftPercent.toFixed(1)}, size: 3, delay: '0s' },`);
    alert(`Coordinates copied to console:\nTop: ${topPercent.toFixed(1)}%\nLeft: ${leftPercent.toFixed(1)}%`);
  });

  // Alignment Adjustments (Modify these to shift the entire set)
  const xOffset = 0;
  const yOffset = 0;
  const scale = 1.0;

  // Coordinate percentages (Approximate for standard India map)
  const stateDots = [
    // North
    { top: 18, left: 32, size: 3, delay: '0s' },    // J&K
    { top: 15, left: 40, size: 3, delay: '0.2s' },  // Ladakh
    { top: 24, left: 35, size: 3, delay: '0.1s' },  // Himachal
    { top: 26, left: 29, size: 3, delay: '0.3s' },  // Punjab
    { top: 27, left: 40, size: 3, delay: '0.2s' },  // Uttarakhand
    { top: 31, left: 33, size: 2.5, delay: '0.4s' },// Haryana
    { top: 33, left: 36, size: 2.5, delay: '0.1s' },// Delhi

    // West
    { top: 40, left: 25, size: 4, delay: '0s' },    // Rajasthan
    { top: 50, left: 15, size: 4, delay: '0.3s' },  // Gujarat
    { top: 62, left: 28, size: 4, delay: '0.1s' },  // Maharashtra
    { top: 75, left: 25, size: 2, delay: '0.2s' },  // Goa

    // Central
    { top: 50, left: 42, size: 4, delay: '0.4s' },  // MP
    { top: 38, left: 50, size: 4, delay: '0.2s' },  // UP
    { top: 52, left: 55, size: 3.5, delay: '0.1s' },// Chhattisgarh

    // East
    { top: 40, left: 65, size: 3.5, delay: '0.3s' },// Bihar
    { top: 48, left: 62, size: 3.5, delay: '0s' },  // Jharkhand
    { top: 48, left: 70, size: 3.5, delay: '0.2s' },// West Bengal
    { top: 58, left: 65, size: 3.5, delay: '0.1s' },// Odisha
    { top: 32, left: 72, size: 2, delay: '0.4s' },  // Sikkim

    // North East
    { top: 38, left: 85, size: 3, delay: '0.2s' },  // Assam
    { top: 30, left: 90, size: 3, delay: '0.1s' },  // Arunachal
    { top: 36, left: 94, size: 3, delay: '0.3s' },  // Nagaland
    { top: 42, left: 93, size: 3, delay: '0s' },    // Manipur
    { top: 48, left: 91, size: 3, delay: '0.4s' },  // Mizoram
    { top: 48, left: 86, size: 3, delay: '0.2s' },  // Tripura
    { top: 40, left: 85, size: 3, delay: '0.1s' },  // Meghalaya

    // South
    { top: 78, left: 32, size: 4, delay: '0.3s' },  // Karnataka
    { top: 65, left: 45, size: 3.5, delay: '0s' },  // Telangana
    { top: 75, left: 48, size: 4, delay: '0.2s' },  // Andhra
    { top: 88, left: 35, size: 3, delay: '0.1s' },  // Kerala
    { top: 85, left: 42, size: 3.5, delay: '0.4s' },// Tamil Nadu

    // Islands (Lakshadweep)
    { top: 82, left: 18, size: 3, delay: '0s' },
    { top: 84, left: 19, size: 2.5, delay: '0.2s' },
    { top: 83, left: 17, size: 3, delay: '0.4s' },
    { top: 85, left: 18, size: 2, delay: '0.1s' },
    { top: 86, left: 17, size: 2, delay: '0.3s' },
    { top: 81, left: 18, size: 2, delay: '0.5s' },
    { top: 79, left: 17, size: 1.5, delay: '0.2s' },

    // Islands (Andaman & Nicobar)
    { top: 65, left: 88, size: 3, delay: '0s' },
    { top: 66, left: 88, size: 3, delay: '0.3s' },
    { top: 67, left: 88, size: 3.5, delay: '0.1s' },
    { top: 69, left: 88, size: 3, delay: '0.4s' },
    { top: 70, left: 88, size: 3, delay: '0.2s' },
    { top: 72, left: 88, size: 3.5, delay: '0.5s' },
    { top: 76, left: 89, size: 3, delay: '0.1s' },
    { top: 78, left: 90, size: 2.5, delay: '0.3s' },
    { top: 79, left: 90, size: 3, delay: '0.2s' },
    { top: 81, left: 90, size: 4, delay: '0.4s' },
  ];

  const mapColor = '#ff9933'; // Theme Orange

  const createDot = (dot) => {
    const el = document.createElement('div');
    el.className = 'map-dot';
    el.style.position = 'absolute';

    // Apply scaling relative to center (50, 50) roughly, or just simple offset
    // Simple offset logic:
    const finalTop = (dot.top * scale) + yOffset;
    const finalLeft = (dot.left * scale) + xOffset;

    el.style.top = finalTop + '%';
    el.style.left = finalLeft + '%';
    el.style.width = (dot.size * scale) + 'px';
    el.style.height = (dot.size * scale) + 'px';

    // Fallback color
    if (!el.classList.contains('map-dot') || window.getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)') {
      el.style.backgroundColor = mapColor;
    }
    el.style.animationDelay = dot.delay;
    return el;
  };

  stateDots.forEach(dot => islandContainer.appendChild(createDot(dot)));

  parent.appendChild(islandContainer);
}

// --------------------------- Home Events Section (No Calendar) -------------------------------------//
// Events are now in static HTML, so we just need to attach click handlers and initialize carousel

function initializeHomeEvents() {
  // Event cards navigate directly to node pages via their <a> links.
  // No modal logic needed — just initialize the carousel.
  initEventsCarousel();
}

// Events Carousel Functionality
let eventsCarouselInterval = null;
let isEventsCarouselPaused = false;
let isEventsManuallyPaused = false; // WCAG 2.2.2 compliance
let isUserScrolling = false;
let carouselHandlersAttached = false;

function initEventsCarousel() {
  const eventsCardsList = document.getElementById('homeEventsCardsList');
  if (!eventsCardsList) return;

  // Clear any existing interval or animation frame
  if (eventsCarouselInterval) {
    if (typeof eventsCarouselInterval === 'number') {
      cancelAnimationFrame(eventsCarouselInterval);
    } else {
      clearInterval(eventsCarouselInterval);
    }
    eventsCarouselInterval = null;
  }

  // Reset scroll position
  eventsCardsList.scrollLeft = 0;

  // Attach handlers only once
  if (!carouselHandlersAttached) {
    attachCarouselHandlers(eventsCardsList);
    carouselHandlersAttached = true;
  }

  // Start auto-scroll
  startAutoScroll(eventsCardsList);
}

function attachCarouselHandlers(cardsList) {
  const prevBtn = document.getElementById('eventsPrevBtn');
  const nextBtn = document.getElementById('eventsNextBtn');
  const pauseBtn = document.getElementById('eventsPauseBtn');

  // Pause on hover
  cardsList.addEventListener('mouseenter', () => {
    isEventsCarouselPaused = true;
  });

  cardsList.addEventListener('mouseleave', () => {
    if (!isEventsManuallyPaused) isEventsCarouselPaused = false;
  });

  // Track user scrolling
  let scrollTimeout;
  cardsList.addEventListener('scroll', () => {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
    }, 1500);
  });

  // Manual navigation - Previous button
  if (prevBtn) {
    prevBtn.setAttribute('aria-label', 'Previous Events');
    prevBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      isEventsCarouselPaused = true;

      const firstCard = cardsList.querySelector('.home-event-card');
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 28;
      const scrollAmount = cardWidth + gap;

      cardsList.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (!isEventsManuallyPaused) isEventsCarouselPaused = false;
      }, 1000);
    };
  }

  // Manual navigation - Next button
  if (nextBtn) {
    nextBtn.setAttribute('aria-label', 'Next Events');
    nextBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      isEventsCarouselPaused = true;

      const firstCard = cardsList.querySelector('.home-event-card');
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 28;
      const scrollAmount = cardWidth + gap;

      cardsList.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (!isEventsManuallyPaused) isEventsCarouselPaused = false;
      }, 1000);
    };
  }

  // --- WCAG 2.2.2: Pause/Play Button ---
  if (pauseBtn) {
    pauseBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      const icon = pauseBtn.querySelector('i');
      if (isEventsManuallyPaused) {
        // Resume
        isEventsManuallyPaused = false;
        isEventsCarouselPaused = false;
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        pauseBtn.setAttribute('aria-label', 'Pause events carousel');
      } else {
        // Pause
        isEventsManuallyPaused = true;
        isEventsCarouselPaused = true;
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        pauseBtn.setAttribute('aria-label', 'Play events carousel');
      }
    };
  }
}

function startAutoScroll(cardsList) {
  // Ensure cards are duplicated for infinite scroll
  const cards = cardsList.querySelectorAll('.home-event-card');
  if (cards.length > 0 && !cardsList.hasAttribute('data-cloned')) {
    // Duplicate cards if not already duplicated
    const firstCard = cards[0];
    const cardWidth = firstCard.offsetWidth;
    const gap = 28;
    const totalWidth = (cardWidth + gap) * cards.length;

    if (cardsList.scrollWidth < totalWidth * 1.5) {
      cards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.add('cloned');
        cardsList.appendChild(clone);
      });
      cardsList.setAttribute('data-cloned', 'true');
    }
  }

  function autoScroll() {
    // Check if global accessibility pause is active
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';

    if (isEventsCarouselPaused || isUserScrolling || globalPauseActive || isEventsManuallyPaused) {
      eventsCarouselInterval = requestAnimationFrame(autoScroll);
      return;
    }

    const firstCard = cardsList.querySelector('.home-event-card');
    if (!firstCard) {
      eventsCarouselInterval = requestAnimationFrame(autoScroll);
      return;
    }

    const maxScroll = cardsList.scrollWidth - cardsList.clientWidth;
    const halfPoint = maxScroll / 2;
    const scrollSpeed = 1; // pixels per frame for smooth movement

    // Check if we've reached the end (accounting for duplicated cards)
    if (cardsList.scrollLeft >= halfPoint - 10) {
      // Seamlessly reset to beginning for infinite loop
      cardsList.scrollLeft = 0;
    } else {
      // Smooth continuous scroll
      cardsList.scrollLeft += scrollSpeed;
    }

    // Update aria-current on active event link
    const eventCards = cardsList.querySelectorAll('.home-event-card:not(.cloned)');
    const cardWidth = firstCard.offsetWidth + 28;

    // Only calculate index if we have cards
    if (eventCards.length > 0) {
      const currentIndex = Math.floor((cardsList.scrollLeft + cardWidth / 2) / cardWidth) % eventCards.length;

      eventCards.forEach((card, i) => {
        const link = card.closest('a') || card.querySelector('a');
        if (link) {
          if (i === currentIndex) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        }
      });
    }

    // Continue the animation loop
    eventsCarouselInterval = requestAnimationFrame(autoScroll);
  }

  // Clear any existing animation
  if (eventsCarouselInterval) {
    if (typeof eventsCarouselInterval === 'number') {
      cancelAnimationFrame(eventsCarouselInterval);
    } else {
      clearInterval(eventsCarouselInterval);
    }
  }

  // Start the animation loop after a small delay to ensure DOM is ready
  setTimeout(() => {
    eventsCarouselInterval = requestAnimationFrame(autoScroll);
  }, 100);
}



//----------------------------------- Partner Section -------------------------------//
function initializePartnerSlider() {
  const partnerSlider = document.getElementById('partnersSlider');
  const partnerNext = document.getElementById('partnerNext');
  const partnerPrev = document.getElementById('partnerPrev');

  if (!partnerSlider || !partnerNext || !partnerPrev) return;

  // Create a track div to contain all items if it doesn't exist
  let track = partnerSlider.querySelector('.partners-track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'partners-track';
    // Move all current children into the track
    while (partnerSlider.firstChild) {
      track.appendChild(partnerSlider.firstChild);
    }
    partnerSlider.appendChild(track);
  }

  const partnerCards = track.querySelectorAll('.partner-card');
  if (!partnerCards.length) return;

  // Duplicate items for seamless continuous scrolling
  if (!track.hasAttribute('data-cloned')) {
    const originalCards = Array.from(partnerCards);
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.setAttribute('data-cloned', 'true');
  }

  // Dynamic animation speed adjustment
  let currentAnimationDuration = 40; // fallback

  function updateAnimationSpeed() {
    // Calculate total width of ONE set of items (half the scrollWidth because we duplicated)
    const contentWidth = track.scrollWidth / 2;

    // Desired speed: pixels per second. 
    // 120px/s provides a much more brisk and noticeable movement.
    const speed = 120;

    currentAnimationDuration = contentWidth / speed;
    track.style.setProperty('--duration', `${currentAnimationDuration}s`);
    track.classList.add('marquee');
  }

  // Initialize speed calculation
  updateAnimationSpeed();
  window.addEventListener('resize', updateAnimationSpeed);

  // Pause on hover logic moved below where isPartnerPaused is defined

  // Manual navigation - shifts animation delay to "seek"
  function getStepSize() {
    const firstCard = track.querySelector('.partner-card');
    const width = (firstCard && firstCard.offsetWidth) || 150;
    const gap = 24; // matches CSS gap
    return width + gap;
  }

  // Get current animation transform value
  function getCurrentTransform() {
    const style = window.getComputedStyle(track);
    const matrix = style.transform || style.webkitTransform;
    if (matrix && matrix !== 'none') {
      const values = matrix.split('(')[1].split(')')[0].split(',');
      return parseFloat(values[4] || 0);
    }
    return 0;
  }

  function scrollMarquee(direction) {
    const step = getStepSize();
    const trackWidth = track.scrollWidth / 2;

    // Get current visual position from the running animation
    const currentPos = getCurrentTransform();

    // Calculate progress percentage (0 to 1)
    const currentProgress = Math.abs(currentPos) / trackWidth;

    const shiftAmount = step / trackWidth;
    let newProgress;

    if (direction === 'left') {
      newProgress = currentProgress - shiftAmount;
    } else {
      newProgress = currentProgress + shiftAmount;
    }

    // Keep within 0-1 range
    if (newProgress < 0) newProgress += 1;
    if (newProgress > 1) newProgress -= 1;

    // Convert progress to negative animation-delay to "seek"
    const newDelay = -(newProgress * currentAnimationDuration);

    // Restart animation from new position
    track.style.animation = 'none';
    track.offsetHeight; // Force reflow
    track.style.animation = '';
    track.style.animationDelay = `${newDelay}s`;
  }

  if (!partnerSlider || !partnerPrev || !partnerNext) return; // Pause button might be missing in some views

  const partnerTrack = partnerSlider.querySelector('.partners-track') || partnerSlider; // Rename local variable to avoid conflict

  // Clone buttons to remove old listeners
  const newPartnerNext = partnerNext.cloneNode(true);
  const newPartnerPrev = partnerPrev.cloneNode(true);

  // accessibility labels for prev/next
  newPartnerNext.setAttribute('aria-label', 'Next Partner');
  newPartnerPrev.setAttribute('aria-label', 'Previous Partner');

  partnerNext.parentNode.replaceChild(newPartnerNext, partnerNext);
  partnerPrev.parentNode.replaceChild(newPartnerPrev, partnerPrev);

  // Pause Button Logic
  const partnerPause = document.getElementById('partnerPause');
  let isPartnerPaused = false;
  let newPartnerPause;

  if (partnerPause) {
    newPartnerPause = partnerPause.cloneNode(true);
    partnerPause.parentNode.replaceChild(newPartnerPause, partnerPause);

    // Initial Check for global pause
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (globalPauseActive) {
      isPartnerPaused = true;
      partnerTrack.classList.add('paused');
      const icon = newPartnerPause.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
      }
      newPartnerPause.setAttribute('aria-label', 'Play Partners');
    }

    newPartnerPause.addEventListener('click', () => {
      const icon = newPartnerPause.querySelector('i');
      if (!isPartnerPaused) {
        partnerTrack.classList.add('paused');
        if (icon) {
          icon.classList.remove('fa-pause');
          icon.classList.add('fa-play');
        }
        newPartnerPause.setAttribute('aria-label', 'Play Partners');
        isPartnerPaused = true;
      } else {
        partnerTrack.classList.remove('paused');
        if (icon) {
          icon.classList.remove('fa-play');
          icon.classList.add('fa-pause');
        }
        newPartnerPause.setAttribute('aria-label', 'Pause Partners');
        isPartnerPaused = false;
      }
    });
  }


  // Manual Navigation
  newPartnerNext.addEventListener('click', () => {
    scrollMarquee('right');
  });

  newPartnerPrev.addEventListener('click', () => {
    scrollMarquee('left');
  });

  // Pause on focus within the slider (for keyboard/screen reader users)
  partnerSlider.addEventListener('focusin', () => {
    partnerTrack.classList.add('paused');
  });

  const resumeAnimation = () => {
    // Only resume if not manually paused AND global pause is not active
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!isPartnerPaused && !globalPauseActive) {
      partnerTrack.classList.remove('paused');
    }
  };

  partnerSlider.addEventListener('focusout', resumeAnimation);
}


//----------------------------------- Social Link Accessibility Fix -------------------------------//
function initializeSocialLinkAccessibility() {
  // Target social section and footer links
  const socialLinks = document.querySelectorAll('.social-section a, .footer-modern a, .social-header-controls button');

  socialLinks.forEach(link => {
    // Check if link has text content
    const hasText = link.textContent.trim().length > 0;
    const hasLabel = link.hasAttribute('aria-label');
    const hasTitle = link.hasAttribute('title');

    if (!hasText && !hasLabel) {
      // Determine label based on href or icon class
      let label = '';
      const href = link.getAttribute('href') || '';
      const icon = link.querySelector('i, svg');
      const iconClass = icon ? icon.className : '';

      if (href.includes('twitter.com') || href.includes('x.com') || iconClass.includes('fa-twitter') || iconClass.includes('fa-x-twitter')) {
        label = 'Visit our X (Twitter) page';
      } else if (href.includes('facebook.com') || iconClass.includes('fa-facebook')) {
        label = 'Visit our Facebook page';
      } else if (href.includes('instagram.com') || iconClass.includes('fa-instagram')) {
        label = 'Visit our Instagram page';
      } else if (href.includes('linkedin.com') || iconClass.includes('fa-linkedin')) {
        label = 'Visit our LinkedIn page';
      } else if (href.includes('youtube.com') || iconClass.includes('fa-youtube')) {
        label = 'Visit our YouTube channel';
      } else if (iconClass.includes('fa-chevron-left')) {
        label = 'Previous';
      } else if (iconClass.includes('fa-chevron-right')) {
        label = 'Next';
      } else {
        // Generic fallback if we can't identify platform
        label = hasTitle ? link.getAttribute('title') : 'Social Link';
      }

      if (label) {
        link.setAttribute('aria-label', label);
      }
    }
  });

  // Specific fix for "Empty link" error in social widget headers if they are anchors
  const widgetHeaders = document.querySelectorAll('.social-embed-container .element-invisible');
  // If embedded widgets create empty iframes/links, we might need to target them specifically if accessible.
  // However, the WAVE error likely points to the 'Follow Us' buttons which might be <a> tags with background images.

  // Fix for potential "Follow Us" empty links from social widgets
  const followLinks = document.querySelectorAll('.social-embed-container a');
  followLinks.forEach(link => {
    if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', 'Follow Us');
    }
  });
}



//----------------------------------- Chairperson Modal -------------------------------//
function initializeChairpersonModal() {
  const modal = document.getElementById('chairpersonModal');
  const messageImageContainer = document.getElementById('chairpersonMessageImage');
  const closeBtn = document.getElementById('modalCloseBtn');
  const backdrop = document.getElementById('modalBackdrop');
  const modalWrapper = document.getElementById('modalContentWrapper');
  const letterDate = document.getElementById('letterDate');

  if (!modal || !messageImageContainer || !closeBtn || !backdrop || !modalWrapper) return;

  // Set current date in letter format
  if (letterDate) {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    letterDate.textContent = today.toLocaleDateString('en-US', options);
  }

  // Set date in preview letter
  const previewLetterDate = document.getElementById('previewLetterDate');
  if (previewLetterDate) {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    previewLetterDate.textContent = today.toLocaleDateString('en-US', options);
  }

  // Open modal with scroll unroll animation (top to bottom)
  function openModal() {
    // Save focus
    lastFocusedElement = document.activeElement;

    document.body.style.overflow = 'hidden';
    modal.classList.add('active');

    // Reset scroll position to top
    const letterPaper = document.querySelector('.letter-paper');
    if (letterPaper) {
      letterPaper.scrollTop = 0;
    }

    // Trigger animation after a small delay to ensure display is set
    setTimeout(() => {
      modalWrapper.style.transform = 'translateY(0)';
      modalWrapper.style.opacity = '1';

      // Set focus to the close button
      if (closeBtn) {
        closeBtn.focus();
      }
    }, 10);
  }

  // Close modal with reverse scroll animation (bottom to top)
  function closeModal() {
    modalWrapper.style.transform = 'translateY(-100%)';
    modalWrapper.style.opacity = '0';

    setTimeout(() => {
      modal.classList.remove('active');
      document.body.style.overflow = '';

      // Restore focus
      if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
      }
    }, 1200);
  }

  // Event listeners - make title clickable
  messageImageContainer.addEventListener('click', openModal);

  // Also make the title specifically clickable
  const previewTitleWrapper = document.querySelector('.preview-letter-title-wrapper');
  if (previewTitleWrapper) {
    previewTitleWrapper.style.cursor = 'pointer';
    previewTitleWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });
  }

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// --------------------- Document Pages Carousel ----------------------- //
function initializeDocumentCarousel() {
  const track = document.getElementById("documentCarouselTrack");
  const nextBtn = document.getElementById("documentNextBtn");
  const prevBtn = document.getElementById("documentPrevBtn");
  const currentPageEl = document.getElementById("currentPage");
  const totalPagesEl = document.getElementById("totalPages");

  if (!track || !nextBtn || !prevBtn) return;

  const pages = track.querySelectorAll(".document-page");
  const totalPages = pages.length;
  let currentPageIndex = 0;
  let documentAutoScroll;
  let isDocumentPaused = false;

  if (totalPagesEl) {
    totalPagesEl.textContent = totalPages;
  }

  // Remove old listeners
  const newNextBtn = nextBtn.cloneNode(true);
  const newPrevBtn = prevBtn.cloneNode(true);

  // accessibility
  newNextBtn.setAttribute('aria-label', 'Next Document Page');
  newPrevBtn.setAttribute('aria-label', 'Previous Document Page');

  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

  function updatePageIndicator() {
    if (currentPageEl) {
      currentPageEl.textContent = currentPageIndex + 1;
    }
  }

  function slideDocumentNext() {
    if (currentPageIndex < totalPages - 1) {
      currentPageIndex++;
    } else {
      currentPageIndex = 0; // Loop back to first page
    }
    const pageWidth = track.clientWidth;
    track.scrollTo({ left: currentPageIndex * pageWidth, behavior: "smooth" });
    updatePageIndicator();
    updateButtons();
  }

  function slideDocumentPrev() {
    if (currentPageIndex > 0) {
      currentPageIndex--;
    } else {
      currentPageIndex = totalPages - 1; // Loop to last page
    }
    const pageWidth = track.clientWidth;
    track.scrollTo({ left: currentPageIndex * pageWidth, behavior: "smooth" });
    updatePageIndicator();
    updateButtons();
  }

  newNextBtn.addEventListener("click", () => {
    slideDocumentNext();
    restartDocumentAuto();
  });

  newPrevBtn.addEventListener("click", () => {
    slideDocumentPrev();
    restartDocumentAuto();
  });

  function updateButtons() {
    // Buttons are always enabled for looping carousel
    newPrevBtn.style.opacity = "1";
    newNextBtn.style.opacity = "1";
  }

  // Auto Scroll Functions
  function startDocumentAuto() {
    documentAutoScroll = setInterval(() => {
      if (!isDocumentPaused) {
        slideDocumentNext();
      }
    }, 6000);
  }

  function stopDocumentAuto() {
    clearInterval(documentAutoScroll);
  }

  function restartDocumentAuto() {
    stopDocumentAuto();
    startDocumentAuto();
  }

  // Pause on hover
  track.addEventListener('mouseenter', () => {
    isDocumentPaused = true;
  });

  track.addEventListener('mouseleave', () => {
    isDocumentPaused = false;
  });

  // Update page index on scroll
  track.addEventListener("scroll", () => {
    const pageWidth = track.clientWidth;
    const scrollLeft = track.scrollLeft;
    const newIndex = Math.round(scrollLeft / pageWidth);
    if (newIndex !== currentPageIndex && newIndex >= 0 && newIndex < totalPages) {
      currentPageIndex = newIndex;
      updatePageIndicator();
      updateButtons();
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    const pageWidth = track.clientWidth;
    track.scrollTo({ left: currentPageIndex * pageWidth, behavior: "smooth" });
  });

  updateButtons();
  updatePageIndicator();

  // Start auto scroll
  startDocumentAuto();
}
// ----------------------- Testimonials Carousel ----------------------- //
function initializeTestimonialsCarousel() {
  const container = document.getElementById('videoTestimonials');
  if (!container) {
    // Retry once if not immediately available
    setTimeout(() => {
      const retryContainer = document.getElementById('videoTestimonials');
      if (retryContainer) initializeTestimonialsCarousel();
    }, 500);
    return;
  }

  const videos = container.querySelectorAll('.testimonial-video');
  const nextBtn = document.getElementById('testiNextBtn');
  const prevBtn = document.getElementById('testiPrevBtn');
  const pauseBtn = document.getElementById('testiPauseBtn');

  if (!videos.length) return;

  let currentIndex = 0;
  let isPaused = false;
  let isManuallyPaused = false;
  let testimonialInterval = null;

  function showTestimonial(index) {
    // Hide all
    videos.forEach((vid, i) => {
      vid.classList.remove('active');
      vid.pause();
    });

    // Show selected
    currentIndex = (index + videos.length) % videos.length;
    const activeVid = videos[currentIndex];
    activeVid.classList.add('active');

    // Attempt to play if not globally paused
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
    if (!globalPauseActive && !isPaused) {
      activeVid.play().catch(err => console.log('Testimonial video play failed:', err));
    }
  }

  function startAuto() {
    stopAuto();
    testimonialInterval = setInterval(() => {
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isPaused && !isManuallyPaused && !globalPauseActive) {
        showTestimonial(currentIndex + 1);
      }
    }, 6000); // 6 seconds per testimonial
  }

  function stopAuto() {
    if (testimonialInterval) clearInterval(testimonialInterval);
  }

  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.preventDefault();
      showTestimonial(currentIndex + 1);
      startAuto();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.preventDefault();
      showTestimonial(currentIndex - 1);
      startAuto();
    };
  }

  if (pauseBtn) {
    pauseBtn.onclick = (e) => {
      e.preventDefault();
      const icon = pauseBtn.querySelector('i');
      if (isManuallyPaused) {
        isManuallyPaused = false;
        isPaused = false;
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        pauseBtn.setAttribute('aria-label', 'Pause Testimonials Carousel');
        const activeVid = videos[currentIndex];
        const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
        if (!globalPauseActive) activeVid.play();
        startAuto();
      } else {
        isManuallyPaused = true;
        isPaused = true;
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        pauseBtn.setAttribute('aria-label', 'Play Testimonials Carousel');
        videos[currentIndex].pause();
        stopAuto();
      }
    };
  }

  // Handle global pause
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-pause-animations') {
        const globalPaused = document.body.getAttribute('data-pause-animations') === 'true';
        const activeVid = videos[currentIndex];
        if (globalPaused) {
          activeVid.pause();
          stopAuto();
        } else if (!isManuallyPaused) {
          activeVid.play().catch(() => { });
          startAuto();
        }
      }
    });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-pause-animations'] });

  // Initial start
  showTestimonial(0);
  startAuto();
}

// Make function globally available
window.initializeHomePage = initializeHomePage;
window.initializeDocumentCarousel = initializeDocumentCarousel;

// Auto-initialize on initial page load (when index.html loads directly)
function autoInitializeHomePage() {
  // Only initialize if we're on the home page (no hash or hash is #/)
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') {
    // Check if home content exists in the DOM
    const homeContent = document.querySelector('.carousel, .infocus-container, .stats-section');
    if (homeContent) {
      initializeHomePage();
    } else {
      // Wait a bit more if content not found yet
      setTimeout(() => {
        const retryContent = document.querySelector('.carousel, .infocus-container, .stats-section');
        if (retryContent) {
          initializeHomePage();
        }
      }, 500);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitializeHomePage);
} else {
  // DOM already loaded, wait a bit for content to be ready
  setTimeout(autoInitializeHomePage, 100);
}




/* ===========================================
   DYNAMIC INDIA MAP SCRIPT
   =========================================== */
(function ($) {
  $(document).ready(function () {
    console.log('CBC Map Script Loaded - jQuery Safe Mode v17');

    // Max wait time 30 seconds
    const maxWait = 30000;
    const interval = 200;
    let elapsed = 0;

    const checkContainer = setInterval(function () {
      let img = document.getElementById('infocus-india-map');

      // Fallback: Try finding by class if ID is missing (user might have missed the ID copy)
      if (!img) {
        img = document.querySelector('.india-map-image');
      }

      if (img && (img.complete || img.naturalWidth > 0)) {
        clearInterval(checkContainer);
        console.log('Map Image Found. Initializing SVG fetch...');
        initDynamicMap(img);
      }

      elapsed += interval;
      if (elapsed > maxWait) {
        clearInterval(checkContainer);
        console.warn('CBC Map Script: Timed out waiting for map image (#infocus-india-map).');
      }
    }, interval);

    function initDynamicMap(img) {
      const svgUrl = img.getAttribute('src');
      if (!svgUrl) {
        console.error('CBC Map Script: Image has no src attribute.');
        return;
      }

      // Prevent double init
      if (img.classList.contains('map-processed')) return;
      img.classList.add('map-processed');

      fetch(svgUrl)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.text();
        })
        .then(svgText => {
          if (!svgText.trim().startsWith('<svg') && !svgText.includes('<svg')) {
            console.warn('Fetched image is not an SVG');
            return;
          }
          const wrapper = document.createElement('div');
          wrapper.className = 'map-wrapper ' + (img.className || '');
          wrapper.innerHTML = svgText;
          const svg = wrapper.querySelector('svg');
          if (svg) {
            if (!svg.hasAttribute('viewBox')) {
              const w = svg.getAttribute('width') || 611;
              const h = svg.getAttribute('height') || 695;
              svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
            }
            svg.style.width = 'auto';
            svg.style.height = '100%';
            svg.style.display = 'block';
            svg.style.overflow = 'visible';

            // Insert wrapper before image
            img.parentNode.insertBefore(wrapper, img);
            // Hide original image
            img.style.display = 'none';

            requestAnimationFrame(() => addDotsNative(svg));
          }
        })
        .catch(error => console.error('Error loading map SVG:', error));
    }

    function addDotsNative(svg) {
      // User Provided List
      const allowedStates = [
        'andaman and nicobar',
        'andhra pradesh',
        'arunachal pradesh',
        'assam',
        'bihar',
        'chandigarh',
        'chhattisgarh', 'chattisgarh',
        'delhi',
        'goa',
        'gujarat',
        'haryana',
        'jammu and kashmir',
        'jharkhand',
        'karnataka',
        'ladakh',
        'madhya pradesh',
        'maharashtra',
        'manipur',
        'meghalaya',
        'mizoram',
        'nagaland',
        'odisha',
        'puducherry',
        'punjab',
        'rajasthan',
        'tripura',
        'uttar pradesh',
        'uttarakhand'
      ];
      const normalizeName = (name) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace('&', 'and')
          .replace('islands', '')
          .replace('island', '')
          .trim();
      };
      const stateLargestPath = new Map();
      const paths = svg.querySelectorAll('path');
      // 1. DEDUPLICATION: Find ONLY the largest path for each state
      paths.forEach(path => {
        if (path.closest('defs')) return;
        const id = path.id || '';
        const rawTitle = path.getAttribute('title') || '';
        const normalizedTitle = normalizeName(rawTitle);
        if (id.startsWith('IN-')) {
          const matchedState = allowedStates.find(state => normalizedTitle.includes(state));
          if (matchedState) {
            try {
              const bbox = path.getBBox();
              const area = bbox.width * bbox.height;
              if (bbox.width <= 0 || bbox.height <= 0) return;
              if (!stateLargestPath.has(matchedState) || area > stateLargestPath.get(matchedState).area) {
                stateLargestPath.set(matchedState, {
                  path: path,
                  bbox: bbox,
                  title: rawTitle
                });
              }
            } catch (e) { }
          }
        }
      });
      // 2. RENDER: Add One Circle per State
      stateLargestPath.forEach((data, stateName) => {
        try {
          const path = data.path;
          const bbox = data.bbox;
          const cx = bbox.x + bbox.width / 2;
          const cy = bbox.y + bbox.height / 2;
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', cx);
          circle.setAttribute('cy', cy);
          // Radius 4 for clean, visible dot
          circle.setAttribute('r', '4');
          circle.setAttribute('class', 'map-dot-svg');
          circle.setAttribute('tabindex', '0');
          circle.setAttribute('role', 'img');
          if (data.title) {
            circle.setAttribute('aria-label', data.title);
          }
          if (data.title) {
            const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            titleEl.textContent = data.title;
            circle.appendChild(titleEl);
          }
          // Staggered animation
          const safeH = svg.viewBox.baseVal.height || 700;
          const normalizedY = cy / safeH;
          const delay = (normalizedY * 1.5).toFixed(2) + 's';
          circle.style.animationDelay = delay;
          // Inject into path's parent to inherit transforms
          path.parentNode.appendChild(circle);
        } catch (e) {
          console.error('Error creating SVG dot for ' + stateName, e);
        }
      });
    }
  });
})(jQuery);
