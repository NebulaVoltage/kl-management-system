/* =============================================
   KLH CANTEEN — canteen.js
   Row-based seat booking (cinema style)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // Auth guard
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Dark mode restore
    const darkToggle = document.getElementById('dark-mode-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (localStorage.getItem('klh_dark_mode') === 'true') {
        document.body.classList.add('dark');
        themeIcon.textContent = 'light_mode';
    }
    darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
        localStorage.setItem('klh_dark_mode', isDark);
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('studentId');
            window.location.href = 'login.html';
        });
    }

    // ─── CONFIG ───
    const ROWS = [
        { label: 'A', seats: 10 },
        { label: 'B', seats: 12 },
        { label: 'C', seats: 12 },
        { label: 'D', seats: 14 },
        { label: 'E', seats: 14 },
        { label: 'F', seats: 14 },
        { label: 'G', seats: 12 },
        { label: 'H', seats: 10 },
    ];
    const MAX_SELECT = 4;

    // ─── DOM REFS ───
    const seatGrid = document.getElementById('seat-grid');
    const timeSlotSelect = document.getElementById('time-slot-select');
    const resetBtn = document.getElementById('reset-seats-btn');
    const selectedCountEl = document.getElementById('selected-count');
    const summarySlotEl = document.getElementById('summary-slot');
    const confirmBtn = document.getElementById('confirm-booking-btn');

    const bookingModal = document.getElementById('booking-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalSlotInfo = document.getElementById('modal-slot-info');
    const modalBookingId = document.getElementById('modal-booking-id');
    const modalSeatsInfo = document.getElementById('modal-seats-info');

    // ─── STATE ───
    let canteenData = JSON.parse(localStorage.getItem('klh_canteen_rows')) || {};
    let currentSelection = []; // temp user picks before confirm

    function getSlotKey() { return timeSlotSelect.value; }

    function getOccupied() { return canteenData[getSlotKey()] || []; }

    function saveOccupied(seats) {
        canteenData[getSlotKey()] = seats;
        localStorage.setItem('klh_canteen_rows', JSON.stringify(canteenData));
    }

    function generateBookingId() {
        return 'KLH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // ─── RENDER ───
    function render() {
        seatGrid.innerHTML = '';
        currentSelection = [];
        updateSummary();

        const occupied = getOccupied();

        ROWS.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            // Row label left
            const labelLeft = document.createElement('span');
            labelLeft.className = 'row-label';
            labelLeft.textContent = row.label;
            rowDiv.appendChild(labelLeft);

            // Seats container
            const seatsDiv = document.createElement('div');
            seatsDiv.className = 'seats-container';

            for (let i = 0; i < row.seats; i++) {
                const seatId = `${row.label}${i + 1}`;
                const seat = document.createElement('button');
                seat.className = 'seat';
                seat.dataset.id = seatId;
                seat.title = seatId;

                // Add aisle gap after middle
                if (i === Math.floor(row.seats / 2) - 1) {
                    seat.style.marginRight = '20px';
                }

                if (occupied.includes(seatId)) {
                    seat.classList.add('occupied');
                    seat.disabled = true;
                }

                seat.addEventListener('click', () => toggleSeat(seat, seatId));
                seatsDiv.appendChild(seat);
            }

            rowDiv.appendChild(seatsDiv);

            // Row label right
            const labelRight = document.createElement('span');
            labelRight.className = 'row-label';
            labelRight.textContent = row.label;
            rowDiv.appendChild(labelRight);

            seatGrid.appendChild(rowDiv);
        });

        summarySlotEl.textContent = getSlotKey();
    }

    function toggleSeat(el, seatId) {
        if (el.classList.contains('occupied')) return;

        if (el.classList.contains('selected')) {
            el.classList.remove('selected');
            currentSelection = currentSelection.filter(s => s !== seatId);
        } else {
            if (currentSelection.length >= MAX_SELECT) {
                alert(`Maximum ${MAX_SELECT} seats per booking.`);
                return;
            }
            el.classList.add('selected');
            currentSelection.push(seatId);
        }
        updateSummary();
    }

    function updateSummary() {
        selectedCountEl.textContent = currentSelection.length;
        confirmBtn.disabled = currentSelection.length === 0;
    }

    // ─── CONFIRM BOOKING ───
    confirmBtn.addEventListener('click', () => {
        if (currentSelection.length === 0) return;

        const occupied = getOccupied();
        const merged = [...new Set([...occupied, ...currentSelection])];
        saveOccupied(merged);

        // Show modal
        modalSlotInfo.textContent = `Time: ${getSlotKey()}`;
        modalBookingId.textContent = generateBookingId();
        modalSeatsInfo.textContent = `Seats: ${currentSelection.join(', ')}`;
        bookingModal.classList.remove('hidden');

        render(); // re-render with newly occupied seats
    });

    modalCloseBtn.addEventListener('click', () => bookingModal.classList.add('hidden'));

    // ─── SLOT CHANGE ───
    timeSlotSelect.addEventListener('change', () => render());

    // ─── RESET ───
    resetBtn.addEventListener('click', () => {
        if (confirm(`Reset all booked seats for ${getSlotKey()}?`)) {
            saveOccupied([]);
            render();
        }
    });

    // ─── INIT ───
    render();
});
