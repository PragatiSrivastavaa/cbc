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
    initializeReports();
    initializeYouTubeCarousel();
    initializePhotoCarousel();
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

  // Initialize first slide
  showSlide(0);
}

document.addEventListener('DOMContentLoaded', initializeCarousel);

// ----------------------- Alert Bar Section ---------------------------------//
function populateAlertBar() {
  const alertTrack = document.getElementById('alertTrack');
  if (!alertTrack) return;

  // Clear existing content
  alertTrack.innerHTML = '';

  const alertItems = [];

  // Get latest 2-3 events from CBC_EVENTS_DATA
  if (typeof CBC_EVENTS_DATA !== 'undefined' && Array.isArray(CBC_EVENTS_DATA) && CBC_EVENTS_DATA.length > 0) {
    // Parse event dates using the same function as eventsPage.js
    function parseEventDate(dateText) {
      const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
      };
      
      const parts = dateText.trim().split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthName = parts[1].toLowerCase();
        const year = parseInt(parts[2], 10);
        
        if (months[monthName] !== undefined) {
          return new Date(year, months[monthName], day);
        }
      }
      
      // Fallback to standard Date parsing
      return new Date(dateText);
    }

    // Sort events by date (most recent first)
    const sortedEvents = [...CBC_EVENTS_DATA].map((evt, index) => {
      const parsedDate = parseEventDate(evt.date);
      return {
        ...evt,
        id: `event-${index}`,
        originalIndex: index,
        parsedDate: parsedDate
      };
    }).sort((a, b) => {
      return b.parsedDate - a.parsedDate;
    });

    // Filter out events containing "daksh" or "national training conclave" (case-insensitive)
    const filteredEvents = sortedEvents.filter(event => {
      const titleLower = event.title.toLowerCase();
      return !titleLower.includes('daksh') && !titleLower.includes('national training conclave');
    });

    // Get latest 3 events (after filtering)
    const latestEvents = filteredEvents.slice(0, 3);
    
    latestEvents.forEach(event => {
      // Link to event details page using the event ID
      const eventLink = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;
      
      // Prepare event data in the format expected by event details page
      // Store date as Date object (will be serialized to ISO string when stored in localStorage)
      // The event details page uses new Date(event.date) which can parse ISO strings
      const eventData = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.parsedDate, // Date object - will be serialized to ISO string in JSON
        dateText: event.date, // Keep original date text for display
        image: event.image,
        link: event.link,
        venue: 'Capacity Building Commission'
      };
      
      alertItems.push({
        text: event.title,
        link: eventLink,
        isEvent: true,
        eventData: eventData
      });
    });
  }

  // Add flagship initiatives
  const flagshipInitiatives = [
    {
      text: 'Rashtriya Karmayogi Large-Scale Jan Seva Programme',
      link: 'pages/initiatives/rashtriya-karmayogi.html'
    }
  ];

  flagshipInitiatives.forEach(initiative => {
    alertItems.push(initiative);
  });

  // Create alert items
  alertItems.forEach(item => {
    const alertItem = document.createElement('a');
    alertItem.href = item.link;
    alertItem.className = 'alert-item';
    
    // For events, store data in localStorage before navigation
    if (item.isEvent && item.eventData) {
      // Store event data as data attributes so clones will have it too
      alertItem.setAttribute('data-event-id', item.eventData.id);
      alertItem.setAttribute('data-event-data', JSON.stringify(item.eventData));
      
      alertItem.addEventListener('click', function(e) {
        // Get event data from data attribute
        const eventDataStr = this.getAttribute('data-event-data');
        if (eventDataStr) {
          try {
            const eventData = JSON.parse(eventDataStr);
            // Store event data in localStorage for event details page
            localStorage.setItem('currentEvent', JSON.stringify(eventData));
            localStorage.setItem(`event_${eventData.id}`, JSON.stringify(eventData));
          } catch (err) {
            console.error('Error parsing event data:', err);
          }
        }
      });
    }
    
    const dot = document.createElement('span');
    dot.className = 'alert-dot';
    
    const text = document.createElement('span');
    text.textContent = item.text;
    
    alertItem.appendChild(dot);
    alertItem.appendChild(text);
    
    alertTrack.appendChild(alertItem);
  });

  // Duplicate items for seamless scrolling
  // Note: Event listeners are cloned with cloneNode(true), so they'll work on clones too
  const items = alertTrack.querySelectorAll('.alert-item');
  items.forEach(item => {
    const clone = item.cloneNode(true);
    alertTrack.appendChild(clone);
  });
}

function initializeAlertBar() {
  // First populate the alert bar
  populateAlertBar();

  const alertTrack = document.getElementById('alertTrack');
  const pauseBtn = document.getElementById('alertPauseBtn');
  const prevBtn = document.getElementById('alertPrevBtn');
  const nextBtn = document.getElementById('alertNextBtn');

  if (!alertTrack) return;

  // Only initialize controls if buttons exist (they're commented out in HTML)
  if (!pauseBtn || !prevBtn || !nextBtn) {
    return;
  }

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

  // Add click handlers to collaboration boxes
  collabBoxes.forEach((box) => {
    // Make boxes clickable
    box.style.cursor = 'pointer';
    
    box.addEventListener('click', (e) => {
      // Don't handle clicks on links or buttons
      if (e.target.closest('a') || e.target.tagName === 'A' || 
          e.target.closest('button') || e.target.tagName === 'BUTTON' ||
          e.target.closest('.collab-arrow') || e.target.classList.contains('collab-arrow')) {
        return;
      }
      
      // Extract data from the card
      const imageElement = box.querySelector('.collab-image');
      const titleElement = box.querySelector('h3');
      const textElement = box.querySelector('p');
      
      const image = imageElement ? imageElement.getAttribute('src') : '';
      const title = titleElement ? titleElement.textContent.trim() : '';
      const text = textElement ? textElement.textContent.trim() : '';
      
      // Build URL with parameters
      const baseUrl = 'pages/collaborations/collaboration-detail.html';
      const params = new URLSearchParams();
      if (image) params.append('image', encodeURIComponent(image));
      if (title) params.append('title', encodeURIComponent(title));
      if (text) params.append('text', encodeURIComponent(text));
      
      const fullUrl = baseUrl + '?' + params.toString();
      window.location.href = fullUrl;
    });
  });

  // Ensure View More link works properly
  const viewMoreLink = document.querySelector('.collab-footer .view-more');
  if (viewMoreLink) {
    viewMoreLink.addEventListener('click', function(e) {
      // Ensure the link navigation works
      const href = this.getAttribute('href');
      if (href) {
        window.location.href = href;
      }
    });
  }
}

// --------------------- What's New Section ---------------------------------------//
function populateNewsBanner() {
  const newsTrack = document.getElementById('newsTrack');
  if (!newsTrack) return;

  // Clear existing content
  newsTrack.innerHTML = '';

  const newsItems = [];

  // Get latest 2-3 events from CBC_EVENTS_DATA
  if (typeof CBC_EVENTS_DATA !== 'undefined' && Array.isArray(CBC_EVENTS_DATA) && CBC_EVENTS_DATA.length > 0) {
    // Parse event dates using the same function as eventsPage.js
    function parseEventDate(dateText) {
      const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
      };
      
      const parts = dateText.trim().split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthName = parts[1].toLowerCase();
        const year = parseInt(parts[2], 10);
        
        if (months[monthName] !== undefined) {
          return new Date(year, months[monthName], day);
        }
      }
      
      // Fallback to standard Date parsing
      return new Date(dateText);
    }

    // Sort events by date (most recent first)
    const sortedEvents = [...CBC_EVENTS_DATA].map((evt, index) => {
      const parsedDate = parseEventDate(evt.date);
      return {
        ...evt,
        id: `event-${index}`,
        originalIndex: index,
        parsedDate: parsedDate
      };
    }).sort((a, b) => {
      return b.parsedDate - a.parsedDate;
    });

    // Get latest 3 events
    const latestEvents = sortedEvents.slice(0, 3);
    
    latestEvents.forEach(event => {
      const eventLink = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;
      const eventData = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.parsedDate,
        dateText: event.date,
        image: event.image,
        link: event.link,
        venue: 'Capacity Building Commission'
      };
      
      newsItems.push({
        text: event.title,
        link: eventLink,
        isEvent: true,
        eventData: eventData,
        isNew: true
      });
    });
  }

  // Add the new "What's New" item about Phase 2
  newsItems.push({
    text: 'Under Phase 2 of the Rashtriya Karmayogi Large-Scale Jan Seva Program, 822 Lead Trainers, 15,304 Master Trainers, and 7,35,048 employees have been trained in one-day training sessions till date.',
    link: 'pages/initiatives/rashtriya-karmayogi.html',
    isEvent: false,
    isNew: true
  });

  // Add some existing news items
  newsItems.push({
    text: 'The upgraded NSCSTI 2.0 framework launched — streamlining training institute standards across India.',
    link: 'pages/initiatives/nscsti.html',
    isEvent: false,
    isNew: true
  });

  newsItems.push({
    text: 'More than 1.26 crore learners across India benefitted from the iGOT Karmayogi platform.',
    link: '#',
    isEvent: false,
    isNew: true
  });

  newsItems.push({
    text: 'CBC introduces new AI-based feedback analytics tool for training institutes.',
    link: '#',
    isEvent: false,
    isNew: false
  });

  // Create news banners
  newsItems.forEach(item => {
    const newsBanner = document.createElement('a');
    newsBanner.href = item.link;
    newsBanner.className = 'news-banner high-contrast-border';
    newsBanner.style.textDecoration = 'none';
    newsBanner.style.color = 'inherit';
    newsBanner.style.display = 'flex';
    newsBanner.style.cursor = 'pointer';

    // Add NEW badge if needed
    if (item.isNew) {
      const newBadge = document.createElement('div');
      newBadge.className = 'new-badge';
      newBadge.innerHTML = `
        <span class="badge-text">NEW</span>
        <div class="badge-glow"></div>
      `;
      newsBanner.appendChild(newBadge);
    }

    // Add content
    const content = document.createElement('div');
    content.className = 'news-banner-content';
    const paragraph = document.createElement('p');
    paragraph.textContent = item.text;
    content.appendChild(paragraph);
    newsBanner.appendChild(content);

    // For events, store data in localStorage before navigation
    if (item.isEvent && item.eventData) {
      newsBanner.setAttribute('data-event-id', item.eventData.id);
      newsBanner.setAttribute('data-event-data', JSON.stringify(item.eventData));
      
      newsBanner.addEventListener('click', function(e) {
        const eventDataStr = this.getAttribute('data-event-data');
        if (eventDataStr) {
          try {
            const eventData = JSON.parse(eventDataStr);
            localStorage.setItem('currentEvent', JSON.stringify(eventData));
            localStorage.setItem(`event_${eventData.id}`, JSON.stringify(eventData));
          } catch (err) {
            console.error('Error parsing event data:', err);
          }
        }
      });
    }

    newsTrack.appendChild(newsBanner);
  });
}

function initializeNewsBanner() {
  // First populate the news banner
  populateNewsBanner();

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
function initializeReports() {
  const reportsTrack = document.getElementById("reportsTrack");
  const reportsBtn = document.getElementById("toggleReportsSlideBtn");

  if (!reportsTrack || !reportsBtn) return;

  // Duplicate items for seamless scrolling
  const reportsItems = reportsTrack.querySelectorAll(".newsletters-item");
  if (reportsItems.length > 0) {
    reportsItems.forEach(item => {
      const clone = item.cloneNode(true);
      reportsTrack.appendChild(clone);
    });
  }

  const reportsIcon = reportsBtn.querySelector("i");
  let isReportsPaused = false;

  // Remove old listener
  const newReportsBtn = reportsBtn.cloneNode(true);
  reportsBtn.parentNode.replaceChild(newReportsBtn, reportsBtn);
  const newReportsIcon = newReportsBtn.querySelector("i");

  newReportsBtn.addEventListener("click", () => {
    if (!isReportsPaused) {
      reportsTrack.style.animationPlayState = "paused";
      newReportsIcon.classList.remove("fa-pause");
      newReportsIcon.classList.add("fa-play");
      isReportsPaused = true;
    } else {
      reportsTrack.style.animationPlayState = "running";
      newReportsIcon.classList.remove("fa-play");
      newReportsIcon.classList.add("fa-pause");
      isReportsPaused = false;
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
      if (!isTransitioning) {
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

// Social media carousel removed - now using grid layout

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
  // NEW: Populate events from static data if available
  if (typeof CBC_EVENTS_DATA !== 'undefined' && Array.isArray(CBC_EVENTS_DATA)) {
    const eventsList = document.getElementById('homeEventsCardsList');
    if (eventsList) {
      eventsList.innerHTML = ''; // Clear existing static cards

      // Take top 10 events
      const recentEvents = CBC_EVENTS_DATA.slice(0, 10);

      recentEvents.forEach((evt, index) => {
        const dateObj = new Date(evt.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'home-event-card high-contrast-border';
        card.setAttribute('data-event-id', `home-event-${index}`);
        card.setAttribute('data-date', evt.date);
        card.setAttribute('data-venue', 'Capacity Building Commission');

        card.innerHTML = `
          <div class="home-event-card-image">
            <img src="${evt.image}" alt="${evt.title}" onerror="this.src='img/event1.jpg'">
          </div>
          <div class="home-event-card-content">
            <div class="home-event-card-date">
              <i class="fas fa-calendar"></i> ${dateStr}
            </div>
            <h3 class="home-event-card-title">${evt.title}</h3>
            <p class="home-event-card-description">${evt.description}</p>
            <div class="home-event-card-read-more">
              Read More <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        `;
        eventsList.appendChild(card);
      });
    }
  }

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
          // Store event data in localStorage for the details page
          localStorage.setItem('currentEvent', JSON.stringify(eventDetails));
          // Navigate to event details page
          window.location.href = `pages/event-details.html?id=${encodeURIComponent(eventDetails.id)}`;
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


