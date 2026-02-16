// Home Page Initialization Scripts
// This file contains all initialization functions for the home page
// It will be called when navigating to the home page via the router

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
    initializeNewsletters();
    initializeYouTubeCarousel();
    initializePhotoCarousel();
    initializeSocialCarousel();
    initializeInfocusSection();
    initializeHomeEvents();
    initializePartnerSlider();
    initializeChairpersonModal();
  };

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

  // CSP Fix: Read video data from JSON script tag to avoid inline scripts
  let slideVideos = [];
  const videoDataScript = document.getElementById('carousel-video-data');
  if (videoDataScript) {
    try {
      slideVideos = JSON.parse(videoDataScript.textContent);
    } catch (e) {
      console.error('Error parsing slideVideos:', e);
    }
  }

  if (!video || !buttons.length || !slides.length) return;

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    // Change video source for the active slide
    if (slideVideos[index]) {
      // Remove existing <source>
      while (video.firstChild) video.removeChild(video.firstChild);

      // Add new <source>
      const source = document.createElement('source');
      source.src = slideVideos[index];
      source.type = 'video/mp4';
      video.appendChild(source);

      video.load();
      video.play().catch(err => console.log('Video play failed:', err));
    }

    currentSlide = index;
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => showSlide(i));
  });

  // New Navigation Arrows
  const prevArrow = document.querySelector('.carousel-prev');
  const nextArrow = document.querySelector('.carousel-next');

  if (prevArrow) {
    prevArrow.addEventListener('click', () => {
      const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(prevIndex);
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', () => {
      const nextIndex = (currentSlide + 1) % slides.length;
      showSlide(nextIndex);
    });
  }

  // Initialize first slide
  showSlide(0);
}

// Initialize everything
initializeHomePage();



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

  function pauseAnimation() {
    if (!isPaused) {
      const currentPos = getCurrentTransform();
      animationOffset = currentPos;
      alertTrack.classList.add('paused');
      alertTrack.style.animationPlayState = 'paused';
      alertTrack.style.transform = `translateX(${animationOffset}px)`;
      newPauseIcon.classList.remove('fa-pause');
      newPauseIcon.classList.add('fa-play');
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

  // Scroll Listener for Infinite Loop
  track.addEventListener('scroll', () => {
    // If we have scrolled past the original set, snap back to start
    if (track.scrollLeft >= singleSetWidth) {
      track.style.scrollBehavior = 'auto'; // Disable smooth for instant snap
      track.scrollLeft -= singleSetWidth;
      track.style.scrollBehavior = 'smooth'; // Re-enable
    }
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
      if (!isBlogPaused) {
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
  track.addEventListener('mouseleave', () => { isBlogPaused = false; });

  newNextBtn.addEventListener('mouseenter', () => { isBlogPaused = true; });
  newNextBtn.addEventListener('mouseleave', () => { isBlogPaused = false; });
  newPrevBtn.addEventListener('mouseenter', () => { isBlogPaused = true; });
  newPrevBtn.addEventListener('mouseleave', () => { isBlogPaused = false; });

  // Start auto scroll
  startBlogAuto();
}

// ----------------------- Collaboration Carousel ----------------------- //
function initializeCollaborationCarousel() {
  const collabTrack = document.getElementById('collabTrack');
  const nextBtn = document.getElementById('collabNextBtn');
  const prevBtn = document.getElementById('collabPrevBtn');

  if (!collabTrack || !nextBtn || !prevBtn) return;

  // Use direct children (should be <a> tags wrapping the boxes) to preserve layout styles
  const originalItems = Array.from(collabTrack.children);

  if (originalItems.length === 0) return;

  const cardWidth = 365; // 350px width + 15px gap

  // Clone items for infinite scroll
  // We double the content. When we reach the start of the cloned set, we snap back to 0.
  const singleSetWidth = cardWidth * originalItems.length;

  // Check if we already cloned (in case of re-init)
  // We check if the number of children is equal to the original set size
  // Note: This simple check assumes no other dynamic additions. 
  // For better idempotency, we could use a specialized class or attribute.
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

  // Scroll Listener for Infinite Loop (Forward)
  collabTrack.addEventListener('scroll', () => {
    // If we have scrolled past the original set, snap back to start
    if (collabTrack.scrollLeft >= singleSetWidth) {
      collabTrack.style.scrollBehavior = 'auto'; // Disable smooth for instant snap
      collabTrack.scrollLeft -= singleSetWidth;
      collabTrack.style.scrollBehavior = 'smooth'; // Re-enable
    }
  });

  // Next Slide
  function slideCollabNext() {
    collabTrack.scrollBy({ left: cardWidth, behavior: 'smooth' });
  }

  // Prev Slide
  function slideCollabPrev() {
    // If at start (or close to it), snap to end of original set to allow scrolling left into it
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
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

  // Button Controls
  newNextBtn.addEventListener('click', () => {
    slideCollabNext();
    restartCollabAuto();
  });

  newPrevBtn.addEventListener('click', () => {
    slideCollabPrev();
    restartCollabAuto();
  });

  // Auto Slide
  function startCollabAuto() {
    if (collabAutoSlide) clearInterval(collabAutoSlide);
    collabAutoSlide = setInterval(() => {
      // Check global pause-animations accessibility setting
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isCollabPaused && !globalPauseActive) {
        slideCollabNext();
      }
    }, 4000); // 4 seconds
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

  // Start auto slide
  startCollabAuto();

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

  // --- Dynamic Speed Calculation ---
  function updateNewsAnimationSpeed() {
    // 1. Get total height of the track
    // The track contains 2 sets of items (original + clone).
    // We want the duration for ONE full cycle (half height).
    const scrollHeight = newsTrack.scrollHeight;
    const oneCycleHeight = scrollHeight / 2;

    // 2. Define target speed (pixels per second)
    // Adjust this value to make it faster or slower.
    // 30px/s is a readable slow scroll. 80px/s is faster.
    const speedPxPerSec = 80;

    // 3. Calculate duration
    let duration = oneCycleHeight / speedPxPerSec;

    // Ensure a minimum reasonable duration so it doesn't fly too fast if empty
    if (duration < 5) duration = 5;

    // 4. Apply to the element
    newsTrack.style.animationDuration = `${duration}s`;
  }

  // Calculate initially and on resize
  updateNewsAnimationSpeed();
  window.addEventListener('resize', updateNewsAnimationSpeed);
  // Also update on window load to ensure all resources (fonts/images) are loaded for correct height
  window.addEventListener('load', updateNewsAnimationSpeed);

  // --- Pause/Play Logic ---
  let isPaused = false;

  // Remove old listener
  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
  const newToggleIcon = newToggleBtn.querySelector('i');

  newToggleBtn.addEventListener('click', () => {
    if (!isPaused) {
      newsTrack.classList.add('paused');
      newToggleIcon.classList.remove('fa-pause');
      newToggleIcon.classList.add('fa-play');
      isPaused = true;
    } else {
      newsTrack.classList.remove('paused');
      newToggleIcon.classList.remove('fa-play');
      newToggleIcon.classList.add('fa-pause');
      isPaused = false;
    }
  });

  // Pause on hover (optional, good for UX)
  newsTrack.addEventListener('mouseenter', () => {
    if (!isPaused) {
      newsTrack.classList.add('paused');
    }
  });

  newsTrack.addEventListener('mouseleave', () => {
    if (!isPaused) {
      newsTrack.classList.remove('paused');
    }
  });
}

// ============================= Media Corner ------------------------------------//
function initializeMediaCorner() {
  const mediaCornerTrack = document.getElementById("mediaTrack");
  const mediaCornerBtn = document.getElementById("toggleMediaSlideBtn");

  if (!mediaCornerTrack || !mediaCornerBtn) return;

  // Duplicate items for seamless scrolling
  const mediaItems = mediaCornerTrack.querySelectorAll(".media-item");
  if (mediaItems.length > 0) {
    mediaItems.forEach(item => {
      const clone = item.cloneNode(true);
      mediaCornerTrack.appendChild(clone);
    });
  }

  const mediaCornerIcon = mediaCornerBtn.querySelector("i");
  let isMediaCornerPaused = false;

  // Remove old listener
  const newMediaCornerBtn = mediaCornerBtn.cloneNode(true);
  mediaCornerBtn.parentNode.replaceChild(newMediaCornerBtn, mediaCornerBtn);
  const newMediaCornerIcon = newMediaCornerBtn.querySelector("i");

  newMediaCornerBtn.addEventListener("click", () => {
    if (!isMediaCornerPaused) {
      mediaCornerTrack.style.animationPlayState = "paused";
      newMediaCornerIcon.classList.remove("fa-pause");
      newMediaCornerIcon.classList.add("fa-play");
      isMediaCornerPaused = true;
    } else {
      mediaCornerTrack.style.animationPlayState = "running";
      newMediaCornerIcon.classList.remove("fa-play");
      newMediaCornerIcon.classList.add("fa-pause");
      isMediaCornerPaused = false;
    }
  });
}

// ============================= Newsletters Section ------------------------------------//
function initializeNewsletters() {
  const newslettersTrack = document.getElementById("newslettersTrack");
  const newslettersBtn = document.getElementById("toggleNewslettersSlideBtn");

  if (!newslettersTrack || !newslettersBtn) return;

  // Duplicate items for seamless scrolling
  const newslettersItems = newslettersTrack.querySelectorAll(".newsletters-item");
  if (newslettersItems.length > 0) {
    newslettersItems.forEach(item => {
      const clone = item.cloneNode(true);
      newslettersTrack.appendChild(clone);
    });
  }

  const newslettersIcon = newslettersBtn.querySelector("i");
  let isNewslettersPaused = false;

  // Remove old listener
  const newNewslettersBtn = newslettersBtn.cloneNode(true);
  newslettersBtn.parentNode.replaceChild(newNewslettersBtn, newslettersBtn);
  const newNewslettersIcon = newNewslettersBtn.querySelector("i");

  newNewslettersBtn.addEventListener("click", () => {
    if (!isNewslettersPaused) {
      newslettersTrack.style.animationPlayState = "paused";
      newNewslettersIcon.classList.remove("fa-pause");
      newNewslettersIcon.classList.add("fa-play");
      isNewslettersPaused = true;
    } else {
      newslettersTrack.style.animationPlayState = "running";
      newNewslettersIcon.classList.remove("fa-play");
      newNewslettersIcon.classList.add("fa-pause");
      isNewslettersPaused = false;
    }
  });
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
      const img = card.querySelector('img');
      if (img) {
        img.style.opacity = '1';
        img.style.visibility = 'visible';
      }
    });

    // Apply transform
    photoCarousel.style.transform = `translateX(-${index * 100}%)`;

    setTimeout(() => {
      isTransitioning = false;
    }, 600);
  }

  // Next slide
  function slideNext() {
    if (isTransitioning) return;
    const nextIndex = (photoIndex + 1) % photoCards.length;
    showPhotoSlide(nextIndex);
    restartAutoSlide();
  }

  // Previous slide
  function slidePrev() {
    if (isTransitioning) return;
    const prevIndex = (photoIndex - 1 + photoCards.length) % photoCards.length;
    showPhotoSlide(prevIndex);
    restartAutoSlide();
  }

  // Remove old listeners
  const newPhotoNext = photoNext.cloneNode(true);
  const newPhotoPrev = photoPrev.cloneNode(true);
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

  // Auto slide functionality
  function startAutoSlide() {
    if (photoAutoSlide) {
      clearInterval(photoAutoSlide);
    }
    photoAutoSlide = setInterval(() => {
      // Check global pause-animations accessibility setting
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isTransitioning && !globalPauseActive) {
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
    restartAutoSlide();
  }

  // Previous slide
  function slidePrev() {
    if (isTransitioning) return;
    const prevIndex = (ytIndex - 1 + ytCards.length) % ytCards.length;
    showYouTubeSlide(prevIndex);
    restartAutoSlide();
  }

  // Remove old listeners
  const newYtNext = ytNext.cloneNode(true);
  const newYtPrev = ytPrev.cloneNode(true);
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

  // Auto slide functionality
  function startAutoSlide() {
    if (ytAutoSlide) {
      clearInterval(ytAutoSlide);
    }
    ytAutoSlide = setInterval(() => {
      // Check global pause-animations accessibility setting
      const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';
      if (!isTransitioning && !globalPauseActive) {
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
    socialNext.parentNode.replaceChild(newSocialNext, socialNext);
    socialPrev.parentNode.replaceChild(newSocialPrev, socialPrev);

    newSocialNext.addEventListener('click', () => slide(1));
    newSocialPrev.addEventListener('click', () => slide(-1));

    let autoSlide = setInterval(() => slide(1), 6000);
    socialCarousel.addEventListener('mouseenter', () => clearInterval(autoSlide));
    socialCarousel.addEventListener('mouseleave', () => {
      autoSlide = setInterval(() => slide(1), 6000);
    });
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
  // Setup modal close listeners
  const modalBackdrop = document.getElementById('homeEventModalBackdrop');
  const modalClose = document.getElementById('homeEventModalClose');

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeHomeEventModal);
  }
  if (modalClose) {
    modalClose.addEventListener('click', closeHomeEventModal);
  }

  // Attach click handlers to existing HTML event cards
  attachEventCardHandlers();

  // Initialize carousel with existing HTML cards
  initEventsCarousel();
}

function buildEventDataFromCard(card) {
  if (!card) return null;

  const title = card.querySelector('.home-event-card-title')?.textContent.trim() || '';
  const description = card.querySelector('.home-event-card-description')?.textContent.trim() || '';
  const dateAttr = card.dataset.date;
  const fallbackDateText = card.querySelector('.home-event-card-date')?.textContent.replace(/\s+/g, ' ').trim();
  const imageEl = card.querySelector('.home-event-card-image img');
  const image = imageEl ? imageEl.getAttribute('src') : '';
  const venue = card.dataset.venue || '';

  let parsedDate = null;
  if (dateAttr) {
    parsedDate = new Date(dateAttr);
  } else if (fallbackDateText) {
    parsedDate = new Date(fallbackDateText);
  }

  return {
    id: card.getAttribute('data-event-id') || '',
    title,
    description,
    date: parsedDate || new Date(),
    image,
    venue
  };
}

function attachEventCardHandlers() {
  const eventsCardsList = document.getElementById('homeEventsCardsList');
  if (!eventsCardsList) return;

  const eventCards = eventsCardsList.querySelectorAll('.home-event-card');

  eventCards.forEach(card => {
    const eventId = card.getAttribute('data-event-id');
    if (eventId) {
      // Remove any existing listeners by cloning
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      // Attach click handler
      newCard.addEventListener('click', () => {
        const eventDetails = buildEventDataFromCard(newCard);
        if (eventDetails) {
          showHomeEventModal(eventDetails);
        }
      });
    }
  });
}

// Events Carousel Functionality
let eventsCarouselInterval = null;
let isEventsCarouselPaused = false;
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

  // Pause on hover
  cardsList.addEventListener('mouseenter', () => {
    isEventsCarouselPaused = true;
  });

  cardsList.addEventListener('mouseleave', () => {
    isEventsCarouselPaused = false;
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
        isEventsCarouselPaused = false;
      }, 1000);
    };
  }

  // Manual navigation - Next button
  if (nextBtn) {
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
        isEventsCarouselPaused = false;
      }, 1000);
    };
  }
}

function startAutoScroll(cardsList) {
  // Ensure cards are duplicated for infinite scroll
  const cards = cardsList.querySelectorAll('.home-event-card');
  if (cards.length > 0 && cardsList.scrollWidth <= cardsList.clientWidth * 1.5) {
    // Duplicate cards if not already duplicated
    const firstCard = cards[0];
    const cardWidth = firstCard.offsetWidth;
    const gap = 28;
    const totalWidth = (cardWidth + gap) * cards.length;

    if (cardsList.scrollWidth < totalWidth * 1.5) {
      cards.forEach(card => {
        const clone = card.cloneNode(true);
        cardsList.appendChild(clone);
      });
    }
  }

  function autoScroll() {
    // Check if global accessibility pause is active
    const globalPauseActive = document.body.getAttribute('data-pause-animations') === 'true';

    if (isEventsCarouselPaused || isUserScrolling || globalPauseActive) {
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

// Calendar rendering removed - calendar only on events page

function showHomeDayEvents(events, date) {
  if (!events || events.length === 0) return;

  const modalBody = document.getElementById('homeEventModalBody');
  const modal = document.getElementById('homeEventModal');

  if (!modalBody || !modal) return;

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (events.length === 1) {
    showHomeEventModal(events[0]);
  } else {
    modalBody.innerHTML = `
      <div class="day-events-header">
        <h2 class="event-modal-title">Events on ${dateStr}</h2>
        <p class="day-events-count">${events.length} event${events.length > 1 ? 's' : ''} on this day</p>
      </div>
      <div class="day-events-list">
        ${events.map((event, idx) => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `
            <div class="day-event-item" data-event-id="${event.id}" data-event-index="${idx}">
              ${event.image ? `
                <div class="day-event-image">
                  <img src="${event.image}" alt="${event.title}" onerror="this.style.display='none'">
                </div>
              ` : ''}
              <div class="day-event-content">
                <div class="day-event-date">
                  <i class="fas fa-calendar"></i> ${formattedDate}
                </div>
                ${event.venue ? `
                  <div class="day-event-venue">
                    <i class="fas fa-map-marker-alt"></i> ${event.venue}
                  </div>
                ` : ''}
                <h3 class="day-event-title">${event.title}</h3>
                <p class="day-event-description">${event.description}</p>
                <button class="day-event-view-btn">View Full Details <i class="fas fa-arrow-right"></i></button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
    openHomeEventModal();

    setTimeout(() => {
      const dayEventItems = modalBody.querySelectorAll('.day-event-item');
      dayEventItems.forEach((item) => {
        const idx = parseInt(item.dataset.eventIndex);
        item.addEventListener('click', (e) => {
          if (e.target.closest('.day-event-view-btn')) {
            closeHomeEventModal();
            setTimeout(() => showHomeEventModal(events[idx]), 300);
          } else {
            closeHomeEventModal();
            setTimeout(() => showHomeEventModal(events[idx]), 300);
          }
        });
      });
    }, 100);
  }
}

function showHomeEventModal(event) {
  const modalBody = document.getElementById('homeEventModalBody');
  const modal = document.getElementById('homeEventModal');

  if (!modalBody || !modal) return;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  modalBody.innerHTML = `
    <div class="event-modal-image">
      <img src="${event.image || 'img/event1.jpg'}" alt="${event.title}" onerror="this.src='img/event1.jpg'">
    </div>
    <div class="event-modal-info">
      <div class="event-modal-date">
        <i class="fas fa-calendar"></i> ${formattedDate}
      </div>
      ${event.venue ? `
        <div class="event-modal-venue">
          <i class="fas fa-map-marker-alt"></i> ${event.venue}
        </div>
      ` : ''}
      <h2 class="event-modal-title">${event.title}</h2>
      <div class="event-modal-description">
        <p>${event.description}</p>
      </div>
    </div>
  `;

  openHomeEventModal();
}

function openHomeEventModal() {
  const modal = document.getElementById('homeEventModal');
  if (!modal) return;

  modal.classList.add('active');
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  modal.style.zIndex = '10000';
  document.body.style.overflow = 'hidden';
}

function closeHomeEventModal() {
  const modal = document.getElementById('homeEventModal');
  if (modal) {
    modal.classList.remove('active');
    // Reset all inline styles that were set when opening
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    modal.style.zIndex = '';
    document.body.style.overflow = '';
  }
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

  // Pause on hover
  partnerSlider.addEventListener('mouseenter', () => {
    track.classList.add('paused');
  });
  partnerSlider.addEventListener('mouseleave', () => {
    track.classList.remove('paused');
  });

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

  // Replace buttons with clean clones to avoid double listeners
  const newPartnerNext = partnerNext.cloneNode(true);
  const newPartnerPrev = partnerPrev.cloneNode(true);
  partnerNext.parentNode.replaceChild(newPartnerNext, partnerNext);
  partnerPrev.parentNode.replaceChild(newPartnerPrev, partnerPrev);

  newPartnerNext.addEventListener('click', () => scrollMarquee('right'));
  newPartnerPrev.addEventListener('click', () => scrollMarquee('left'));
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
    }, 10);
  }

  // Close modal with reverse scroll animation (bottom to top)
  function closeModal() {
    modalWrapper.style.transform = 'translateY(-100%)';
    modalWrapper.style.opacity = '0';

    setTimeout(() => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
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
