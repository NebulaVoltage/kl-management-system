/* ============================================================
   app.js — Main Application Module
   Imports calculator.js, handles form validation, dashboard
   rendering, and canteen seat booking with localStorage.
   ============================================================ */

import {
    calculatePercentage,
    calculateSafeToMiss,
    calculateNeedToAttend
} from './calculator.js';

/* ============================================================
   DOM References
   ============================================================ */
const attendanceForm      = document.getElementById('attendance-form');
const courseNameInput      = document.getElementById('course-name');
const conductedInput       = document.getElementById('total-conducted');
const attendedInput        = document.getElementById('total-attended');
const courseNameError       = document.getElementById('course-name-error');
const conductedError       = document.getElementById('conducted-error');
const attendedError        = document.getElementById('attended-error');
const dashboardContainer   = document.getElementById('dashboard-container');
const dashboardEmpty       = document.getElementById('dashboard-empty');
const clearDashboardBtn    = document.getElementById('clear-dashboard-btn');
const seatGrid             = document.getElementById('seat-grid');
const canteenLoading       = document.getElementById('canteen-loading');
const resetSeatsBtn        = document.getElementById('reset-seats-btn');
const navLinks             = document.querySelectorAll('.nav-link');

/* ============================================================
   1. NAVIGATION — Active link highlighting
   ============================================================ */
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        navLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
    });
});

/* ============================================================
   2. FORM VALIDATION & SUBMISSION (Tasks 3 & 5)
   ============================================================ */

/** Clear all error messages */
const clearErrors = () => {
    courseNameError.textContent = '';
    conductedError.textContent = '';
    attendedError.textContent  = '';
    [courseNameInput, conductedInput, attendedInput].forEach(el =>
        el.classList.remove('input-error')
    );
};

/** Validate form inputs; returns true if valid */
const validateForm = () => {
    let isValid = true;
    clearErrors();

    const courseName = courseNameInput.value.trim();
    const conducted  = parseInt(conductedInput.value, 10);
    const attended   = parseInt(attendedInput.value, 10);

    // Course name
    if (!courseName || courseName.length < 2) {
        courseNameError.textContent = 'Please enter a valid course name (min 2 characters).';
        courseNameInput.classList.add('input-error');
        isValid = false;
    }

    // Conducted
    if (isNaN(conducted) || conducted < 1) {
        conductedError.textContent = 'Total conducted must be at least 1.';
        conductedInput.classList.add('input-error');
        isValid = false;
    }

    // Attended
    if (isNaN(attended) || attended < 0) {
        attendedError.textContent = 'Total attended cannot be negative.';
        attendedInput.classList.add('input-error');
        isValid = false;
    }

    // Attended > Conducted
    if (!isNaN(attended) && !isNaN(conducted) && attended > conducted) {
        attendedError.textContent = 'Attended cannot be greater than Conducted!';
        attendedInput.classList.add('input-error');
        isValid = false;
    }

    return isValid;
};

/** Handle form submission */
attendanceForm.addEventListener('submit', (e) => {
    e.preventDefault();  // Prevent default page reload

    if (!validateForm()) return;

    const courseName = courseNameInput.value.trim();
    const conducted  = parseInt(conductedInput.value, 10);
    const attended   = parseInt(attendedInput.value, 10);

    // Run calculations
    const percentage    = calculatePercentage(attended, conducted);
    const safeToMiss    = calculateSafeToMiss(attended, conducted);
    const needToAttend  = calculateNeedToAttend(attended, conducted);

    // Create and render the course card
    renderCourseCard({ courseName, conducted, attended, percentage, safeToMiss, needToAttend });

    // Reset form
    attendanceForm.reset();
    clearErrors();
});

/* ============================================================
   3. DASHBOARD — Dynamic Card Rendering (Task 5)
   ============================================================ */

/** Determine status tier from percentage */
const getStatus = (percentage) => {
    if (percentage >= 75) return 'safe';
    if (percentage >= 65) return 'warning';
    return 'danger';
};

/**
 * Dynamically create and append a course card to the dashboard.
 * @param {Object} data - Course calculation results
 */
const renderCourseCard = (data) => {
    const { courseName, conducted, attended, percentage, safeToMiss, needToAttend } = data;
    const status = getStatus(percentage);

    // Hide empty state, show clear button
    dashboardEmpty.style.display = 'none';
    clearDashboardBtn.style.display = 'inline-flex';

    // Build card element
    const card = document.createElement('div');
    card.className = `course-card status-${status}`;

    // Verdict text
    let verdictHTML = '';
    if (status === 'safe') {
        verdictHTML = `<div class="card-verdict verdict-safe">✅ You can safely miss <strong>${safeToMiss}</strong> more class${safeToMiss !== 1 ? 'es' : ''}</div>`;
    } else if (status === 'warning') {
        if (needToAttend > 0) {
            verdictHTML = `<div class="card-verdict verdict-warning">⚠️ Attend next <strong>${needToAttend}</strong> class${needToAttend !== 1 ? 'es' : ''} to reach 75%</div>`;
        } else {
            verdictHTML = `<div class="card-verdict verdict-warning">⚠️ Borderline — avoid missing classes</div>`;
        }
    } else {
        verdictHTML = `<div class="card-verdict verdict-danger">🚨 Must attend <strong>${needToAttend}</strong> class${needToAttend !== 1 ? 'es' : ''} to reach 75%</div>`;
    }

    card.innerHTML = `
        <div class="card-title">${escapeHTML(courseName)}</div>
        <div class="card-percentage ${status}">${percentage}%</div>
        <div class="card-stats">
            <span>Conducted: <strong>${conducted}</strong></span>
            <span>Attended: <strong>${attended}</strong></span>
        </div>
        ${verdictHTML}
    `;

    // Animate in
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    dashboardContainer.appendChild(card);

    requestAnimationFrame(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // Scroll to dashboard
    document.getElementById('dashboard-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Escape HTML to prevent XSS */
const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/** Clear all dashboard cards */
clearDashboardBtn.addEventListener('click', () => {
    // Remove all course cards
    const cards = dashboardContainer.querySelectorAll('.course-card');
    cards.forEach(card => card.remove());

    // Show empty state, hide clear button
    dashboardEmpty.style.display = '';
    clearDashboardBtn.style.display = 'none';
});

/* ============================================================
   4. CANTEEN — Seat Booking with localStorage (Tasks 6-9)
   ============================================================ */

const SEAT_COUNT       = 50;
const STORAGE_KEY      = 'canteen_seats';

/* --- Task 6: Initialize seat data in localStorage --- */

/**
 * Initialize an array of 50 seat objects and save to localStorage
 * if not already present.
 */
const initializeSeats = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const seats = Array.from({ length: SEAT_COUNT }, (_, i) => ({
            id: i + 1,
            status: 'available'   // 'available' or 'booked'
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
    }
};

/* --- Task 7: Simulated API fetch using Promise + setTimeout --- */

/**
 * Fetch seat data from localStorage, wrapped in a Promise with
 * a simulated network delay (setTimeout).
 * @returns {Promise<Array>} Resolves with the seat data array
 */
const fetchSeats = () => {
    return new Promise((resolve, reject) => {
        // Show loading state
        canteenLoading.classList.remove('hidden');
        seatGrid.classList.add('hidden');

        setTimeout(() => {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                if (!data) {
                    reject(new Error('No seat data found in storage.'));
                    return;
                }
                const seats = JSON.parse(data);
                resolve(seats);
            } catch (error) {
                reject(error);
            }
        }, 1200); // Simulate 1.2s API delay
    });
};

/* --- Task 8: Render the seat grid --- */

/**
 * Render 50 square div elements into the seat grid container.
 * Colors: green = available, red = booked.
 * @param {Array} seats - Array of seat objects
 */
const renderSeatGrid = (seats) => {
    // Clear existing content
    seatGrid.innerHTML = '';

    seats.forEach(seat => {
        const seatEl = document.createElement('div');
        seatEl.className = `seat ${seat.status}`;
        seatEl.dataset.seatId = seat.id;
        seatEl.textContent = seat.id;
        seatEl.title = seat.status === 'available'
            ? `Seat ${seat.id} — Click to book`
            : `Seat ${seat.id} — Booked`;
        seatGrid.appendChild(seatEl);
    });

    // Hide loading, show grid
    canteenLoading.classList.add('hidden');
    seatGrid.classList.remove('hidden');
};

/* --- Task 9: Event delegation for seat booking --- */

/**
 * Event listener on the seat grid using event delegation.
 * When a green (available) seat is clicked:
 *   1. Update the seat object to 'booked'
 *   2. Save updated array back to localStorage
 *   3. Change the seat's color to red on screen
 */
seatGrid.addEventListener('click', (e) => {
    const seatEl = e.target.closest('.seat');
    if (!seatEl) return;

    // Only allow booking available seats
    if (seatEl.classList.contains('booked')) return;

    const seatId = parseInt(seatEl.dataset.seatId, 10);

    // Update localStorage
    const seats = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const seatObj = seats.find(s => s.id === seatId);
    if (seatObj) {
        seatObj.status = 'booked';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
    }

    // Update DOM
    seatEl.classList.remove('available');
    seatEl.classList.add('booked');
    seatEl.title = `Seat ${seatId} — Booked`;

    // Micro-animation feedback
    seatEl.style.transform = 'scale(0.85)';
    setTimeout(() => {
        seatEl.style.transform = '';
    }, 200);
});

/* --- Reset all seats --- */
resetSeatsBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    initializeSeats();
    loadCanteen();
});

/* --- Boot canteen --- */
const loadCanteen = () => {
    fetchSeats()
        .then(seats => renderSeatGrid(seats))
        .catch(err => {
            canteenLoading.innerHTML = `<p style="color:var(--clr-danger);">Error: ${err.message}</p>`;
        });
};

/* ============================================================
   5. INITIALIZATION
   ============================================================ */
initializeSeats();
loadCanteen();
