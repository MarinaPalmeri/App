// Determina il saluto in base all'ora corrente
function getGreeting(hour) {
    if (hour >= 6 && hour < 12) {
        return "Buongiorno, Marina! 🍂☕";
    } else if (hour >= 12 && hour < 19) {
        return "Buon pomeriggio, Marina! 🌾";
    } else if (hour >= 19 && hour < 22) {
        return "Buona sera, Marina! 🕯️🍁";
    } else {
        return "Buonanotte, Marina! 🌙🍂";
    }
}

// Inizializza le date del calendario della spazzatura
function initTrashDates() {
    const now = new Date();
    
    // Mostra la data odierna sopra il calendario spazzatura
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateFormatted = now.toLocaleDateString('it-IT', options);
    const casaDateEl = document.getElementById('casa-current-date');
    if (casaDateEl) {
        casaDateEl.innerHTML = `<i class="fa-regular fa-calendar mr-1.5 text-[#e2b4bd]"></i> ${dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)}`;
    }

    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const el = document.getElementById(`date-${i}`);
        if (el) el.innerText = d.getDate();
    }

    // Giovedì alternato
    const refDate = new Date(2026, 8, 24);
    const diffDays = Math.floor((now.getTime() - refDate.getTime()) / (1000 * 3600 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const thursdayContainer = document.getElementById('thursday-badge-container');

    if (thursdayContainer) {
        if (Math.abs(diffWeeks) % 2 === 0) {
            thursdayContainer.innerHTML = `<span class="px-3 py-1 rounded-full bg-[#f3d5b5]/20 text-[#f3d5b5] border border-[#f3d5b5]/30 font-medium">Plastica & Alluminio</span>`;
        } else {
            thursdayContainer.innerHTML = `<span class="px-3 py-1 rounded-full bg-[#382d2a] text-[#e0a98b] border border-[#e2b4bd]/20 font-medium">Indifferenziata</span>`;
        }
    }
}

// Aggiorna data e orologio in tempo reale
function updateDateTime() {
    const now = new Date();
    const hour = now.getHours();
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = now.toLocaleDateString('it-IT', options);
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.innerText = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);
    
    const hours = String(hour).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = `${hours}:${minutes}:${seconds}`;

    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.innerText = getGreeting(hour);
}

// --- METEO E MOOD DEL GIORNO ---
const weatherDescriptions = {
    0: ['Sereno', '☀️'],
    1: ['Prevalentemente sereno', '🌤️'],
    2: ['Parzialmente nuvoloso', '⛅'],
    3: ['Nuvoloso', '☁️'],
    45: ['Nebbia', '🌫️'],
    48: ['Nebbia', '🌫️'],
    51: ['Pioviggine', '🌦️'],
    53: ['Pioviggine', '🌦️'],
    55: ['Pioviggine intensa', '🌧️'],
    61: ['Pioggia leggera', '🌦️'],
    63: ['Pioggia', '🌧️'],
    65: ['Pioggia intensa', '⛈️'],
    71: ['Neve leggera', '🌨️'],
    73: ['Neve', '❄️'],
    75: ['Neve intensa', '❄️'],
    80: ['Rovesci leggeri', '🌦️'],
    81: ['Rovesci', '🌧️'],
    82: ['Rovesci intensi', '⛈️'],
    95: ['Temporale', '⛈️'],
    96: ['Temporale con grandine', '⛈️'],
    99: ['Temporale con grandine', '⛈️']
};

function renderWeather(temperature, weatherCode, location = 'La tua zona', details = {}) {
    const summaryEl = document.getElementById('weather-summary');
    const iconEl = document.getElementById('weather-icon');
    const locationEl = document.getElementById('weather-location');
    const temperatureEl = document.getElementById('weather-temperature');
    if (!summaryEl || !iconEl || !locationEl || !temperatureEl) return;

    const weather = weatherDescriptions[weatherCode] || ['Meteo variabile', '🌤️'];
    const formatValue = (value, suffix = '') => value !== null && value !== undefined && Number.isFinite(Number(value))
        ? `${Math.round(Number(value))}${suffix}`
        : '--';

    temperatureEl.innerText = formatValue(temperature, '°C');
    summaryEl.innerText = weather[0];
    iconEl.innerText = weather[1];
    locationEl.innerText = location;
    document.getElementById('weather-high-low').innerText = `${formatValue(details.maximum, '°C')} / ${formatValue(details.minimum, '°C')}`;
    document.getElementById('weather-rain').innerText = `${formatValue(details.rainChance, '%')}`;
}

async function initWeather() {
    const refreshButton = document.getElementById('weather-refresh');
    const refreshIcon = document.getElementById('weather-refresh-icon');
    if (refreshButton) refreshButton.disabled = true;
    refreshIcon?.classList.add('fa-spin');

    const loadWeather = async (latitude, longitude, location) => {
        const parameters = new URLSearchParams({
            latitude,
            longitude,
            current: 'temperature_2m,weather_code',
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
            forecast_days: '1',
            timezone: 'auto'
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`);
        if (!response.ok) throw new Error('Weather request failed');
        const data = await response.json();
        renderWeather(data.current.temperature_2m, data.current.weather_code, location, {
            maximum: data.daily.temperature_2m_max[0],
            minimum: data.daily.temperature_2m_min[0],
            rainChance: data.daily.precipitation_probability_max[0]
        });
    };

    try {
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            await loadWeather(position.coords.latitude, position.coords.longitude, 'La tua zona');
        } else {
            await loadWeather(41.9028, 12.4964, 'Roma');
        }
    } catch (error) {
        try {
            await loadWeather(41.9028, 12.4964, 'Roma');
        } catch (fallbackError) {
            renderWeatherUnavailable();
        }
    } finally {
        if (refreshButton) refreshButton.disabled = false;
        refreshIcon?.classList.remove('fa-spin');
    }
}

function renderWeatherUnavailable() {
    document.getElementById('weather-temperature').innerText = '--°C';
    document.getElementById('weather-summary').innerText = 'Meteo non disponibile';
    document.getElementById('weather-icon').innerText = '🌫️';
    document.getElementById('weather-location').innerText = 'Controlla la connessione e riprova.';
    ['weather-high-low', 'weather-rain']
        .forEach(id => document.getElementById(id).innerText = '--');
}

function initMoodTracker() {
    const moodButtons = document.querySelectorAll('.mood-button');
    const savedMoodLabel = document.getElementById('mood-saved-label');
    const feedbackEl = document.getElementById('mood-feedback');
    const todayKey = new Date().toISOString().split('T')[0];
    const savedMood = localStorage.getItem(`lifehub_mood_${todayKey}`);
    const moodFeedback = {
        felice: 'Goditi questo bel momento.',
        serena: 'Resta nel tuo ritmo tranquillo.',
        stanca: 'Oggi puoi rallentare.',
        pensierosa: 'Un pensiero alla volta.',
        energica: 'Porta energia a una cosa.'
    };
    let savedLabelTimeout;

    const showMood = (mood, announceSaved = false) => {
        moodButtons.forEach(button => {
            const isSelected = button.dataset.mood === mood;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
        if (feedbackEl) feedbackEl.innerText = moodFeedback[mood] || 'Ogni giornata ha il suo ritmo.';
        if (announceSaved && savedMoodLabel) {
            clearTimeout(savedLabelTimeout);
            savedMoodLabel.innerText = mood ? 'Salvato ✨' : 'Rimosso';
            savedMoodLabel.classList.remove('opacity-0');
            savedLabelTimeout = setTimeout(() => savedMoodLabel.classList.add('opacity-0'), 1400);
        }
    };

    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const moodKey = `lifehub_mood_${todayKey}`;
            if (localStorage.getItem(moodKey) === button.dataset.mood) {
                localStorage.removeItem(moodKey);
                showMood(null, true);
            } else {
                localStorage.setItem(moodKey, button.dataset.mood);
                showMood(button.dataset.mood, true);
            }
        });
    });

    if (savedMood) showMood(savedMood);
}

function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function initHomeDashboard() {
    const dateKey = getLocalDateKey();
    const focusInput = document.getElementById('home-focus-input');
    if (focusInput) focusInput.value = localStorage.getItem(`lifehub_home_focus_${dateKey}`) || '';

    renderHomeTasks();
}

function getHomeTasksStorageKey() {
    return `lifehub_home_tasks_${getLocalDateKey()}`;
}

function loadHomeTasks() {
    try {
        const tasks = JSON.parse(localStorage.getItem(getHomeTasksStorageKey()) || '[]');
        return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
        return [];
    }
}

function saveHomeTasks(tasks) {
    const status = document.getElementById('home-task-status');
    try {
        localStorage.setItem(getHomeTasksStorageKey(), JSON.stringify(tasks));
        status?.classList.add('hidden');
        return true;
    } catch (error) {
        if (status) {
            status.innerText = 'Impossibile salvare il promemoria.';
            status.classList.remove('hidden');
        }
        return false;
    }
}

function saveHomeFocus(value) {
    try {
        localStorage.setItem(`lifehub_home_focus_${getLocalDateKey()}`, value);
    } catch (error) {
        return;
    }
}

function renderHomeTasks() {
    const listEl = document.getElementById('home-task-list');
    if (!listEl) return;
    const tasks = loadHomeTasks();
    const completedCount = tasks.filter(task => task.completed).length;
    const countEl = document.getElementById('home-task-count');
    const progressEl = document.getElementById('home-task-progress');
    const progressBar = progressEl?.parentElement;
    const percent = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;

    if (countEl) countEl.innerText = `${completedCount}/${tasks.length}`;
    if (progressEl) progressEl.style.width = `${percent}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));

    if (tasks.length === 0) {
        listEl.innerHTML = '<p class="py-1 text-xs text-[#9c8a80]">Tutto tranquillo per ora ☕</p>';
        return;
    }

    listEl.innerHTML = tasks.map(task => `
        <div class="cozy-row flex items-center gap-2 px-2.5 py-1.5">
            <input id="home-task-${task.id}" type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleHomeTask('${task.id}', this.checked)" class="h-4 w-4 shrink-0 accent-[#b5c99a]">
            <label for="home-task-${task.id}" class="min-w-0 flex-1 break-words text-xs ${task.completed ? 'text-[#9c8a80] line-through' : 'text-[#f7f0eb]'}">${escapeRecipeHTML(task.text)}</label>
            <button type="button" onclick="deleteHomeTask('${task.id}')" aria-label="Elimina promemoria ${escapeRecipeHTML(task.text)}" class="shrink-0 px-1 text-[#9c8a80] hover:text-rose-300"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

function addHomeTask(event) {
    event.preventDefault();
    const input = document.getElementById('home-task-input');
    const text = input?.value.trim();
    if (!text) return;

    const tasks = loadHomeTasks();
    tasks.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        completed: false
    });
    if (!saveHomeTasks(tasks)) return;
    input.value = '';
    renderHomeTasks();
}

function toggleHomeTask(taskId, completed) {
    const tasks = loadHomeTasks();
    const task = tasks.find(item => item.id === taskId);
    if (!task) return;
    task.completed = completed;
    if (saveHomeTasks(tasks)) renderHomeTasks();
}

function deleteHomeTask(taskId) {
    const tasks = loadHomeTasks().filter(task => task.id !== taskId);
    if (saveHomeTasks(tasks)) renderHomeTasks();
}

setInterval(updateDateTime, 1000);

// --- LOGICA NOTE GIORNALIERE (31 GG) + ALBUM FOTO PERMANENTI INDIPENDENTI ---
let activeDiaryDate = new Date().toISOString().split('T')[0];

function cleanOldDiaryNotes() {
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - 31);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('diary_note_text_')) {
            const dateStr = key.replace('diary_note_text_', '');
            const [year, month, day] = dateStr.split('-');
            const noteDate = new Date(year, month - 1, day);

            if (noteDate < cutoffDate) {
                localStorage.removeItem(key);
            }
        }
    }
}

function saveDiaryNote() {
    const textEl = document.getElementById('diary-textarea');
    if (!textEl) return;
    
    const noteText = textEl.value.trim();
    if (noteText.length > 0) {
        localStorage.setItem(`diary_note_text_${activeDiaryDate}`, noteText);
    } else {
        localStorage.removeItem(`diary_note_text_${activeDiaryDate}`);
    }
    
    renderDiaryTimeline();
}

function selectDiaryDate(dateStr, isFuture = false) {
    if (isFuture) return;

    activeDiaryDate = dateStr;
    const textEl = document.getElementById('diary-textarea');
    const titleEl = document.getElementById('diary-selected-date');
    
    const [year, month, day] = dateStr.split('-');
    const selectedDateObj = new Date(year, month - 1, day);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const formattedDate = selectedDateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    
    if (titleEl) {
        if (dateStr === todayStr) {
            titleEl.innerHTML = `<i class="fa-solid fa-heart mr-2 text-[#e2b4bd]"></i> Nota di Oggi (${formattedDate})`;
        } else {
            titleEl.innerHTML = `<i class="fa-solid fa-calendar-heart mr-2 text-[#e8c2ca]"></i> Nota del ${formattedDate}`;
        }
    }
    
    const savedNoteText = localStorage.getItem(`diary_note_text_${dateStr}`) || '';
    if (textEl) textEl.value = savedNoteText;

    renderDiaryTimeline();
}

// --- LOGICA ALBUM FOTO PERMANENTI ---
function loadAlbumPhotos(category) {
    const saved = localStorage.getItem(`global_album_${category}`);
    return saved ? JSON.parse(saved) : [];
}

function saveAlbumPhotos(category, photosArray) {
    localStorage.setItem(`global_album_${category}`, JSON.stringify(photosArray));
}

function handlePhotoUpload(event, category) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let currentPhotos = loadAlbumPhotos(category);

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const resizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                currentPhotos.push(resizedBase64);
                saveAlbumPhotos(category, currentPhotos);
                renderPhotoGalleries();
            };
        };
        reader.readAsDataURL(file);
    });
}

function removePhoto(category, index) {
    let currentPhotos = loadAlbumPhotos(category);
    currentPhotos.splice(index, 1);
    saveAlbumPhotos(category, currentPhotos);
    renderPhotoGalleries();
}

function renderPhotoGalleries() {
    renderSingleGallery('diary-gallery-noi', loadAlbumPhotos('noi'), 'noi');
    renderSingleGallery('diary-gallery-gym', loadAlbumPhotos('gym'), 'gym');
}

// --- CALENDARIO ALLENAMENTI ---
let gymCalendarDate = new Date();

function getGymMonthKey(year, month) {
    return `gym_calendar_${year}-${String(month + 1).padStart(2, '0')}`;
}

function loadGymCheckedDays(year, month) {
    const saved = localStorage.getItem(getGymMonthKey(year, month));
    return saved ? JSON.parse(saved) : [];
}

function saveGymCheckedDays(year, month, checkedDays) {
    localStorage.setItem(getGymMonthKey(year, month), JSON.stringify(checkedDays));
}

function renderGymCalendar() {
    const calendarGrid = document.getElementById('gym-calendar-grid');
    const monthTitle = document.getElementById('gym-month-title');
    const completedCount = document.getElementById('gym-completed-count');
    if (!calendarGrid || !monthTitle || !completedCount) return;

    const year = gymCalendarDate.getFullYear();
    const month = gymCalendarDate.getMonth();
    const monthName = gymCalendarDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
    const checkedDays = loadGymCheckedDays(year, month);
    const today = new Date();

    monthTitle.innerText = monthName;
    calendarGrid.innerHTML = '';

    for (let blankIndex = 0; blankIndex < mondayOffset; blankIndex++) {
        calendarGrid.innerHTML += '<div class="min-h-[58px]"></div>';
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
        const isChecked = checkedDays.includes(dayNumber);
        const isToday = dayNumber === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const todayClass = isToday ? 'ring-2 ring-[#e0a98b]/70' : '';
        const checkedClass = isChecked ? 'bg-[#b5c99a]/25 border-[#b5c99a]/60' : 'bg-[#2b2321]/55 border-[#e2b4bd]/10';

        calendarGrid.innerHTML += `
            <label class="gym-day-cell min-h-[58px] rounded-2xl border ${checkedClass} ${todayClass} flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95">
                <span class="text-[10px] ${isChecked ? 'text-[#b5c99a]' : 'text-[#c7b3a6]'}">${dayNumber}</span>
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleGymDay(${dayNumber}, this.checked)" class="w-4 h-4 accent-[#b5c99a] cursor-pointer">
            </label>
        `;
    }

    completedCount.innerText = checkedDays.length;
}

function toggleGymDay(dayNumber, isChecked) {
    const year = gymCalendarDate.getFullYear();
    const month = gymCalendarDate.getMonth();
    const checkedDays = loadGymCheckedDays(year, month).filter(day => day !== dayNumber);
    if (isChecked) checkedDays.push(dayNumber);
    checkedDays.sort((firstDay, secondDay) => firstDay - secondDay);
    saveGymCheckedDays(year, month, checkedDays);
    renderGymCalendar();
}

function changeGymMonth(offset) {
    gymCalendarDate = new Date(gymCalendarDate.getFullYear(), gymCalendarDate.getMonth() + offset, 1);
    renderGymCalendar();
}

function goToCurrentGymMonth() {
    gymCalendarDate = new Date();
    renderGymCalendar();
}

function renderSingleGallery(containerId, photosArray, category) {
    const galleryEl = document.getElementById(containerId);
    if (!galleryEl) return;

    galleryEl.innerHTML = '';
    if (photosArray.length === 0) {
        galleryEl.innerHTML = `<span class="text-[11px] text-[#9c8a80] italic py-1">Nessuna foto salvata in questo album. ☁️</span>`;
        return;
    }

    photosArray.forEach((photoSrc, idx) => {
        galleryEl.innerHTML += `
            <div class="cozy-photo-card relative group shrink-0 w-64 h-64 rounded-3xl overflow-hidden border border-[#e2b4bd]/20 bg-[#1c1817] shadow-xl">
                <img src="${photoSrc}" class="w-full h-full object-cover">
                <button onclick="removePhoto('${category}', ${idx})" class="absolute top-2.5 right-2.5 bg-[#1c1817]/60 hover:bg-rose-900/80 backdrop-blur-md text-[#f7f0eb]/80 hover:text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-all duration-200 border border-white/10">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

function renderDiaryTimeline() {
    const timelineEl = document.getElementById('diary-timeline');
    if (!timelineEl) return;
    
    timelineEl.innerHTML = '';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let i = -30; i <= 5; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayNum = d.getDate();
        const monthName = d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '');
        
        const hasNote = localStorage.getItem(`diary_note_text_${dateStr}`) !== null;
        const isActive = activeDiaryDate === dateStr;
        const isFuture = dateStr > todayStr;
        const isToday = dateStr === todayStr;

        let btnClass = "";

        if (isFuture) {
            btnClass = "bg-[#1c1817]/30 border-[#e2b4bd]/5 text-[#9c8a80]/30 opacity-40 cursor-not-allowed";
        } else if (isActive) {
            btnClass = "bg-[#e8c2ca] border-[#e8c2ca] text-[#1c1817] shadow-lg scale-105 z-10 font-bold";
        } else if (isToday) {
            btnClass = "bg-[#382d2a] border-[#e8c2ca]/60 text-[#e8c2ca]";
        } else if (hasNote) {
            btnClass = "bg-[#2b2321] border-[#e2b4bd]/35 text-[#e8c2ca]";
        } else {
            btnClass = "bg-[#1c1817]/60 border-[#e2b4bd]/10 text-[#9c8a80]";
        }

        const todayBadge = isToday ? '<span class="text-[8px] uppercase tracking-tighter text-[#e8c2ca] font-extrabold -mt-0.5">Oggi</span>' : '';

        timelineEl.innerHTML += `
            <button id="diary-day-${dateStr}" onclick="selectDiaryDate('${dateStr}', ${isFuture})" class="diary-day-button flex flex-col items-center justify-center min-w-[54px] h-16 rounded-2xl border transition-all duration-200 shrink-0 ${btnClass}">
                ${todayBadge}
                <span class="text-[9px] font-semibold uppercase">${monthName}</span>
                <span class="text-sm font-bold font-cloud">${dayNum}</span>
                ${hasNote && !isActive && !isFuture ? '<span class="w-1.5 h-1.5 bg-[#e8c2ca] rounded-full mt-0.5"></span>' : ''}
            </button>
        `;
    }

    setTimeout(centerDiaryToday, 50);
}

function centerDiaryToday() {
    const activeEl = document.getElementById(`diary-day-${activeDiaryDate}`);
    const timelineEl = document.getElementById('diary-timeline');
    if (activeEl && timelineEl) {
        const scrollLeft = activeEl.offsetLeft - (timelineEl.clientWidth / 2) + (activeEl.clientWidth / 2);
        timelineEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
}

// --- LOGICA LISTA SPESA CON TIMER DI SCOMPARSA (3 SECONDI) ---
function loadShoppingList() {
    const saved = localStorage.getItem('lifehub_shopping_list');
    return saved ? JSON.parse(saved) : [];
}

function loadShoppingFoods() {
    try {
        const saved = localStorage.getItem('lifehub_shopping_foods');
        const storedFoods = saved === null ? [] : JSON.parse(saved);
        const currentFoods = saved === null
            ? loadShoppingList().map(item => ({ text: item.text, note: item.note || '' }))
            : [];
        const foods = [...(Array.isArray(storedFoods) ? storedFoods : []), ...currentFoods];

        const uniqueFoods = [];
        foods.forEach(food => {
            const text = typeof food === 'string' ? food.trim() : food?.text?.trim();
            const note = typeof food === 'string' ? '' : food?.note?.trim() || '';
            if (!text) return;

            const existingFood = uniqueFoods.find(savedFood => savedFood.text.toLocaleLowerCase() === text.toLocaleLowerCase());
            if (existingFood) {
                if (note) existingFood.note = note;
            } else {
                uniqueFoods.push({ text, note });
            }
        });
        return uniqueFoods.sort((first, second) => first.text.localeCompare(second.text, 'it', { sensitivity: 'base' }));
    } catch (error) {
        return [];
    }
}

function rememberShoppingFood(text, note) {
    const foods = loadShoppingFoods();
    const existingFood = foods.find(food => food.text.toLocaleLowerCase() === text.toLocaleLowerCase());
    if (existingFood) {
        if (note) existingFood.note = note;
    } else {
        foods.push({ text, note });
    }

    foods.sort((first, second) => first.text.localeCompare(second.text, 'it', { sensitivity: 'base' }));
    localStorage.setItem('lifehub_shopping_foods', JSON.stringify(foods));
}

function deleteShoppingFood(foodText) {
    const foods = loadShoppingFoods().filter(food => food.text.toLocaleLowerCase() !== foodText.toLocaleLowerCase());
    localStorage.setItem('lifehub_shopping_foods', JSON.stringify(foods));
    renderShoppingFoods();
}

function saveShoppingList(list) {
    localStorage.setItem('lifehub_shopping_list', JSON.stringify(list));
}

let shoppingTimeouts = {};

function addShoppingItem(savedFood = null, savedNote = '') {
    const itemInput = document.getElementById('shopping-item-input');
    const noteInput = document.getElementById('shopping-note-input');
    if (!itemInput) return;

    const text = (savedFood === null ? itemInput.value : savedFood).trim();
    const note = savedFood === null && noteInput ? noteInput.value.trim() : savedNote.trim();

    if (text === '') return;

    const list = loadShoppingList();
    const newItem = {
        id: Date.now().toString(),
        text: text,
        note: note,
        checked: false
    };

    list.push(newItem);
    saveShoppingList(list);
    rememberShoppingFood(text, note);

    if (savedFood === null) {
        itemInput.value = '';
        if (noteInput) noteInput.value = '';
    }

    renderShoppingList();
}

function renderShoppingFoods() {
    const container = document.getElementById('shopping-food-list');
    if (!container) return;

    const foods = loadShoppingFoods();
    if (foods.length === 0) {
        container.innerHTML = '<span class="text-[11px] text-[#9c8a80] italic">Ancora nessun alimento</span>';
        return;
    }

    container.innerHTML = foods.map(food => `
        <div class="inline-flex min-h-10 items-stretch overflow-hidden rounded-xl border border-[#e2b4bd]/20 bg-[#1c1817]/45">
            <button type="button" onclick="addShoppingItem(this.dataset.food, this.dataset.note)" data-food="${escapeRecipeHTML(food.text)}" data-note="${escapeRecipeHTML(food.note)}" aria-label="Aggiungi ${escapeRecipeHTML(food.text)} alla lista spesa${food.note ? `, ${escapeRecipeHTML(food.note)}` : ''}" class="inline-flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[#f7f0eb] transition-colors hover:bg-[#e8c2ca]/15 active:scale-95">
                <i class="fa-solid fa-plus text-[10px] text-[#e8c2ca]"></i>
                <span class="flex flex-col items-start"><span>${escapeRecipeHTML(food.text)}</span>${food.note ? `<span class="text-[10px] font-normal text-[#c9b49b]">${escapeRecipeHTML(food.note)}</span>` : ''}</span>
            </button>
            <button type="button" onclick="deleteShoppingFood(this.dataset.food)" data-food="${escapeRecipeHTML(food.text)}" aria-label="Elimina ${escapeRecipeHTML(food.text)} dagli alimenti salvati" title="Elimina alimento salvato" class="px-2 text-[#9c8a80] transition-colors hover:bg-rose-400/10 hover:text-rose-300">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
}

function handleShoppingCheck(checkbox, id) {
    const list = loadShoppingList();
    const item = list.find(i => i.id === id);
    if (!item) return;

    item.checked = checkbox.checked;
    saveShoppingList(list);

    const rowEl = document.getElementById(`shopping-row-${id}`);

    if (checkbox.checked) {
        if (rowEl) rowEl.classList.add('opacity-50', 'line-through', 'transition-all', 'duration-300');
        
        // Avvia timer di 3 secondi per la rimozione automatica
        shoppingTimeouts[id] = setTimeout(() => {
            const currentList = loadShoppingList();
            const filteredList = currentList.filter(i => i.id !== id);
            saveShoppingList(filteredList);
            renderShoppingList();
        }, 3000);
    } else {
        if (rowEl) rowEl.classList.remove('opacity-50', 'line-through');
        // Se viene deselezionato prima dei 3 secondi, blocca la rimozione
        if (shoppingTimeouts[id]) {
            clearTimeout(shoppingTimeouts[id]);
            delete shoppingTimeouts[id];
        }
    }
}

function deleteShoppingItem(id) {
    if (shoppingTimeouts[id]) {
        clearTimeout(shoppingTimeouts[id]);
        delete shoppingTimeouts[id];
    }
    const list = loadShoppingList();
    const filtered = list.filter(i => i.id !== id);
    saveShoppingList(filtered);
    renderShoppingList();
}

function renderShoppingList() {
    const container = document.getElementById('shopping-list-container');
    if (!container) return;

    renderShoppingFoods();
    const list = loadShoppingList();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<span class="text-[11px] text-[#9c8a80] italic py-3 block text-center">La lista della spesa è vuota. 🛒✨</span>`;
        return;
    }

    list.forEach(item => {
        container.innerHTML += `
            <div id="shopping-row-${item.id}" class="cozy-row flex items-center justify-between p-3 transition-all duration-300 ${item.checked ? 'opacity-50 line-through' : ''}">
                <div class="flex items-center space-x-3 flex-grow pr-2">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="handleShoppingCheck(this, '${item.id}')" class="w-4 h-4 accent-[#e8c2ca] rounded cursor-pointer">
                    <div class="flex flex-col">
                        <span class="font-semibold text-[#f7f0eb] text-xs">${item.text}</span>
                        ${item.note ? `<span class="text-[10px] text-[#9c8a80] italic">${item.note}</span>` : ''}
                    </div>
                </div>
                <button onclick="deleteShoppingItem('${item.id}')" class="text-[#9c8a80] hover:text-rose-400 text-xs px-2 py-1 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

// PERSISTENZA DATI ESAMI (localStorage)
function saveExamData(examId) {
    const statusEl = document.getElementById(`status-${examId}`);
    const gradeEl = document.getElementById(`grade-${examId}`);
    if (statusEl && gradeEl) {
        localStorage.setItem(`exam_${examId}`, JSON.stringify({
            status: statusEl.value,
            grade: gradeEl.value
        }));
    }
}

function loadExamData(examId) {
    const saved = localStorage.getItem(`exam_${examId}`);
    return saved ? JSON.parse(saved) : { status: 'da_fare', grade: '' };
}

const universityScheduleDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const universityScheduleHours = Array.from({ length: 13 }, (_, index) => {
    return String(index + 8);
});

function getUniversityScheduleSubjects() {
    const all = Object.values(examList).flat();
    return {
        all,
        available: all.filter(exam => loadExamData(exam.id).status !== 'superato')
    };
}

function renderUniversityScheduleOptions(value, subjects) {
    const knownSubject = subjects.all.find(exam => exam.name === value);
    const completedSubject = knownSubject && !subjects.available.includes(knownSubject);
    const retainedOption = completedSubject
        ? `<option value="${escapeRecipeHTML(value)}" selected disabled>${escapeRecipeHTML(value)} (Fatto)</option>`
        : value && !knownSubject
            ? `<option value="${escapeRecipeHTML(value)}" selected>${escapeRecipeHTML(value)}</option>`
            : '';
    const subjectOptions = subjects.available.map(exam => `<option value="${escapeRecipeHTML(exam.name)}" ${value === exam.name ? 'selected' : ''}>${escapeRecipeHTML(exam.name)}</option>`).join('');

    return `<option value="" ${value ? '' : 'selected'}>-</option>${retainedOption}${subjectOptions}`;
}

function refreshUniversityScheduleOptions() {
    const body = document.getElementById('uni-schedule-body');
    if (!body) return;

    const subjects = getUniversityScheduleSubjects();
    body.querySelectorAll('select[data-schedule-day]').forEach(select => {
        const value = select.value;
        select.innerHTML = renderUniversityScheduleOptions(value, subjects);
    });
}

function initUniversitySchedule() {
    const head = document.getElementById('uni-schedule-head');
    const body = document.getElementById('uni-schedule-body');
    if (!head || !body) return;

    let schedule = {};
    try {
        schedule = JSON.parse(localStorage.getItem('lifehub_university_schedule') || '{}');
    } catch (error) {
        schedule = {};
    }
    if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) schedule = {};

    const subjects = getUniversityScheduleSubjects();

    head.innerHTML = `<tr>
        <th scope="col" class="sticky left-0 z-10 rounded-lg bg-[#d9d2c8] px-3 py-2 text-left font-bold text-[#51463c]">Giorno</th>
        ${universityScheduleHours.map(hour => `<th scope="col" class="rounded-lg bg-[#d9d2c8] px-2 py-2 font-semibold text-[#51463c]">${hour}</th>`).join('')}
    </tr>`;
    body.innerHTML = universityScheduleDays.map((day, dayIndex) => `
        <tr>
            <th scope="row" class="sticky left-0 z-10 rounded-lg border border-[#c9bfb2] bg-[#ded8cf] px-3 py-2 text-left font-semibold text-[#51463c]">${day}</th>
            ${universityScheduleHours.map((hour, hourIndex) => {
                const value = typeof schedule[dayIndex]?.[hourIndex] === 'string' ? schedule[dayIndex][hourIndex] : '';
                return `<td class="rounded-lg border border-[#d4ccc1] bg-[#f2efe9] p-1">
                    <select data-schedule-day="${dayIndex}" data-schedule-hour="${hourIndex}" aria-label="${day}, ore ${hour}" class="w-full min-w-[60px] rounded-md bg-transparent px-1 py-2 text-center text-[10px] text-[#40372f] focus:bg-white/60 focus:outline-none">
                        ${renderUniversityScheduleOptions(value, subjects)}
                    </select>
                </td>`;
            }).join('')}
        </tr>
    `).join('');

    const saveScheduleInput = event => {
        const input = event.target.closest('[data-schedule-day]');
        if (!input) return;

        const dayIndex = input.dataset.scheduleDay;
        const hourIndex = input.dataset.scheduleHour;
        if (!schedule[dayIndex]) schedule[dayIndex] = {};
        schedule[dayIndex][hourIndex] = input.value;

        const status = document.getElementById('uni-schedule-status');
        try {
            localStorage.setItem('lifehub_university_schedule', JSON.stringify(schedule));
            if (status) status.innerText = 'Salvato';
        } catch (error) {
            if (status) status.innerText = 'Salvataggio non riuscito';
        }
    };

    body.addEventListener('change', saveScheduleInput);
}

function updateExamStatus(selectEl, examId) {
    const row = document.getElementById(`exam-row-${examId}`);
    const val = selectEl.value;
    row.className = "p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between space-x-2";
    
    if (val === 'superato') row.classList.add('bg-[#b5c99a]/20', 'border-[#b5c99a]/40');
    else if (val === 'preparando') row.classList.add('bg-[#f3d5b5]/20', 'border-[#f3d5b5]/40');
    else if (val === 'bocciato') row.classList.add('bg-[#e2b4bd]/20', 'border-[#e2b4bd]/40');
    else row.classList.add('bg-[#1c1817]/50', 'border-[#e2b4bd]/10');

    saveExamData(examId);
    refreshUniversityScheduleOptions();
}

const examList = {
    'anno-1': [
        { id: '1_1', name: 'Algebra e Geometria Lineare' },
        { id: '1_2', name: 'Analisi I' },
        { id: '1_3', name: 'Chimica' },
        { id: '1_4', name: 'Economia applicata all\'Ingegneria' },
        { id: '1_5', name: 'Fisica I' },
        { id: '1_6', name: 'Fondamenti di Informatica' }
    ],
    'anno-2': [
        { id: '2_1', name: 'Analisi II' },
        { id: '2_2', name: 'Architettura Internet' },
        { id: '2_3', name: 'Elettrotecnica' },
        { id: '2_4', name: 'Fisica II' },
        { id: '2_5', name: 'Programmazione orientata agli oggetti' },
        { id: '2_6', name: 'Sistemi Operativi' },
        { id: '2_7', name: 'Teoria dei Segnali' }
    ],
    'anno-3': [
        { id: '3_1', name: 'Automatica' },
        { id: '3_2', name: 'Calcolatori Elettronici' },
        { id: '3_3', name: 'Comunicazioni Digitali' },
        { id: '3_4', name: 'Databases and Web Programming' },
        { id: '3_5', name: 'Elettronica' },
        { id: '3_6', name: 'IoT Systems and Technologies' }
    ],
    'anno-scelta': [
        { id: 's_1', name: 'Audio Processing' }
    ]
};

function initExams() {
    Object.keys(examList).forEach(containerKey => {
        const container = document.getElementById(`container-${containerKey}`);
        if (!container) return;
        container.innerHTML = '';

        examList[containerKey].forEach((exam, index) => {
            const saved = loadExamData(exam.id);
            let bgClass = "bg-[#1c1817]/50 border-[#e2b4bd]/10";
            if (saved.status === 'superato') bgClass = "bg-[#b5c99a]/20 border-[#b5c99a]/40";
            else if (saved.status === 'preparando') bgClass = "bg-[#f3d5b5]/20 border-[#f3d5b5]/40";
            else if (saved.status === 'bocciato') bgClass = "bg-[#e2b4bd]/20 border-[#e2b4bd]/40";

            container.innerHTML += `
                <div id="exam-row-${exam.id}" class="p-3 ${bgClass} rounded-2xl border transition-all duration-200 flex items-center justify-between space-x-2">
                    <div class="flex-grow pr-2">
                        <h4 class="font-semibold text-[#f7f0eb] text-xs sm:text-sm">${exam.name}</h4>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <select id="status-${exam.id}" onchange="updateExamStatus(this, '${exam.id}')" class="bg-[#2b2321] text-[#f7f0eb] text-[11px] rounded-xl px-2 py-1 border border-[#e2b4bd]/20 focus:outline-none focus:border-[#e8c2ca]">
                            <option value="da_fare" ${saved.status === 'da_fare' ? 'selected' : ''}>Da Fare</option>
                            <option value="preparando" ${saved.status === 'preparando' ? 'selected' : ''}>In Corso 🟡</option>
                            <option value="superato" ${saved.status === 'superato' ? 'selected' : ''}>Fatto 🟢</option>
                            <option value="bocciato" ${saved.status === 'bocciato' ? 'selected' : ''}>Non Passato 🔴</option>
                        </select>
                        <div class="flex items-center space-x-1 bg-[#2b2321]/80 px-2 py-1 rounded-xl border border-[#e2b4bd]/20">
                            <input id="grade-${exam.id}" type="text" value="${saved.grade}" oninput="saveExamData('${exam.id}')" placeholder="--" class="w-7 text-center bg-transparent text-xs font-bold text-[#e8c2ca] focus:outline-none" maxlength="3">
                            <span class="text-[10px] text-[#9c8a80] font-semibold">/30</span>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// --- RACCOLTA RICETTE ---
const defaultRecipeCategories = [
    { id: 'colazione', name: 'Colazione', recipes: [] },
    { id: 'pranzo', name: 'Pranzo', recipes: [] },
    { id: 'cena', name: 'Cena', recipes: [] }
];
let recipeCategoryFormOpen = false;
let activeRecipeFormId = null;
let activeRecipeEditId = null;
let activeRecipePhotoRemoved = false;
const openRecipeCategoryIds = new Set();

function loadRecipeCategories() {
    try {
        const saved = localStorage.getItem('lifehub_recipe_categories');
        if (!saved) return defaultRecipeCategories.map(category => ({ ...category }));
        const categories = JSON.parse(saved);
        return Array.isArray(categories) ? categories : defaultRecipeCategories.map(category => ({ ...category }));
    } catch (error) {
        return defaultRecipeCategories.map(category => ({ ...category }));
    }
}

function saveRecipeCategories(categories) {
    try {
        localStorage.setItem('lifehub_recipe_categories', JSON.stringify(categories));
        return true;
    } catch (error) {
        showRecipeStatus('Spazio di archiviazione insufficiente. Prova con una foto più piccola.');
        return false;
    }
}

function escapeRecipeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function showRecipeStatus(message) {
    const status = document.getElementById('recipe-status');
    if (!status) return;
    status.innerText = message;
    status.classList.remove('hidden');
}

function renderRecipes() {
    const container = document.getElementById('recipe-categories');
    const categoryForm = document.getElementById('recipe-category-form');
    if (!container) return;

    if (categoryForm) categoryForm.classList.toggle('hidden', !recipeCategoryFormOpen);
    const categories = loadRecipeCategories();
    container.innerHTML = categories.map(category => `
        <section class="recipe-category-surface p-4 space-y-3">
            <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                    <button type="button" aria-expanded="${openRecipeCategoryIds.has(category.id)}" aria-controls="recipe-category-panel-${category.id}" onclick="toggleRecipeCategory(this, '${category.id}')" class="recipe-category-toggle group flex w-full items-center justify-between gap-3 text-left">
                        <h4 class="font-cloud font-bold text-sm text-[#f3d5b5]">${escapeRecipeHTML(category.name)}</h4>
                        <i class="fa-solid fa-chevron-down text-[10px] text-[#9c8a80] transition-transform duration-500 ${openRecipeCategoryIds.has(category.id) ? 'rotate-180' : ''}"></i>
                    </button>
                    <div id="recipe-category-panel-${category.id}" aria-hidden="${!openRecipeCategoryIds.has(category.id)}" class="recipe-category-panel ${openRecipeCategoryIds.has(category.id) ? 'is-open' : ''}">
                        <div ${openRecipeCategoryIds.has(category.id) ? '' : 'inert'} class="recipe-category-panel-inner space-y-3">
                            <div class="space-y-2">
                                ${(category.recipes || []).map(recipe => renderRecipeCard(category, recipe)).join('')}
                            </div>
                            <button type="button" onclick="toggleRecipeForm('${category.id}')" class="recipe-add-trigger text-xs font-bold text-[#e8c2ca] active:scale-95">
                                <i class="fa-solid fa-plus mr-1.5"></i> Aggiungi Ricetta
                            </button>
                            <form onsubmit="addRecipe(event, '${category.id}')" class="recipe-entry-form ${activeRecipeFormId === category.id ? 'space-y-2' : 'hidden'}">
                                <div class="recipe-form-fields grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-start">
                                    <div class="space-y-2 min-w-0">
                                        <input id="recipe-title-${category.id}" type="text" maxlength="80" required placeholder="Titolo della ricetta" class="w-full p-3 cozy-input rounded-xl text-[#f7f0eb] text-sm focus:outline-none placeholder-[#9c8a80]">
                                        <textarea id="recipe-description-${category.id}" rows="3" maxlength="2000" placeholder="Descrizione e ingredienti" class="w-full p-3 cozy-input rounded-xl text-[#f7f0eb] text-sm focus:outline-none resize-y placeholder-[#9c8a80]"></textarea>
                                    </div>
                                    <label for="recipe-photo-${category.id}" class="recipe-photo-picker relative w-[88px] aspect-square rounded-xl border border-dashed border-[#e2b4bd]/30 bg-[#1c1817]/50 flex flex-col items-center justify-center gap-1 overflow-hidden cursor-pointer text-[#c7b3a6]">
                                        <img id="recipe-photo-preview-${category.id}" alt="Anteprima foto" class="hidden absolute inset-0 w-full h-full object-cover">
                                        <span id="recipe-photo-placeholder-${category.id}" class="flex flex-col items-center gap-1 text-[10px]"><i class="fa-regular fa-image text-lg text-[#e8c2ca]"></i>Foto</span>
                                        <input id="recipe-photo-${category.id}" type="file" accept="image/*" onchange="previewRecipePhoto(this, '${category.id}')" class="sr-only">
                                    </label>
                                </div>
                                <button type="submit" class="bg-[#e8c2ca] text-[#1c1817] text-xs font-bold px-4 py-2 rounded-xl active:scale-95">Salva Ricetta</button>
                            </form>
                        </div>
                    </div>
                </div>
                <button type="button" onclick="deleteRecipeCategory('${category.id}')" aria-label="Elimina sezione ${escapeRecipeHTML(category.name)}" title="Elimina sezione" class="recipe-category-delete shrink-0 w-8 h-8 rounded-full text-[#c7b3a6] hover:text-rose-300 hover:bg-rose-900/20 active:scale-90 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </section>
    `).join('');
}

function toggleRecipeCategory(button, categoryId) {
    const isOpen = button.getAttribute('aria-expanded') !== 'true';
    const panel = document.getElementById(`recipe-category-panel-${categoryId}`);
    if (!panel) return;

    button.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));
    panel.classList.toggle('is-open', isOpen);
    panel.firstElementChild?.toggleAttribute('inert', !isOpen);
    button.querySelector('i')?.classList.toggle('rotate-180', isOpen);
    if (isOpen) openRecipeCategoryIds.add(categoryId);
    else openRecipeCategoryIds.delete(categoryId);
}

function renderRecipeCard(category, recipe) {
    if (activeRecipeEditId === recipe.id) {
        return `
            <form onsubmit="saveEditedRecipe(event, '${category.id}', '${recipe.id}')" class="recipe-edit-form p-3.5 space-y-3">
                <div class="grid grid-cols-[minmax(0,1fr)_112px] gap-3 items-start">
                    <div class="min-w-0 space-y-2">
                        <input id="edit-recipe-title-${recipe.id}" type="text" maxlength="80" required value="${escapeRecipeHTML(recipe.title)}" aria-label="Titolo della ricetta" class="w-full p-3 cozy-input rounded-xl text-[#f7f0eb] text-sm focus:outline-none">
                        <textarea id="edit-recipe-description-${recipe.id}" rows="4" maxlength="2000" aria-label="Descrizione della ricetta" class="w-full p-3 cozy-input rounded-xl text-[#f7f0eb] text-sm focus:outline-none resize-y">${escapeRecipeHTML(recipe.description || '')}</textarea>
                    </div>
                    <div class="space-y-2">
                        <div class="relative w-28 h-28 rounded-xl border border-[#e8c2ca]/20 bg-[#1c1817]/50 overflow-hidden">
                            <img id="recipe-photo-preview-${recipe.id}" src="${recipe.photo || ''}" alt="Anteprima foto" class="${recipe.photo ? '' : 'hidden'} w-full h-full object-cover">
                            <span id="recipe-photo-placeholder-${recipe.id}" class="${recipe.photo ? 'hidden' : ''} absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] text-[#c7b3a6]"><i class="fa-regular fa-image text-lg text-[#e8c2ca]"></i>Nessuna foto</span>
                        </div>
                        <label for="edit-recipe-photo-${recipe.id}" class="block text-center bg-[#382d2a] text-[#e8c2ca] text-[10px] font-semibold px-2 py-2 rounded-lg cursor-pointer">Cambia foto</label>
                        <input id="edit-recipe-photo-${recipe.id}" type="file" accept="image/*" onchange="previewRecipePhoto(this, '${recipe.id}')" class="sr-only">
                        <button type="button" onclick="removeEditedRecipePhoto('${recipe.id}')" class="w-full text-[10px] text-[#c7b3a6] hover:text-rose-300">Rimuovi foto</button>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="bg-[#b5c99a] text-[#1c1817] text-xs font-bold px-4 py-2 rounded-xl active:scale-95">Salva modifiche</button>
                    <button type="button" onclick="cancelRecipeEdit()" class="bg-[#382d2a] text-[#e8c2ca] text-xs font-semibold px-4 py-2 rounded-xl active:scale-95">Annulla</button>
                </div>
            </form>
        `;
    }

    return `
        <article class="recipe-card ${recipe.photo ? 'has-photo' : 'no-photo'}">
            <div class="recipe-card-content space-y-2">
                <h5 class="font-cloud font-bold text-base text-[#f3d5b5] break-words">${escapeRecipeHTML(recipe.title)}</h5>
                ${recipe.description ? `
                    <p class="text-sm text-[#d9ccbf] leading-relaxed whitespace-pre-wrap break-words ${recipe.description.length > 140 ? 'recipe-description-collapsed' : ''}">${escapeRecipeHTML(recipe.description)}</p>
                    ${recipe.description.length > 140 ? '<button type="button" onclick="toggleRecipeDescription(this)" class="text-xs font-bold text-[#e8c2ca]">Mostra tutto</button>' : ''}
                ` : ''}
            </div>
            ${recipe.photo ? `<img src="${recipe.photo}" alt="${escapeRecipeHTML(recipe.title)}" class="recipe-card-photo rounded-xl border border-[#e8c2ca]/20 shadow-md">` : ''}
            <div class="recipe-card-actions">
                <button type="button" onclick="startRecipeEdit('${recipe.id}')" aria-label="Modifica ${escapeRecipeHTML(recipe.title)}" title="Modifica ricetta" class="w-8 h-8 rounded-full bg-[#1c1817]/45 text-[#c7b3a6] hover:text-[#e8c2ca] transition-colors">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" onclick="deleteRecipe('${category.id}', '${recipe.id}')" aria-label="Elimina ${escapeRecipeHTML(recipe.title)}" title="Elimina ricetta" class="w-8 h-8 rounded-full bg-[#1c1817]/45 text-[#c7b3a6] hover:text-rose-300 transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </article>
    `;
}

function toggleRecipeCategoryForm() {
    recipeCategoryFormOpen = !recipeCategoryFormOpen;
    renderRecipes();
    if (recipeCategoryFormOpen) document.getElementById('recipe-category-name')?.focus();
}

function cancelRecipeCategoryForm() {
    recipeCategoryFormOpen = false;
    const form = document.getElementById('recipe-category-form');
    form?.reset();
    renderRecipes();
}

function addRecipeCategory(event) {
    event.preventDefault();
    const input = document.getElementById('recipe-category-name');
    const name = input?.value.trim();
    if (!name) return;

    const categories = loadRecipeCategories();
    const categoryId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    categories.push({ id: categoryId, name, recipes: [] });
    if (!saveRecipeCategories(categories)) return;

    recipeCategoryFormOpen = false;
    renderRecipes();
}

function toggleRecipeForm(categoryId) {
    activeRecipeFormId = activeRecipeFormId === categoryId ? null : categoryId;
    renderRecipes();
    if (activeRecipeFormId) document.getElementById(`recipe-title-${categoryId}`)?.focus();
}

function deleteRecipe(categoryId, recipeId) {
    if (!window.confirm('Vuoi eliminare questa ricetta?')) return;
    const categories = loadRecipeCategories();
    const category = categories.find(item => item.id === categoryId);
    if (!category) return;
    category.recipes = (category.recipes || []).filter(recipe => recipe.id !== recipeId);
    if (saveRecipeCategories(categories)) renderRecipes();
}

function startRecipeEdit(recipeId) {
    activeRecipeEditId = recipeId;
    activeRecipePhotoRemoved = false;
    renderRecipes();
    document.getElementById(`edit-recipe-title-${recipeId}`)?.focus();
}

function cancelRecipeEdit() {
    activeRecipeEditId = null;
    activeRecipePhotoRemoved = false;
    renderRecipes();
}

async function saveEditedRecipe(event, categoryId, recipeId) {
    event.preventDefault();
    const title = document.getElementById(`edit-recipe-title-${recipeId}`)?.value.trim();
    const description = document.getElementById(`edit-recipe-description-${recipeId}`)?.value.trim() || '';
    const photoInput = document.getElementById(`edit-recipe-photo-${recipeId}`);
    if (!title) return;

    document.getElementById('recipe-status')?.classList.add('hidden');
    try {
        const categories = loadRecipeCategories();
        const category = categories.find(item => item.id === categoryId);
        const recipe = category?.recipes.find(item => item.id === recipeId);
        if (!recipe) return;
        if (photoInput?.files?.[0]) recipe.photo = await resizeRecipePhoto(photoInput.files[0]);
        else if (activeRecipePhotoRemoved) recipe.photo = '';
        recipe.title = title;
        recipe.description = description;
        if (!saveRecipeCategories(categories)) return;
        activeRecipeEditId = null;
        activeRecipePhotoRemoved = false;
        renderRecipes();
    } catch (error) {
        showRecipeStatus(error.message || 'Non è stato possibile modificare la ricetta.');
    }
}

function removeEditedRecipePhoto(recipeId) {
    if (activeRecipeEditId !== recipeId) return;
    activeRecipePhotoRemoved = true;
    const preview = document.getElementById(`recipe-photo-preview-${recipeId}`);
    const placeholder = document.getElementById(`recipe-photo-placeholder-${recipeId}`);
    const input = document.getElementById(`edit-recipe-photo-${recipeId}`);
    if (preview) preview.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
    if (input) input.value = '';
}

function toggleRecipeDescription(button) {
    const description = button.previousElementSibling;
    const isCollapsed = description.classList.toggle('recipe-description-collapsed');
    button.innerText = isCollapsed ? 'Mostra tutto' : 'Mostra meno';
}

function deleteRecipeCategory(categoryId) {
    const categories = loadRecipeCategories();
    const category = categories.find(item => item.id === categoryId);
    if (!category || !window.confirm(`Eliminare la sezione "${category.name}" e tutte le sue ricette?`)) return;

    const remainingCategories = categories.filter(item => item.id !== categoryId);
    if (!saveRecipeCategories(remainingCategories)) return;
    if (activeRecipeFormId === categoryId) activeRecipeFormId = null;
    renderRecipes();
}

function previewRecipePhoto(input, categoryId) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const preview = document.getElementById(`recipe-photo-preview-${categoryId}`);
        const placeholder = document.getElementById(`recipe-photo-placeholder-${categoryId}`);
        if (!preview || !placeholder) return;
        preview.src = reader.result;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
        if (activeRecipeEditId === categoryId) activeRecipePhotoRemoved = false;
    };
    reader.readAsDataURL(file);
}

function resizeRecipePhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Impossibile leggere la foto.'));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error('Il file selezionato non è un’immagine valida.'));
            image.onload = () => {
                const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                const context = canvas.getContext('2d');
                if (!context) {
                    reject(new Error('Impossibile elaborare la foto.'));
                    return;
                }
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

async function addRecipe(event, categoryId) {
    event.preventDefault();
    const titleInput = document.getElementById(`recipe-title-${categoryId}`);
    const descriptionInput = document.getElementById(`recipe-description-${categoryId}`);
    const photoInput = document.getElementById(`recipe-photo-${categoryId}`);
    const title = titleInput?.value.trim();
    if (!title) return;

    const status = document.getElementById('recipe-status');
    status?.classList.add('hidden');
    try {
        const photo = photoInput?.files?.[0] ? await resizeRecipePhoto(photoInput.files[0]) : '';
        const categories = loadRecipeCategories();
        const category = categories.find(item => item.id === categoryId);
        if (!category) return;
        category.recipes.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            description: descriptionInput?.value.trim() || '',
            photo
        });
        if (!saveRecipeCategories(categories)) return;
        activeRecipeFormId = null;
        renderRecipes();
    } catch (error) {
        showRecipeStatus(error.message || 'Non è stato possibile aggiungere la ricetta.');
    }
}

// GESTIONE CAMBIO TAB
function switchTab(tabName) {
    const header = document.getElementById('app-header');
    const headerTitle = document.getElementById('header-title');
    const homeBg = document.getElementById('home-bg');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-[#e8c2ca]');
        btn.classList.add('text-[#9c8a80]');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.remove('text-[#9c8a80]');
        activeTab.classList.add('text-[#e8c2ca]');
    }

    const currentActiveSec = document.querySelector('main > section.active-section');
    const targetSection = document.getElementById(`sec-${tabName}`);

    if (currentActiveSec === targetSection) return;

    if (currentActiveSec) {
        currentActiveSec.classList.remove('active-section');
        setTimeout(() => {
            currentActiveSec.classList.add('hidden');
            showNewSection(targetSection, tabName, header, headerTitle, homeBg);
        }, 180);
    } else {
        showNewSection(targetSection, tabName, header, headerTitle, homeBg);
    }
}

function showNewSection(targetSection, tabName, header, headerTitle, homeBg) {
    const appContent = document.getElementById('app-content');
    if (appContent) appContent.classList.toggle('home-dashboard-active', tabName === 'home');

    if (targetSection) {
        targetSection.classList.remove('hidden');
        setTimeout(() => {
            targetSection.classList.add('active-section');
        }, 20);
    }

    if (homeBg) homeBg.style.display = 'block';

    if(tabName === 'home') {
        header.classList.add('hidden');
        updateDateTime();
        initHomeDashboard();
    } else {
        header.classList.remove('hidden');
        
        if(tabName === 'diario') {
            headerTitle.innerText = "Diario & Ricordi ☁️";
            cleanOldDiaryNotes();
            selectDiaryDate(activeDiaryDate);
            renderPhotoGalleries();
        }
        else if(tabName === 'casa') headerTitle.innerText = "Gestione Casa 🌿";
        else if(tabName === 'spese') {
            headerTitle.innerText = "Gestione Spese 🎀";
            renderShoppingList();
        }
        else if(tabName === 'universita') headerTitle.innerText = "Zona Università ☕";
        else if(tabName === 'gym') {
            headerTitle.innerText = "Gym 💪";
            renderGymCalendar();
        }
        else if(tabName === 'posti') headerTitle.innerText = "Posti Preferiti 📍";
        else if(tabName === 'ricette') {
            headerTitle.innerText = "Ricette 🍲";
            renderRecipes();
        }
    }
}

// Avvio automatico
document.addEventListener('DOMContentLoaded', () => {
    initTrashDates();
    initExams();
    initUniversitySchedule();
    renderGymCalendar();
    initWeather();
    initMoodTracker();
    switchTab('home');
});