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

  if (!video || !buttons.length || !slides.length) return;

  const videos = ['video01.mp4', 'slider0videi1.mp4', 'video3.mp4'];
  let currentSlide = 1;

  // Function to change video source properly for cross-browser compatibility
  function changeVideoSource(videoElement, newSrc) {
    // Remove existing source elements
    while (videoElement.firstChild) {
      videoElement.removeChild(videoElement.firstChild);
    }
    
    // Create and add new source element
    const source = document.createElement('source');
    source.src = newSrc;
    source.type = 'video/mp4';
    videoElement.appendChild(source);
    
    // Load and play the new video
    videoElement.load();
    
    // Use promise-based play for better browser compatibility
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Video play failed:', error);
        setTimeout(() => {
          videoElement.play().catch(err => console.log('Retry play failed:', err));
        }, 100);
      });
    }
  }

  // Ensure initial video loads properly
  video.addEventListener('loadeddata', () => {
    video.style.opacity = 1;
  });
  
  video.addEventListener('error', (e) => {
    console.error('Video loading error:', e);
    setTimeout(() => {
      video.load();
    }, 1000);
  });

  // Remove old event listeners by cloning buttons
  buttons.forEach((btn, index) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      const slideNum = parseInt(newBtn.dataset.slide);
      if (slideNum === currentSlide) return;
      currentSlide = slideNum;

      buttons.forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');

      slides.forEach(s => s.classList.remove('active'));
      slides[slideNum - 1].classList.add('active');

      video.style.opacity = 0;
      setTimeout(() => {
        changeVideoSource(video, videos[slideNum - 1]);
        video.style.opacity = 1;
      }, 400);
    });
  });
}

// ----------------------- Alert Bar Section ---------------------------------//
function initializeAlertBar() {
  const alertTrack = document.getElementById('alertTrack');
  const pauseBtn = document.getElementById('alertPauseBtn');
  const prevBtn = document.getElementById('alertPrevBtn');
  const nextBtn = document.getElementById('alertNextBtn');

  if (!alertTrack || !pauseBtn || !prevBtn || !nextBtn) return;

  let isPaused = false;
  let animationOffset = 0;
  const alertItems = alertTrack.querySelectorAll('.alert-item');
  
  // Calculate step size based on first item
  function getStepSize() {
    if (alertItems.length === 0) return 400;
    const firstItem = alertItems[0];
    const itemWidth = firstItem.offsetWidth;
    const gap = 60;
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
    const scrollAmount = direction === 'left' ? step : -step;
    
    // Get current animation position
    const currentPos = getCurrentTransform();
    
    // Calculate new offset
    animationOffset = currentPos + scrollAmount;
    
    // Temporarily pause to apply the scroll
    const wasPaused = isPaused;
    if (!wasPaused) {
      alertTrack.style.animationPlayState = 'paused';
    }
    
    // Apply the scroll offset
    alertTrack.style.transform = `translateX(${animationOffset}px)`;
    
    // If it wasn't paused, resume animation after a brief moment
    // The animation will continue from its current cycle
    if (!wasPaused) {
      setTimeout(() => {
        // Remove the manual transform and let animation continue
        // The animation will pick up from where it was
        alertTrack.style.transform = '';
        alertTrack.style.animationPlayState = 'running';
        
        // To make the scroll stick, we need to adjust the animation timing
        // Get the track width to calculate the offset percentage
        const trackWidth = alertTrack.scrollWidth / 2; // Since we duplicate items
        const offsetPercent = (animationOffset / trackWidth) * 100;
        
        // Adjust animation to start from the scrolled position
        // We'll use animation-delay to offset the start
        const animationDuration = 10; // seconds
        const delaySeconds = (offsetPercent / 100) * animationDuration;
        alertTrack.style.animationDelay = `-${delaySeconds}s`;
        
        animationOffset = 0; // Reset for next time
      }, 100);
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
  const track = document.getElementById("carouselTrack");
  const nextBtn = document.getElementById("blogNextBtn");
  const prevBtn = document.getElementById("blogPrevBtn");

  if (!track || !nextBtn || !prevBtn) return;

  const cardWidth = track.querySelector(".blog-card")?.offsetWidth + 20 || 320;
  let scrollPosition = 0;
  let blogAutoScroll;
  let isBlogPaused = false;

  // Remove old listeners
  const newNextBtn = nextBtn.cloneNode(true);
  const newPrevBtn = prevBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

  function slideBlogNext() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    scrollPosition = Math.min(scrollPosition + cardWidth, maxScroll);
    if (scrollPosition >= maxScroll - 5) {
      scrollPosition = 0; // Reset for infinite loop
    }
    track.scrollTo({ left: scrollPosition, behavior: "smooth" });
  }

  function slideBlogPrev() {
    scrollPosition = Math.max(scrollPosition - cardWidth, 0);
    track.scrollTo({ left: scrollPosition, behavior: "smooth" });
  }

  newNextBtn.addEventListener("click", () => {
    slideBlogNext();
    restartBlogAuto();
  });

  newPrevBtn.addEventListener("click", () => {
    slideBlogPrev();
    restartBlogAuto();
  });

  function updateButtons() {
    newPrevBtn.style.opacity = track.scrollLeft <= 0 ? "0.5" : "1";
    newNextBtn.style.opacity = track.scrollLeft + track.clientWidth >= track.scrollWidth ? "0.5" : "1";
  }

  // Auto Scroll Functions
  function startBlogAuto() {
    blogAutoScroll = setInterval(() => {
      if (!isBlogPaused) {
        slideBlogNext();
      }
    }, 4000);
  }

  function stopBlogAuto() {
    clearInterval(blogAutoScroll);
  }

  function restartBlogAuto() {
    stopBlogAuto();
    startBlogAuto();
  }

  // Pause on hover
  track.addEventListener('mouseenter', () => {
    isBlogPaused = true;
  });

  track.addEventListener('mouseleave', () => {
    isBlogPaused = false;
  });

  track.addEventListener("scroll", updateButtons);
  updateButtons();
  
  // Start auto scroll
  startBlogAuto();
}

// ----------------------- Collaboration Carousel ----------------------- //
function initializeCollaborationCarousel() {
  const collabTrack = document.getElementById('collabTrack');
  const collabBoxes = document.querySelectorAll('.collab-box');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');

  if (!collabTrack || !collabBoxes.length || !nextBtn || !prevBtn) return;

  let collabIndex = 0;
  let collabAutoSlide;

  // Next Slide
  function slideCollabNext() {
    collabIndex++;
    if (collabIndex > collabBoxes.length - 3) collabIndex = 0;
    collabTrack.style.transform = `translateX(-${collabIndex * (collabBoxes[0].offsetWidth + 20)}px)`;
  }

  // Prev Slide
  function slideCollabPrev() {
    collabIndex--;
    if (collabIndex < 0) collabIndex = collabBoxes.length - 3;
    collabTrack.style.transform = `translateX(-${collabIndex * (collabBoxes[0].offsetWidth + 20)}px)`;
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
    // Clear any existing interval
    if (collabAutoSlide) {
      clearInterval(collabAutoSlide);
    }
    collabAutoSlide = setInterval(() => {
      slideCollabNext();
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

  // Start auto slide after a small delay to ensure DOM is ready
  setTimeout(() => {
    startCollabAuto();
  }, 200);

  // Pause on hover
  collabTrack.addEventListener('mouseenter', stopCollabAuto);
  collabTrack.addEventListener('mouseleave', startCollabAuto);

  // Responsive fix
  window.addEventListener('resize', () => {
    collabTrack.style.transform = `translateX(-${collabIndex * (collabBoxes[0].offsetWidth + 20)}px)`;
  });
}

// --------------------- What's New Section ---------------------------------------//
function initializeNewsBanner() {
  const newsTrack = document.getElementById('newsTrack');
  const toggleBtn = document.getElementById('toggleSlideBtn');

  if (!newsTrack || !toggleBtn) return;

  const toggleIcon = toggleBtn.querySelector('i');
  let isPaused = false;
  let hasDuplicated = false;

  // Duplicate banners for seamless scrolling (only once)
  function duplicateBanners() {
    if (!hasDuplicated && newsTrack) {
      const banners = newsTrack.querySelectorAll('.news-banner');
      banners.forEach(banner => {
        const clone = banner.cloneNode(true);
        newsTrack.appendChild(clone);
      });
      hasDuplicated = true;
    }
  }

  duplicateBanners();

  // Remove old listener
  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
  const newToggleIcon = newToggleBtn.querySelector('i');

  newToggleBtn.addEventListener('click', () => {
    if (isPaused) {
      newsTrack.classList.remove('paused');
      newToggleIcon.classList.remove('fa-play');
      newToggleIcon.classList.add('fa-pause');
      isPaused = false;
    } else {
      newsTrack.classList.add('paused');
      newToggleIcon.classList.remove('fa-pause');
      newToggleIcon.classList.add('fa-play');
      isPaused = true;
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
      if (!isTransitioning) {
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
}

function setupInfocusObserver(container) {
  // Make IN FOCUS appear directly without waiting for scroll
  const content = container.querySelector('.infocus-content');
  container.classList.add('animate-in');
  if (content) {
    content.classList.add('animate-in');
  }
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
    prevBtn.onclick = function(e) {
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
    nextBtn.onclick = function(e) {
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
    if (isEventsCarouselPaused || isUserScrolling) {
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

  const scrollDistance = 300;

  // Remove old listeners
  const newPartnerNext = partnerNext.cloneNode(true);
  const newPartnerPrev = partnerPrev.cloneNode(true);
  partnerNext.parentNode.replaceChild(newPartnerNext, partnerNext);
  partnerPrev.parentNode.replaceChild(newPartnerPrev, partnerPrev);

  // Manual buttons
  newPartnerNext.addEventListener('click', () => {
    partnerSlider.scrollBy({ left: scrollDistance, behavior: 'smooth' });
  });

  newPartnerPrev.addEventListener('click', () => {
    partnerSlider.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
  });

  // Auto slide every 3 seconds
  setInterval(() => {
    partnerSlider.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    if (partnerSlider.scrollLeft + partnerSlider.clientWidth >= partnerSlider.scrollWidth - 10) {
      partnerSlider.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, 3000);
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


