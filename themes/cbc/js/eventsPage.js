// Events Page JavaScript
// Handles calendar view, list view, search, and event fetching

let allEvents = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentView = 'list';
let filteredEvents = [];
let isModalOpening = false; // Prevent multiple simultaneous modal opens
let dayEventClickHandler = null; // Store handler reference for cleanup
let modalOpeningLock = false; // Lock to prevent recursion
let eventListenersSetup = false; // Track if listeners are already set up
let escapeKeyHandler = null; // Store escape key handler reference
let modalClickHandler = null; // Store click handler reference
let currentPage = 1;
const itemsPerPage = 9;
let lastFocusedElement;

// Initialize events page
async function initializeEventsPage() {
  // Check if we're on the events page
  const eventsPage = document.querySelector('.events-page-container');
  if (!eventsPage) {
    // Page not loaded yet, wait a bit
    setTimeout(initializeEventsPage, 100);
    return;
  }

  // Verify modal exists - wait longer if needed
  let modal = document.getElementById('eventModal');
  let retries = 0;
  while (!modal && retries < 10) {
    await new Promise(resolve => setTimeout(resolve, 100));
    modal = document.getElementById('eventModal');
    retries++;
  }

  if (!modal) {
    console.error('Modal not found in DOM after retries!');
    return;
  }
  console.log('Modal found in DOM:', modal);

  setupEventListeners();
  await fetchEvents();
  // fetchEvents already calls renderCalendar() and renderEventList()

  // Set initial view state based on which view is displayed
  const listView = document.getElementById('listView');
  const calendarView = document.getElementById('calendarView');
  if (listView && listView.style.display !== 'none') {
    document.body.classList.add('list-view-active');
    document.body.classList.remove('calendar-view-active');
  } else if (calendarView && calendarView.style.display !== 'none') {
    document.body.classList.add('calendar-view-active');
    document.body.classList.remove('list-view-active');
  }

  switchView(currentView);
}

// Try to initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventsPage);
} else {
  // DOM already loaded
  setTimeout(initializeEventsPage, 100);
}

// Also initialize when page is loaded via router
if (window.router) {
  const originalInit = window.router.initializePageScripts;
  window.router.initializePageScripts = function () {
    if (originalInit) originalInit.call(this);
    if (this.currentRoute === '/events') {
      setTimeout(initializeEventsPage, 200);
    }
  };
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('eventSearchInput');
  if (searchInput) {
    // Remove old listener by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('input', handleSearch);
  }

  // Clear search button
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) {
    const newClearBtn = clearBtn.cloneNode(true);
    clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
    newClearBtn.addEventListener('click', clearSearch);
  }

  // View toggle buttons
  const calendarViewBtn = document.getElementById('calendarViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');

  if (calendarViewBtn) {
    const newCalendarViewBtn = calendarViewBtn.cloneNode(true);
    calendarViewBtn.parentNode.replaceChild(newCalendarViewBtn, calendarViewBtn);
    newCalendarViewBtn.addEventListener('click', () => switchView('calendar'));
  }
  if (listViewBtn) {
    const newListViewBtn = listViewBtn.cloneNode(true);
    listViewBtn.parentNode.replaceChild(newListViewBtn, listViewBtn);
    newListViewBtn.addEventListener('click', () => switchView('list'));
  }

  // Calendar navigation
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  if (prevMonthBtn) {
    const newPrevMonthBtn = prevMonthBtn.cloneNode(true);
    prevMonthBtn.parentNode.replaceChild(newPrevMonthBtn, prevMonthBtn);
    newPrevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  }
  if (nextMonthBtn) {
    const newNextMonthBtn = nextMonthBtn.cloneNode(true);
    nextMonthBtn.parentNode.replaceChild(newNextMonthBtn, nextMonthBtn);
    newNextMonthBtn.addEventListener('click', () => navigateMonth(1));
  }

  // Modal close handlers - only set up once
  if (!eventListenersSetup) {
    setupModalCloseHandlers();
    eventListenersSetup = true;
  }
}

function setupModalCloseHandlers() {
  // Remove old escape key handler if exists
  if (escapeKeyHandler) {
    document.removeEventListener('keydown', escapeKeyHandler);
  }

  // Create new escape key handler
  escapeKeyHandler = function (e) {
    if (e.key === 'Escape' && !modalOpeningLock) {
      const modal = document.getElementById('eventModal');
      if (modal && modal.classList.contains('active')) {
        e.preventDefault();
        e.stopPropagation();
        closeEventModal();
      }
    }
  };

  // Add escape key handler once
  document.addEventListener('keydown', escapeKeyHandler);

  // Remove old click handler if exists
  if (modalClickHandler) {
    document.removeEventListener('click', modalClickHandler, true);
  }

  // Create new click handler for modal close
  modalClickHandler = function (e) {
    // Check if click is on backdrop
    if (e.target.id === 'eventModalBackdrop' || e.target.closest('#eventModalBackdrop')) {
      const modal = document.getElementById('eventModal');
      if (modal && modal.classList.contains('active') && !modalOpeningLock) {
        e.preventDefault();
        e.stopPropagation();
        closeEventModal();
        return false;
      }
    }

    // Check if click is on close button
    if (e.target.id === 'eventModalClose' || e.target.closest('#eventModalClose')) {
      const modal = document.getElementById('eventModal');
      if (modal && modal.classList.contains('active') && !modalOpeningLock) {
        e.preventDefault();
        e.stopPropagation();
        closeEventModal();
        return false;
      }
    }
  };

  // Add click handler once with capture phase
  document.addEventListener('click', modalClickHandler, true);
}

async function fetchEvents() {
  const loadingSpinner = document.getElementById('eventsLoadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'flex';
  }

  try {
    // Check if we have pre-loaded event data
    if (typeof CBC_EVENTS_DATA !== 'undefined' && Array.isArray(CBC_EVENTS_DATA)) {
      console.log('Loading events from static data file:', CBC_EVENTS_DATA.length);

      allEvents = CBC_EVENTS_DATA.map((evt, index) => {
        return {
          id: `event-${index}`,
          title: evt.title,
          description: evt.description,
          date: parseEventDate(evt.date),
          dateText: evt.date,
          image: evt.image,
          link: evt.link,
          venue: 'Capacity Building Commission' // Default venue as it's not always in scraped data
        };
      });
    } else {
      // Try to fetch from CBC website (will likely fail due to CORS)
      const response = await fetch('https://cbc.gov.in/event', {
        mode: 'cors',
        headers: { 'Accept': 'text/html' }
      });

      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        allEvents = parseEventsFromHTML(doc);
      } else {
        throw new Error('Failed to fetch events');
      }
    }
  } catch (error) {
    console.warn('Could not fetch events, using sample data:', error);
    allEvents = getSampleEvents();
  }

  if (loadingSpinner) {
    loadingSpinner.style.display = 'none';
  }

  filteredEvents = [...allEvents];
  renderCalendar();
  renderEventList();
}

function parseEventsFromHTML(doc) {
  const events = [];

  // Try to find event items in the HTML
  // This is a simplified parser - adjust based on actual HTML structure
  const eventItems = doc.querySelectorAll('.event-item, .views-row, article, .event-card');

  eventItems.forEach((item, index) => {
    const titleEl = item.querySelector('h3, h2, .title, .event-title');
    const dateEl = item.querySelector('.date, .event-date, time');
    const descEl = item.querySelector('p, .description, .event-description');
    const imgEl = item.querySelector('img');

    if (titleEl) {
      const title = titleEl.textContent.trim();
      const description = descEl ? descEl.textContent.trim() : '';
      const dateText = dateEl ? dateEl.textContent.trim() : '';
      const image = imgEl ? imgEl.src : '';

      // Parse date
      const eventDate = parseEventDate(dateText);

      events.push({
        id: `event-${index}`,
        title: title,
        description: description,
        date: eventDate,
        dateText: dateText,
        image: image,
        link: item.querySelector('a') ? item.querySelector('a').href : ''
      });
    }
  });

  return events.length > 0 ? events : getSampleEvents();
}

function parseEventDate(dateText) {
  // Try to parse various date formats
  // Examples: "07 November 2025", "16 October 2025", etc.
  const months = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };

  const dateMatch = dateText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthName = dateMatch[2].toLowerCase();
    const year = parseInt(dateMatch[3]);
    const month = months[monthName];

    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // Fallback to current date if parsing fails
  return new Date();
}

function getSampleEvents() {
  // Sample events based on the CBC website content
  const events = [
    {
      id: 'event-1',
      title: 'The Capacity Building Commission organised the mass singing of \'Vande Mataram\' today, joining the nationwide commemoration marking 150 years of India\'s National Song',
      description: 'The Capacity Building Commission organised the mass singing of \'Vande Mataram\' today, joining the nationwide commemoration marking 150 years of India\'s National Song. The Capacity Building Commission organised the mass singing of \'Vande Mataram\' today, joining the nationwide commemoration marking 150 years of India\'s National Song.',
      date: new Date(2025, 10, 7), // November 7, 2025 (month is 0-indexed, so 10 = November)
      dateText: '07 November 2025',
      image: 'img/latest_events/Vande_Mataram.jpeg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-2',
      title: 'Samuchik charcha on vigilance awareness week at CBC',
      description: 'As part of the Vigilance Awareness Week 2025, being observed from 27th October to 2nd November, the Capacity Building Commission (CBC) organized a #SamuhikCharcha on the theme "Vigilance: Our Shared Responsibility."',
      date: new Date(2025, 9, 31), // October 31, 2025
      dateText: '31 October 2025',
      image: 'img/latest_events/Samuhik_charcha1.jpeg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-3',
      title: 'Rashtriya Ekta Diwas 2025',
      description: 'On the occasion of #RashtriyaEktaDiwas 2025, officers and staff of the Capacity Building Commission, took the Integrity Pledge, reaffirming their commitment to uphold unity, integrity and security of the nation.',
      date: new Date(2025, 9, 31), // October 31, 2025
      dateText: '31 October 2025',
      image: 'img/event1.jpg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-4',
      title: 'Capacity Building Commission (CBC), in collaboration with LBSNAA and Karmayogi Bharat, organized a workshop',
      description: 'Capacity Building Commission (CBC), in collaboration with Lal Bahadur Shastri National Academy of Administration (LBSNAA) and Karmayogi Bharat, organized a workshop',
      date: new Date(2025, 9, 16), // October 16, 2025
      dateText: '16 October 2025',
      image: 'img/event1.jpg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-5',
      title: 'Signing of a tripartite MoU between the Capacity Building Commission, the School of Ultimate Leadership, and the Government of Gujarat',
      description: 'It is our privilege to announce the signing of a tripartite MoU between the Capacity Building Commission, the School of Ultimate Leadership, and the Government of Gujarat',
      date: new Date(2025, 9, 1), // October 1, 2025
      dateText: '01 October 2025',
      image: 'img/event2.jpeg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-6',
      title: 'Dr. R Balasubramaniam, Member HR, Capacity Building Commission, and the team visited AIIMS, Delhi',
      description: 'Dr. R Balasubramaniam, Member HR, Capacity Building Commission, and the team visited AIIMS, Delhi.',
      date: new Date(2025, 8, 30), // September 30, 2025
      dateText: '30 September 2025',
      image: 'img/event3.jpeg',
      venue: 'AIIMS, Delhi',
      link: ''
    },
    {
      id: 'event-7',
      title: 'Workshop on Developing State-Level Capacity Building Plans',
      description: 'ATIs to function as Catalysts in State-Level Capacity Building. The 2-day workshop on \'Developing State-Level Capacity Building Plans\' brought ATIs as key stakeholders of capacity building in states.',
      date: new Date(2025, 8, 25), // September 25, 2025
      dateText: '25 September 2025',
      image: 'img/event4.jpeg',
      venue: 'Capacity Building Commission',
      link: ''
    },
    {
      id: 'event-8',
      title: 'Catalysing Capacity Building in States: Workshop on Developing State-Level Capacity Building Plans',
      description: 'The Workshop on \'Developing State-Level Capacity Building Plans\' was inaugurated by Hon\'ble MoS (PP) Dr Jitendra Singh at CSOI, Vinay Marg today, who called for a future-ready, citizen-centric civil service built on continuous learning.',
      date: new Date(2025, 8, 24), // September 24, 2025
      dateText: '24 September 2025',
      image: 'img/event5.jpeg',
      venue: 'CSOI, Vinay Marg',
      link: ''
    },
    {
      id: 'event-9',
      title: 'A tripartite Memorandum of Understanding (MoU) was signed between the Capacity Building Commission (CBC), Karmayogi Bharat, and the Government of Manipur',
      description: 'In a significant step for strengthening public service in Manipur, a tripartite Memorandum of Understanding (MoU) was signed today (23 September 2025)',
      date: new Date(2025, 8, 23), // September 23, 2025
      dateText: '23 September 2025',
      image: 'img/event2.jpeg',
      venue: 'Capacity Building Commission',
      link: ''
    }
  ];

  console.log('Sample events created:', events.length);
  events.forEach(event => {
    console.log('Event:', event.title, 'Date:', event.date, 'Parsed date:', new Date(event.date));
  });

  return events;
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const clearBtn = document.getElementById('searchClearBtn');

  if (clearBtn) {
    clearBtn.style.display = searchTerm ? 'block' : 'none';
  }

  if (!searchTerm) {
    filteredEvents = [...allEvents];
  } else {
    filteredEvents = allEvents.filter(event => {
      return event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm);
    });
  }

  renderCalendar();
  renderEventList();
}

function clearSearch() {
  const searchInput = document.getElementById('eventSearchInput');
  const clearBtn = document.getElementById('searchClearBtn');

  if (searchInput) {
    searchInput.value = '';
  }
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }

  filteredEvents = [...allEvents];
  renderCalendar();
  renderEventList();
}

function switchView(view) {
  currentView = view;

  const calendarView = document.getElementById('calendarView');
  const listView = document.getElementById('listView');
  const calendarViewBtn = document.getElementById('calendarViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');

  if (view === 'calendar') {
    if (calendarView) calendarView.style.display = 'block';
    if (listView) listView.style.display = 'none';
    if (calendarViewBtn) calendarViewBtn.classList.add('active');
    if (listViewBtn) listViewBtn.classList.remove('active');
    document.body.classList.remove('list-view-active');
    document.body.classList.add('calendar-view-active');
  } else {
    if (calendarView) calendarView.style.display = 'none';
    if (listView) listView.style.display = 'block';
    if (calendarViewBtn) calendarViewBtn.classList.remove('active');
    if (listViewBtn) listViewBtn.classList.add('active');
    document.body.classList.add('list-view-active');
    document.body.classList.remove('calendar-view-active');
  }
}

function navigateMonth(direction) {
  currentMonth += direction;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  renderCalendar();
}

function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const monthYearEl = document.getElementById('calendarMonthYear');

  if (!calendarGrid) {
    console.error('calendarGrid not found');
    return;
  }

  console.log('Rendering calendar with', filteredEvents.length, 'events');
  console.log('Events data:', filteredEvents);

  // Update month/year display
  if (monthYearEl) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }

  // Clear calendar
  calendarGrid.innerHTML = '';

  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyCell);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.dataset.day = day;
    dayCell.dataset.month = currentMonth;
    dayCell.dataset.year = currentYear;

    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);

    // Check if there are events on this day
    const dayDate = new Date(currentYear, currentMonth, day);
    const dayEvents = filteredEvents.filter(event => {
      if (!event || !event.date) return false;
      const eventDate = new Date(event.date);
      const matches = eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear;
      return matches;
    });

    if (dayEvents.length > 0) {
      console.log(`Day ${day}: Found ${dayEvents.length} event(s)`, dayEvents.map(e => e.title));
    }

    // Highlight today
    const today = new Date();
    if (day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()) {
      dayCell.classList.add('today');
    }

    if (dayEvents.length > 0) {
      dayCell.classList.add('has-events');
      const eventIndicator = document.createElement('div');
      eventIndicator.className = 'event-indicator';
      eventIndicator.textContent = dayEvents.length;
      // Make sure indicator doesn't block clicks
      eventIndicator.style.pointerEvents = 'none';
      dayCell.appendChild(eventIndicator);

      // Store events data on the element
      dayCell.dataset.hasEvents = 'true';
      dayCell.dataset.eventsCount = dayEvents.length;

      // Store events in closure for click handler
      const eventsForDay = [...dayEvents]; // Copy array
      const dateForDay = new Date(dayDate);

      // Add click handler to show events
      const clickHandler = function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log('Calendar day clicked:', day, 'Events:', eventsForDay.length);

        if (eventsForDay && eventsForDay.length > 0) {
          console.log('Calling showDayEvents with', eventsForDay.length, 'events');

          // Call async function
          showDayEvents(eventsForDay, dateForDay).catch(err => {
            console.error('Error in showDayEvents:', err);
            alert('Error opening event dialog: ' + err.message);
          });
        } else {
          console.warn('No events found for clicked day');
        }
        return false;
      };

      // Attach click handler only once
      dayCell.addEventListener('click', clickHandler);

      // Also attach keyboard handler for accessibility
      dayCell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler(e);
        }
      });

      // Make it clear this is clickable
      dayCell.setAttribute('role', 'button');
      dayCell.setAttribute('tabindex', '0');
      dayCell.setAttribute('aria-label', `${dayEvents.length} event(s) on this day`);

      // Make sure the cell and all children are clickable
      dayCell.style.cursor = 'pointer';
      dayCell.style.pointerEvents = 'auto';
      dayCell.style.userSelect = 'none';

      // Make sure child elements don't block clicks
      const dayNumberEl = dayCell.querySelector('.day-number');
      if (dayNumberEl) {
        dayNumberEl.style.pointerEvents = 'none';
      }
    } else {
      // Days without events are not clickable
      dayCell.style.cursor = 'default';
      dayCell.style.pointerEvents = 'auto';
    }

    calendarGrid.appendChild(dayCell);
  }
}

async function showDayEvents(events, date) {
  console.log('showDayEvents called with:', events.length, 'events', 'date:', date);

  if (!events || events.length === 0) {
    console.warn('No events provided to showDayEvents');
    alert('No events found for this date.');
    return;
  }

  // Wait a bit to ensure modal is in DOM
  let modalBody = document.getElementById('eventModalBody');
  let modal = document.getElementById('eventModal');

  // Retry if not found
  let retries = 0;
  while ((!modalBody || !modal) && retries < 10) {
    console.log('Modal not found, retrying...', retries);
    await new Promise(resolve => setTimeout(resolve, 50));
    modalBody = document.getElementById('eventModalBody');
    modal = document.getElementById('eventModal');
    retries++;
  }

  console.log('Modal elements after retry:', { modalBody: !!modalBody, modal: !!modal });

  if (!modalBody) {
    console.error('eventModalBody not found in DOM after retries');
    alert('Error: Modal body not found. Please refresh the page.');
    return;
  }

  if (!modal) {
    console.error('eventModal not found in DOM after retries');
    alert('Error: Modal not found. Please refresh the page.');
    return;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (events.length === 1) {
    // Navigate to event details page for single event
    const event = events[0];
    localStorage.setItem('currentEvent', JSON.stringify(event));
    window.location.href = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;
    return;
  } else {
    // Show list of events for the day with full information
    modalBody.innerHTML = `
        <div class="day-events-header">
          <h2 class="event-modal-title" id="eventModalTitle">Events on ${dateStr}</h2>
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

    // Open modal after setting content
    setTimeout(() => {
      if (!modalOpeningLock) {
        openEventModal();
      }
    }, 50);

    // Add click handlers to day event items - use event delegation instead
    setTimeout(() => {
      // Remove old handler if exists
      if (dayEventClickHandler) {
        modalBody.removeEventListener('click', dayEventClickHandler);
      }

      // Create new handler using event delegation
      dayEventClickHandler = (e) => {
        const dayEventItem = e.target.closest('.day-event-item');
        if (!dayEventItem) return;

        e.preventDefault();
        e.stopPropagation();

        const idx = parseInt(dayEventItem.dataset.eventIndex);
        if (isNaN(idx) || idx < 0 || idx >= events.length) {
          console.error('Invalid event index:', idx);
          return;
        }

        console.log('Day event item clicked, navigating to event:', idx);

        // Navigate to event details page
        const event = events[idx];
        localStorage.setItem('currentEvent', JSON.stringify(event));
        window.location.href = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;
      };

      // Add new handler
      modalBody.addEventListener('click', dayEventClickHandler);
    }, 100);
  }
}

function renderEventList() {
  const eventsList = document.getElementById('eventsList');
  const noEventsMessage = document.getElementById('noEventsMessage');

  if (!eventsList) return;

  eventsList.innerHTML = '';

  if (filteredEvents.length === 0) {
    if (noEventsMessage) noEventsMessage.style.display = 'block';

    // Clear pagination if no events
    const existingPagination = document.querySelector('.pagination-container');
    if (existingPagination) existingPagination.remove();

    return;
  }

  if (noEventsMessage) noEventsMessage.style.display = 'none';

  // Sort events by date (descending)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);

  // Ensure current page is valid
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedEvents.length);
  const eventsToShow = sortedEvents.slice(startIndex, endIndex);

  eventsToShow.forEach(event => {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-list-card';

    const eventDate = new Date(event.date);
    // Format: 09 December 2025
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    eventCard.innerHTML = `
      <div class="event-list-image">
        <img src="${event.image || 'img/event1.jpg'}" alt="${event.title}" onerror="this.src='img/event1.jpg'">
      </div>
      <div class="event-list-content">
        <h3 class="event-list-title">${event.title}</h3>
        <p class="event-list-description">${event.description}</p>
        
        <div class="event-card-footer">
          <div class="event-list-date">
            ${formattedDate}
          </div>
          <button class="event-list-read-more">
            Know Details
          </button>
        </div>
      </div>
    `;

    // Attach click handler to card (except when clicking links)
    eventCard.addEventListener('click', (e) => {
      // Don't trigger if text selection
      if (window.getSelection().toString().length > 0) return;

      // Store event data in localStorage for the details page
      localStorage.setItem('currentEvent', JSON.stringify(event));
      // Navigate to event details page
      window.location.href = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;
    });

    eventsList.appendChild(eventCard);
  });

  // Render pagination controls
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  // Remove existing pagination if any
  const existingPagination = document.querySelector('.pagination-container');
  if (existingPagination) existingPagination.remove();

  if (totalPages <= 1) return;

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination-container';

  // Logic to show pages
  // We want: 1 2 3 4 5 ... Last
  // Simpler version for now: Just show all numbers if < 10, otherwise shortened

  let pagesToDisplay = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pagesToDisplay.push(i);
  } else {
    // Always show 1
    pagesToDisplay.push(1);

    // Show current-1, current, current+1
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust if near start
    if (currentPage <= 4) {
      end = 5;
      start = 2;
    }

    // Adjust if near end
    if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    if (start > 2) pagesToDisplay.push('...');

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) pagesToDisplay.push(i);
    }

    if (end < totalPages - 1) pagesToDisplay.push('...');

    // Always show last
    if (totalPages > 1) pagesToDisplay.push(totalPages);
  }

  // Allow simple full list for now based on user request "1 2 3 ... >> Last"
  // Let's implement a simpler "All pages" approach if count is small, or just max 10

  // Re-implementing strictly based on user image perception: 1 2 3 4 5 6 7 8 9 ... >> Last >>

  paginationContainer.innerHTML = '';

  // Generate buttons
  pagesToDisplay.forEach(p => {
    if (p === '...') {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.alignSelf = 'center';
      paginationContainer.appendChild(span);
    } else {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${p === currentPage ? 'active' : ''}`;
      btn.textContent = p;
      btn.onclick = () => {
        currentPage = p;
        renderEventList();
        // Scroll to top of list
        const listContainer = document.querySelector('.events-list-view');
        if (listContainer) listContainer.scrollIntoView({ behavior: 'smooth' });
      };
      paginationContainer.appendChild(btn);
    }
  });

  // Last button
  if (currentPage < totalPages) {
    const lastBtn = document.createElement('button');
    lastBtn.className = 'pagination-btn wide-btn';
    lastBtn.innerHTML = 'Last &raquo;';
    lastBtn.onclick = () => {
      currentPage = totalPages;
      renderEventList();
      const listContainer = document.querySelector('.events-list-view');
      if (listContainer) listContainer.scrollIntoView({ behavior: 'smooth' });
    };
    paginationContainer.appendChild(lastBtn);
  }

  // Append after eventsList
  const eventsListView = document.getElementById('listView');
  if (eventsListView) {
    eventsListView.appendChild(paginationContainer);
  }
}

function showEventModal(event) {
  console.log('showEventModal called with event:', event);

  // Prevent multiple simultaneous calls
  if (modalOpeningLock) {
    console.log('Modal opening lock active, ignoring showEventModal call');
    return;
  }

  const modalBody = document.getElementById('eventModalBody');
  const modal = document.getElementById('eventModal');

  if (!modalBody) {
    console.error('eventModalBody not found in showEventModal');
    alert('Error: Modal body not found');
    return;
  }

  if (!modal) {
    console.error('eventModal not found in showEventModal');
    alert('Error: Modal not found');
    return;
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  console.log('Setting modal content, formatted date:', formattedDate);

  // Close modal first if it's open
  if (modal.classList.contains('active')) {
    closeEventModal();
    // Wait a bit before setting new content
    setTimeout(() => {
      setModalContentAndOpen(modalBody, modal, event, formattedDate);
    }, 150);
  } else {
    setModalContentAndOpen(modalBody, modal, event, formattedDate);
  }
}

function setModalContentAndOpen(modalBody, modal, event, formattedDate) {
  // Prevent if lock is active
  if (modalOpeningLock) {
    console.log('Modal opening lock active, skipping setModalContentAndOpen');
    return;
  }

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
      <h2 class="event-modal-title" id="eventModalTitle">${event.title}</h2>
      <div class="event-modal-description">
        <p>${event.description}</p>
      </div>
    </div>
  `;

  console.log('Modal content set, calling openEventModal');

  // Open modal after setting content
  setTimeout(() => {
    if (!modalOpeningLock) {
      openEventModal();
    }
  }, 50);
}

function openEventModal() {
  // Prevent recursion - check lock first
  if (modalOpeningLock) {
    console.log('Modal opening lock active, ignoring call');
    return;
  }

  const modal = document.getElementById('eventModal');
  if (!modal) {
    console.error('Modal element not found in openEventModal');
    return;
  }

  // If already open and visible, just return
  const isActive = modal.classList.contains('active');
  const isVisible = modal.style.display === 'flex' || window.getComputedStyle(modal).display === 'flex';
  if (isActive && isVisible) {
    console.log('Modal already active and visible, skipping');
    return;
  }

  // Set lock immediately to prevent recursion
  modalOpeningLock = true;

  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    try {
      // Save focus
      lastFocusedElement = document.activeElement;

      // Ensure ARIA attributes are present
      if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
      if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
      if (!modal.hasAttribute('aria-labelledby')) modal.setAttribute('aria-labelledby', 'eventModalTitle');

      // Force show the modal
      modal.classList.add('active');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.zIndex = '99999';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      document.body.style.overflow = 'hidden';

      // Set focus to the close button
      const closeBtn = document.getElementById('eventModalClose');
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
      }

      console.log('Modal opened successfully');
    } catch (error) {
      console.error('Error opening modal:', error);
    } finally {
      // Release lock after a delay
      setTimeout(() => {
        modalOpeningLock = false;
      }, 300);
    }
  });
}

function closeEventModal() {
  // Prevent closing if we're in the process of opening
  if (modalOpeningLock) {
    console.log('Modal opening in progress, ignoring close');
    return;
  }

  const modal = document.getElementById('eventModal');
  if (modal && modal.classList.contains('active')) {
    modal.classList.remove('active');
    // Reset all inline styles that were set when opening
    modal.style.display = '';
    modal.style.visibility = '';
    modal.style.opacity = '';
    modal.style.zIndex = '';
    modal.style.position = '';
    modal.style.top = '';
    modal.style.left = '';
    modal.style.width = '';
    modal.style.height = '';
    document.body.style.overflow = '';

    // Restore focus
    if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
      lastFocusedElement.focus();
    }

    console.log('Modal closed');
  }
}

// Make showEventModal available globally for inline onclick handlers
window.showEventModal = function (event) {
  if (typeof event === 'string') {
    try {
      event = JSON.parse(event.replace(/&quot;/g, '"'));
    } catch (e) {
      console.error('Error parsing event:', e);
      return;
    }
  }
  showEventModal(event);
};

// Test function to verify modal works - also available globally
window.testModal = function () {
  console.log('Test modal called (window.testModal)');

  // Check if modal exists
  const modal = document.getElementById('eventModal');
  const modalBody = document.getElementById('eventModalBody');

  console.log('Modal check:', { modal: !!modal, modalBody: !!modalBody });

  if (!modal || !modalBody) {
    alert('Modal not found in DOM! Modal: ' + !!modal + ', ModalBody: ' + !!modalBody);
    return;
  }

  const testEvent = {
    id: 'test-1',
    title: 'Test Event - Modal Working!',
    description: 'If you can see this, the modal is working correctly. This means the modal system is functional.',
    date: new Date(),
    dateText: new Date().toLocaleDateString(),
    image: 'img/event1.jpg',
    venue: 'Test Venue'
  };

  console.log('Calling showEventModal with:', testEvent);
  showEventModal(testEvent);
};

// Make sure testModal is available
if (typeof window.testModal === 'undefined') {
  window.testModal = window.testModal || function () {
    alert('testModal function not properly loaded');
  };
}

