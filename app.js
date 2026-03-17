/* =============================================
   KLH STUDENT PORTAL — app.js
   ============================================= */

// ── GEMINI API KEY ──────────────────────────────
const GEMINI_API_KEY = 'AIzaSyBkJpfivsIIYQkDK7rdMo7JXrZuWNSStsk';
// ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // 0. ROUTE GUARD — AUTHENTICATION CHECK
    // =============================================
    if (localStorage.getItem('isAuthenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const studentId = localStorage.getItem('studentId') || 'Scholar';

    // Dynamic greeting
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.textContent = `Hey there, ${studentId}! 👋`;

    // Update username in header
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) userNameDisplay.textContent = studentId;

    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('studentId');
            window.location.href = 'login.html';
        });
    }

    // =============================================
    // 1. DARK MODE TOGGLE
    // =============================================
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

    // =============================================
    // 2. LIVE REAL-TIME CLOCK
    // =============================================
    const clockEl = document.getElementById('live-clock');

    function updateClock() {
        const now = new Date();
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        clockEl.textContent = `${h}:${m} ${ampm}`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // =============================================
    // 3. SEARCH BAR — FILTER CARDS
    // =============================================
    const searchInput = document.getElementById('dashboard-search');
    const allCards = document.querySelectorAll('.widget.card');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        allCards.forEach(card => {
            const name = (card.dataset.cardName || '').toLowerCase();
            const text = card.textContent.toLowerCase();
            if (!query || name.includes(query) || text.includes(query)) {
                card.classList.remove('search-hidden');
            } else {
                card.classList.add('search-hidden');
            }
        });
    });

    // =============================================
    // 4. SIDEBAR NAVIGATION
    // =============================================
    const sidebarLinks = document.querySelectorAll('.nav-item[data-target]');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;

            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (target === 'all') {
                allCards.forEach(c => c.classList.remove('search-hidden'));
                searchInput.value = '';
                return;
            }

            const el = document.getElementById(target);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // =============================================
    // 5. ATTENDANCE CALCULATOR (Persistent)
    // =============================================
    const attendanceForm = document.getElementById('attendance-form');
    const courseSelect = document.getElementById('course-select');
    const customCourseInput = document.getElementById('custom-course');
    const conductedInput = document.getElementById('total-conducted');
    const attendedInput = document.getElementById('total-attended');
    const clearBtn = document.getElementById('clear-btn');

    const requiredClassesEl = document.getElementById('required-classes');
    const attendanceStatusEl = document.getElementById('attendance-status');
    const attendanceCircle = document.getElementById('attendance-circle');
    const attendancePercentText = document.getElementById('attendance-percent');
    const courseResultsContainer = document.getElementById('course-results');
    const overallStatusMsg = document.getElementById('overall-status-msg');
    const dotGrid = document.getElementById('dot-grid');

    courseSelect.addEventListener('change', () => {
        if (courseSelect.value === 'other') {
            customCourseInput.classList.remove('hidden');
            customCourseInput.focus();
        } else {
            customCourseInput.classList.add('hidden');
        }
    });

    let courseData = JSON.parse(localStorage.getItem('klh_courses')) || [];

    function saveCourses() {
        localStorage.setItem('klh_courses', JSON.stringify(courseData));
    }

    attendanceForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const courseName = courseSelect.value === 'other'
            ? customCourseInput.value.trim()
            : courseSelect.value;

        const conducted = parseInt(conductedInput.value);
        const attended = parseInt(attendedInput.value);

        if (!courseName || isNaN(conducted) || isNaN(attended) || conducted <= 0 || attended < 0 || attended > conducted) {
            alert('Please enter valid values.');
            return;
        }

        const pct = (attended / conducted) * 100;

        // Update ring
        attendanceCircle.setAttribute('stroke-dasharray', `${pct}, 100`);
        attendancePercentText.textContent = `${pct.toFixed(1)}%`;
        attendanceCircle.style.stroke = pct >= 75 ? '#34C759' : '#FF3B30';

        if (pct >= 75) {
            let extra = 0;
            while (((attended) / (conducted + extra + 1)) * 100 >= 75) extra++;
            requiredClassesEl.textContent = '0';
            attendanceStatusEl.textContent = `Safe! You can miss ${extra} more class${extra !== 1 ? 'es' : ''}.`;
            attendanceStatusEl.style.color = 'var(--green)';
        } else {
            let needed = 0;
            while (((attended + needed + 1) / (conducted + needed + 1)) * 100 < 75) needed++;
            needed++;
            requiredClassesEl.textContent = needed;
            attendanceStatusEl.textContent = `Attend ${needed} more class${needed !== 1 ? 'es' : ''} to reach 75%.`;
            attendanceStatusEl.style.color = 'var(--red)';
        }

        const existing = courseData.findIndex(c => c.name === courseName);
        const entry = { name: courseName, conducted, attended, pct: pct.toFixed(1) };
        if (existing >= 0) courseData[existing] = entry;
        else courseData.push(entry);
        saveCourses();
        renderCourseResults();
        updateOverallStatus();
    });

    clearBtn.addEventListener('click', () => {
        attendanceForm.reset();
        customCourseInput.classList.add('hidden');
        requiredClassesEl.textContent = '--';
        attendanceStatusEl.textContent = '--';
        attendanceStatusEl.style.color = '';
        attendanceCircle.setAttribute('stroke-dasharray', '0, 100');
        attendancePercentText.textContent = '0%';
        attendanceCircle.style.stroke = 'var(--accent)';
    });

    function renderCourseResults() {
        courseResultsContainer.innerHTML = '';
        courseData.forEach(c => {
            const div = document.createElement('div');
            div.className = 'course-result-item';
            const safe = parseFloat(c.pct) >= 75;
            div.innerHTML = `<span>${c.name}</span><span class="course-pct ${safe ? 'safe' : 'danger'}">${c.pct}%</span>`;
            courseResultsContainer.appendChild(div);
        });
    }

    function updateOverallStatus() {
        if (courseData.length === 0) {
            overallStatusMsg.textContent = 'Add courses to see your overall standing.';
            renderDots(0);
            return;
        }
        const avg = courseData.reduce((sum, c) => sum + parseFloat(c.pct), 0) / courseData.length;
        renderDots(avg);

        if (avg >= 85) overallStatusMsg.textContent = `🌟 Excellent! Average: ${avg.toFixed(1)}%. Keep it up!`;
        else if (avg >= 75) overallStatusMsg.textContent = `👍 On track at ${avg.toFixed(1)}%. Stay consistent!`;
        else if (avg >= 65) overallStatusMsg.textContent = `⚠️ Warning: ${avg.toFixed(1)}%. Attend more classes!`;
        else overallStatusMsg.textContent = `🚨 Critical: ${avg.toFixed(1)}%. Immediate action needed!`;
    }

    function renderDots(pct) {
        dotGrid.innerHTML = '';
        const total = 20;
        const filled = Math.round((pct / 100) * total);
        for (let i = 0; i < total; i++) {
            const d = document.createElement('div');
            d.className = 'dot';
            if (i < filled) d.classList.add(pct >= 75 ? 'filled-light' : 'filled');
            dotGrid.appendChild(d);
        }
    }

    // Restore last viewed course on load
    function restoreLastAttendance() {
        if (courseData.length > 0) {
            const last = courseData[courseData.length - 1];
            const pct = parseFloat(last.pct);
            attendanceCircle.setAttribute('stroke-dasharray', `${pct}, 100`);
            attendancePercentText.textContent = `${last.pct}%`;
            attendanceCircle.style.stroke = pct >= 75 ? '#34C759' : '#FF3B30';
        }
    }

    renderCourseResults();
    updateOverallStatus();
    restoreLastAttendance();

    // (Canteen is now on its own page — see canteen.js)

    // =============================================
    // 7. TO-DO LIST (with Progress Bar)
    // =============================================
    const todoInput = document.getElementById('todo-input');
    const todoAddBtn = document.getElementById('todo-add-btn');
    const todoListEl = document.getElementById('todo-list');
    const todoProgressFill = document.getElementById('todo-progress-fill');
    const todoProgressLabel = document.getElementById('todo-progress-label');

    let todos = JSON.parse(localStorage.getItem('klh_todos')) || [];

    function saveTodos() { localStorage.setItem('klh_todos', JSON.stringify(todos)); }

    function updateTodoProgress() {
        if (todos.length === 0) {
            todoProgressFill.style.width = '0%';
            todoProgressLabel.textContent = '0%';
            return;
        }
        const done = todos.filter(t => t.done).length;
        const pct = Math.round((done / todos.length) * 100);
        todoProgressFill.style.width = pct + '%';
        todoProgressLabel.textContent = pct + '%';
    }

    function renderTodos() {
        todoListEl.innerHTML = '';
        todos.forEach((todo, i) => {
            const li = document.createElement('li');
            li.className = `todo-item${todo.done ? ' done' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${todo.done ? 'checked' : ''}>
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="todo-delete icon-btn" title="Delete">
                    <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                </button>
            `;

            li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                todos[i].done = e.target.checked;
                saveTodos();
                renderTodos();
            });

            li.querySelector('.todo-delete').addEventListener('click', () => {
                todos.splice(i, 1);
                saveTodos();
                renderTodos();
            });

            todoListEl.appendChild(li);
        });
        updateTodoProgress();
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (!text) return;
        todos.push({ text, done: false });
        todoInput.value = '';
        saveTodos();
        renderTodos();
    }

    todoAddBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

    renderTodos();

    // =============================================
    // 8. DYNAMIC DAILY TIMETABLE
    // =============================================
    const timetableListEl = document.getElementById('timetable-list');
    const todayDayEl = document.getElementById('today-day');

    const SCHEDULE = {
        Monday: [
            { time: '09:00 - 09:50', name: 'FWD Lecture', room: 'AB1-302' },
            { time: '10:00 - 10:50', name: 'DSA Lab', room: 'LH-201' },
            { time: '11:00 - 11:50', name: 'MATH AI', room: 'AB2-105' },
            { time: '12:00 - 12:50', name: 'Lunch Break', room: '—' },
            { time: '13:00 - 13:50', name: 'CSE Lecture', room: 'AB1-204' },
            { time: '14:00 - 14:50', name: 'GLBP', room: 'Seminar Hall' },
        ],
        Tuesday: [
            { time: '09:00 - 09:50', name: 'DSA Lecture', room: 'AB2-302' },
            { time: '10:00 - 10:50', name: 'FWD Lab', room: 'LH-103' },
            { time: '11:00 - 11:50', name: 'MATH AI', room: 'AB2-105' },
            { time: '12:00 - 12:50', name: 'Lunch Break', room: '—' },
            { time: '13:00 - 13:50', name: 'GLBP', room: 'Seminar Hall' },
            { time: '14:00 - 14:50', name: 'CSE Tutorial', room: 'AB1-201' },
        ],
        Wednesday: [
            { time: '09:00 - 09:50', name: 'FWD Lecture', room: 'AB1-302' },
            { time: '10:00 - 10:50', name: 'CSE Lab', room: 'LH-201' },
            { time: '11:00 - 11:50', name: 'DSA Lecture', room: 'AB2-302' },
            { time: '12:00 - 12:50', name: 'Lunch Break', room: '—' },
            { time: '13:00 - 13:50', name: 'MATH AI Tutorial', room: 'AB2-105' },
            { time: '14:00 - 14:50', name: 'GLBP', room: 'Seminar Hall' },
        ],
        Thursday: [
            { time: '09:00 - 09:50', name: 'MATH AI', room: 'AB2-105' },
            { time: '10:00 - 10:50', name: 'FWD Lab', room: 'LH-103' },
            { time: '11:00 - 11:50', name: 'DSA Lecture', room: 'AB2-302' },
            { time: '12:00 - 12:50', name: 'Lunch Break', room: '—' },
            { time: '13:00 - 13:50', name: 'CSE Lecture', room: 'AB1-204' },
            { time: '14:00 - 14:50', name: 'Sports / Club', room: 'Ground' },
        ],
        Friday: [
            { time: '09:00 - 09:50', name: 'DSA Lab', room: 'LH-201' },
            { time: '10:00 - 10:50', name: 'FWD Lecture', room: 'AB1-302' },
            { time: '11:00 - 11:50', name: 'CSE Lecture', room: 'AB1-204' },
            { time: '12:00 - 12:50', name: 'Lunch Break', room: '—' },
            { time: '13:00 - 13:50', name: 'MATH AI', room: 'AB2-105' },
            { time: '14:00 - 14:50', name: 'Free Period', room: '—' },
        ],
        Saturday: [
            { time: '09:00 - 10:50', name: 'GLBP Workshop', room: 'Seminar Hall' },
            { time: '11:00 - 11:50', name: 'FWD Tutorial', room: 'LH-103' },
        ],
        Sunday: [],
    };

    function renderTimetable() {
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const now = new Date();
        const today = days[now.getDay()];
        todayDayEl.textContent = today;

        const classes = SCHEDULE[today] || [];
        timetableListEl.innerHTML = '';

        if (classes.length === 0) {
            timetableListEl.innerHTML = '<li class="tt-item" style="justify-content:center;opacity:0.7;">🎉 No classes today!</li>';
            return;
        }

        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        classes.forEach(cls => {
            const li = document.createElement('li');
            li.className = 'tt-item';

            // Parse time range
            const [startStr, endStr] = cls.time.split(' - ');
            const startMin = parseTimeToMinutes(startStr);
            const endMin = parseTimeToMinutes(endStr);

            if (currentMinutes >= startMin && currentMinutes < endMin) {
                li.classList.add('current');
            } else if (currentMinutes >= endMin) {
                li.classList.add('past');
            }

            li.innerHTML = `
                <span class="tt-time">${cls.time}</span>
                <span class="tt-name">${cls.name}</span>
                <span class="tt-room">${cls.room}</span>
            `;
            timetableListEl.appendChild(li);
        });
    }

    function parseTimeToMinutes(str) {
        const [h, m] = str.split(':').map(Number);
        return h * 60 + m;
    }

    renderTimetable();
    setInterval(renderTimetable, 60000); // Re-check every minute

    // =============================================
    // 9. CGPA / SGPA ESTIMATOR
    // =============================================
    const cgpaInputs = document.getElementById('cgpa-inputs');
    const cgpaAddRow = document.getElementById('cgpa-add-row');
    const cgpaCalcBtn = document.getElementById('cgpa-calc-btn');
    const sgpaValue = document.getElementById('sgpa-value');

    const GRADE_MAP = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };

    function createCgpaRow() {
        const row = document.createElement('div');
        row.className = 'cgpa-row';
        row.innerHTML = `
            <input type="text" placeholder="Subject" class="cgpa-subject">
            <input type="number" placeholder="Credits" class="cgpa-credits" min="1" max="6" value="3">
            <select class="cgpa-grade">
                <option value="O">O (10)</option>
                <option value="A+" selected>A+ (9)</option>
                <option value="A">A (8)</option>
                <option value="B+">B+ (7)</option>
                <option value="B">B (6)</option>
                <option value="C">C (5)</option>
                <option value="P">P (4)</option>
                <option value="F">F (0)</option>
            </select>
            <span class="material-symbols-outlined cgpa-remove" title="Remove">close</span>
        `;
        row.querySelector('.cgpa-remove').addEventListener('click', () => row.remove());
        cgpaInputs.appendChild(row);
    }

    // Start with 3 rows
    for (let i = 0; i < 3; i++) createCgpaRow();

    cgpaAddRow.addEventListener('click', createCgpaRow);

    cgpaCalcBtn.addEventListener('click', () => {
        const rows = cgpaInputs.querySelectorAll('.cgpa-row');
        let totalCredits = 0, totalPoints = 0;

        rows.forEach(row => {
            const credits = parseInt(row.querySelector('.cgpa-credits').value) || 0;
            const grade = row.querySelector('.cgpa-grade').value;
            totalCredits += credits;
            totalPoints += credits * GRADE_MAP[grade];
        });

        if (totalCredits === 0) {
            sgpaValue.textContent = '--';
            return;
        }

        const sgpa = (totalPoints / totalCredits).toFixed(2);
        sgpaValue.textContent = sgpa;
    });

    // =============================================
    // 10. EXTRACURRICULAR & PROJECT HUB
    // =============================================
    const hubTitle = document.getElementById('hub-title');
    const hubDate = document.getElementById('hub-date');
    const hubAddBtn = document.getElementById('hub-add-btn');
    const hubListEl = document.getElementById('hub-list');

    let hubItems = JSON.parse(localStorage.getItem('klh_hub')) || [];

    function saveHub() { localStorage.setItem('klh_hub', JSON.stringify(hubItems)); }

    function renderHub() {
        hubListEl.innerHTML = '';
        hubItems.forEach((item, i) => {
            const li = document.createElement('li');
            li.className = 'hub-item';
            li.innerHTML = `
                <span class="hub-item-title">${escapeHtml(item.title)}</span>
                <span class="hub-item-date">${item.date || 'No date'}</span>
                <span class="material-symbols-outlined hub-delete" style="font-size:18px;cursor:pointer;" title="Delete">delete</span>
            `;
            li.querySelector('.hub-delete').addEventListener('click', () => {
                hubItems.splice(i, 1);
                saveHub();
                renderHub();
            });
            hubListEl.appendChild(li);
        });
    }

    hubAddBtn.addEventListener('click', () => {
        const title = hubTitle.value.trim();
        if (!title) return;
        hubItems.push({ title, date: hubDate.value || '' });
        hubTitle.value = '';
        hubDate.value = '';
        saveHub();
        renderHub();
    });

    renderHub();

    // =============================================
    // 11. POMODORO / FOCUS TIMER
    // =============================================
    const timerText = document.getElementById('timer-text');
    const timerCircle = document.getElementById('timer-circle');
    const pomoStart = document.getElementById('pomo-start');
    const pomoPause = document.getElementById('pomo-pause');
    const pomoReset = document.getElementById('pomo-reset');
    const presetBtns = document.querySelectorAll('.pomo-preset-btn');

    let pomoDuration = 25 * 60; // seconds
    let pomoRemaining = pomoDuration;
    let pomoInterval = null;
    let pomoRunning = false;

    function formatTime(s) {
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    function updateTimerUI() {
        timerText.textContent = formatTime(pomoRemaining);
        const pct = (pomoRemaining / pomoDuration) * 100;
        timerCircle.setAttribute('stroke-dasharray', `${pct}, 100`);
    }

    pomoStart.addEventListener('click', () => {
        if (pomoRunning) return;
        pomoRunning = true;
        pomoStart.textContent = 'Running...';

        pomoInterval = setInterval(() => {
            pomoRemaining--;
            updateTimerUI();

            if (pomoRemaining <= 0) {
                clearInterval(pomoInterval);
                pomoRunning = false;
                pomoStart.textContent = 'Start';
                alert('⏰ Focus session complete! Time for a break.');
                pomoRemaining = pomoDuration;
                updateTimerUI();
            }
        }, 1000);
    });

    pomoPause.addEventListener('click', () => {
        if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoRunning = false;
            pomoStart.textContent = 'Start';
        }
    });

    pomoReset.addEventListener('click', () => {
        clearInterval(pomoInterval);
        pomoInterval = null;
        pomoRunning = false;
        pomoRemaining = pomoDuration;
        pomoStart.textContent = 'Start';
        updateTimerUI();
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoRunning = false;
            pomoStart.textContent = 'Start';

            pomoDuration = parseInt(btn.dataset.mins) * 60;
            pomoRemaining = pomoDuration;
            updateTimerUI();
        });
    });

    updateTimerUI();

    // =============================================
    // 12. GEMINI AI CHATBOT
    // =============================================
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    chatFab.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
    chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));

    function appendMsg(text, sender) {
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendToGemini(message) {
        appendMsg(message, 'user');
        chatInput.value = '';

        const typing = document.createElement('div');
        typing.className = 'msg bot typing';
        typing.textContent = 'Thinking...';
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: message }] }]
                    })
                }
            );

            typing.remove();

            if (!res.ok) {
                const err = await res.json();
                appendMsg(`Error: ${err.error?.message || 'API request failed.'}`, 'bot');
                return;
            }

            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I didn\'t get a response.';
            appendMsg(reply, 'bot');
        } catch (err) {
            typing.remove();
            appendMsg(`Network error: ${err.message}`, 'bot');
        }
    }

    chatSend.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (msg) sendToGemini(msg);
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const msg = chatInput.value.trim();
            if (msg) sendToGemini(msg);
        }
    });

    // =============================================
    // UTILITY
    // =============================================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

});
