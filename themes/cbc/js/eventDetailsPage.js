// Event Details Page JavaScript
// Handles displaying event data and form submission


// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  loadEventData();
});

// Load event data from URL parameters or localStorage
function loadEventData() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  // Try to get event data from localStorage (set by navigation)
  let eventData = null;
  if (eventId) {
    const storedData = localStorage.getItem(`event_${eventId}`);
    if (storedData) {
      try {
        eventData = JSON.parse(storedData);
      } catch (e) {
        console.error('Error parsing event data:', e);
      }
    }
  }
  
  // If no data found, try to get from recent navigation
  if (!eventData) {
    const recentEvent = localStorage.getItem('currentEvent');
    if (recentEvent) {
      try {
        eventData = JSON.parse(recentEvent);
      } catch (e) {
        console.error('Error parsing recent event data:', e);
      }
    }
  }
  
  if (eventData) {
    displayEventData(eventData);
    // Clear the stored data after use
    if (eventId) {
      localStorage.removeItem(`event_${eventId}`);
    }
    localStorage.removeItem('currentEvent');
  } else {
    // Show error message if no event data found
    const articleSection = document.querySelector('.event-article-section');
    if (articleSection) {
      articleSection.innerHTML = `
        <div class="container">
          <div class="row">
            <div class="col-lg-10 offset-lg-1">
              <h1 class="event-article-title">Event Not Found</h1>
              <div class="event-article-content">
                <p>Unable to load event details. Please go back to the events page and try again.</p>
                <a href="pages/events.html" class="btn-submit-enhanced" style="text-decoration: none; display: inline-block; margin-top: 20px;">
                  <span>Back to Events</span>
                  <i class="fas fa-arrow-left"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Display event data on the page
function displayEventData(event) {
  const imageContainer = document.getElementById('eventImageContainer');
  const dateEl = document.getElementById('eventDate');
  const venueEl = document.getElementById('eventVenue');
  const titleEl = document.getElementById('eventTitle');
  const descriptionEl = document.getElementById('eventDescription');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  
  // Display image in article style
  if (imageContainer && event.image) {
    imageContainer.innerHTML = `
      <a href="${event.image}" class="event-image-zoom" title="${event.title || 'Event'}" style="display:block; position:relative; overflow:hidden; border-radius:12px;">
        <img src="${event.image}" alt="${event.title || 'Event'}" onerror="this.style.display='none'" style="width:100%; transition:transform 0.2s; cursor:zoom-in;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
      </a>`;
  }
  
  // Display date
  if (dateEl && event.date) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateEl.innerHTML = `<i class="fas fa-calendar"></i> ${formattedDate}`;
  }
  
  // Display venue
  if (venueEl && event.venue) {
    venueEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.venue}`;
  } else if (venueEl) {
    venueEl.style.display = 'none';
  }
  
  // Display title in article and hero
  if (titleEl && event.title) {
    titleEl.textContent = event.title;
  }
  if (heroTitle && event.title) {
    heroTitle.textContent = event.title;
  }
  
  // Update hero subtitle with date
  if (heroSubtitle && event.date) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    heroSubtitle.textContent = formattedDate;
  }
  
  // Display description as article content
  if (descriptionEl && event.description) {
    // Format description as paragraphs if it contains line breaks
    const description = event.description;
    const paragraphs = description.split('\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length > 1) {
      descriptionEl.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    } else {
      descriptionEl.innerHTML = `<p>${description}</p>`;
    }
  }
}

// Simple generic fallback modal for zooming images without needing new files
document.addEventListener('click', function(e) {
  const zoomLink = e.target.closest('.event-image-zoom');
  if (zoomLink) {
    e.preventDefault();
    const src = zoomLink.getAttribute('href');
    const title = zoomLink.getAttribute('title') || '';
    
    const html = `
      <div id="simpleImgModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; justify-content:center; align-items:center;" onclick="this.remove()">
        <div style="position:relative; background:#fff; padding:15px; border-radius:5px; max-width:95%; max-height:95%; box-shadow:0 0 15px rgba(0,0,0,0.5);" onclick="event.stopPropagation()">
          <div style="position:absolute; top:-15px; right:-15px; background:#000; color:#fff; border:2px solid #fff; border-radius:50%; width:36px; height:36px; font-size:22px; line-height:32px; text-align:center; cursor:pointer; box-shadow:0 0 5px rgba(0,0,0,0.5);" onclick="this.parentElement.parentElement.remove()">&times;</div>
          <img src="${src}" style="max-width:90vw; max-height:80vh; display:block; margin:0 auto;">
          ${title ? '<div style="margin-top:10px; color:#333; font-weight:bold; font-size:14px; text-align:center;">'+title+'</div>' : ''}
        </div>
      </div>
    `;
    
    if (!document.getElementById('simpleImgModal')) {
      document.body.insertAdjacentHTML('beforeend', html);
    }
  }
});
