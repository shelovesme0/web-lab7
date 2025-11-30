// ---------------- Загальна частина ----------------
const playButton   = document.getElementById('playButton');
const work         = document.getElementById('work');
const block5Content = document.getElementById('block5Content');

const closeButton  = document.getElementById('closeButton');
const startButton  = document.getElementById('startButton');
const stopButton   = document.getElementById('stopButton');
const reloadButton = document.getElementById('reloadButton');

const messagesList = document.getElementById('messagesList');
const logTableContainer = document.getElementById('logTableContainer');

const anim   = document.getElementById('anim');
const circle = document.getElementById('circle');

let eventCounter = 0;
let localEvents = [];

// Ініціалізація LocalStorage
function initLocalStorage() {
  const stored = localStorage.getItem('animEvents');
  if (stored) {
    try {
      localEvents = JSON.parse(stored);
      if (!Array.isArray(localEvents)) localEvents = [];
    } catch (e) {
      localEvents = [];
    }
  }
  eventCounter = localEvents.length;
}

initLocalStorage();

function saveLocalEvents() {
  localStorage.setItem('animEvents', JSON.stringify(localEvents));
}

// Додавання повідомлення праворуч у controls
function addMessage(text) {
  const li = document.createElement('li');
  li.textContent = text;
  messagesList.appendChild(li);
}

// Логування події (2 способи)
function logEvent(message, type) {
  eventCounter += 1;
  const now = new Date();
  const timeLocal = now.toISOString();

  const eventObj = {
    id: eventCounter,
    timeLocal: timeLocal,
    message: message,
    type: type
  };

  // Спосіб 1 — миттєва відправка на сервер
  fetch('log_event.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(eventObj)
  }).catch(() => {});

  // Спосіб 2 — LocalStorage
  localEvents.push({
    id: eventObj.id,
    timeLocal: eventObj.timeLocal,
    message: eventObj.message,
    type: eventObj.type
  });
  saveLocalEvents();
}


// ---------------- Анімація кола ----------------
const radius = 15;
const directions = [
  {dx: -1, dy: 0},  // вліво
  {dx: 0,  dy: 1},  // вниз
  {dx: 1,  dy: 0},  // вправо
  {dx: 0,  dy: -1}  // вгору
];

let dirIndex = 0;
let stepSize = 1;
let posX = 0;
let posY = 0;

let animTimer = null;
let directionTimer = null;
let touchingWall = false;

// Початкове позиціонування кола в центр
function resetCircle() {
  const rect = anim.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  posX = width / 2;
  posY = height / 2;
  stepSize = 1;
  dirIndex = 0;
  touchingWall = false;

  updateCirclePosition();
}

// Оновлення положення елемента
function updateCirclePosition() {
  circle.style.left = (posX - radius) + 'px';
  circle.style.top  = (posY - radius) + 'px';
}


// Запуск анімації
function startAnimation() {
  if (animTimer) return;
  resetCircle();

  logEvent('Натиснуто кнопку start – анімація запущена', 'start');
  addMessage('start: анімація запущена');

  startButton.classList.add('hidden');
  stopButton.classList.remove('hidden');
  reloadButton.classList.add('hidden');

  // Кроки кола
  animTimer = setInterval(moveStep, 80);

  // ЗМІНА НАПРЯМКУ КОЖНІ 0.5 СЕКУНДИ
  directionTimer = setInterval(() => {
    dirIndex = (dirIndex + 1) % directions.length;
  }, 500);
}


// Зупинка анімації
function stopAnimation(reasonText, reasonType) {
  if (animTimer) {
    clearInterval(animTimer);
    animTimer = null;
  }

  if (directionTimer) {
    clearInterval(directionTimer);
    directionTimer = null;
  }

  if (reasonText) {
    logEvent(reasonText, reasonType);
    addMessage(reasonText);
  }
}


// Один крок руху
function moveStep() {
  const rect = anim.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const dir = directions[dirIndex];

  posX += dir.dx * stepSize;
  posY += dir.dy * stepSize;
  stepSize += 1;

  updateCirclePosition();

  logEvent(
    `Крок ${eventCounter}: X=${posX.toFixed(1)}, Y=${posY.toFixed(1)}, крок=${stepSize - 1}`,
    'step'
  );

  const left   = posX - radius;
  const right  = posX + radius;
  const top    = posY - radius;
  const bottom = posY + radius;

  // Виліт
  if (right < 0 || left > width || bottom < 0 || top > height) {
    stopAnimation('Виліт круга за межі anim – анімацію зупинено', 'out');
    stopButton.classList.add('hidden');
    reloadButton.classList.remove('hidden');
    return;
  }

  // Дотик до стінки
  if (!touchingWall &&
      (left <= 0 || right >= width || top <= 0 || bottom >= height)) {

    touchingWall = true;

    stopAnimation('Круг доторкнувся до стінки anim – очікується reload', 'wall');
    stopButton.classList.add('hidden');
    reloadButton.classList.remove('hidden');
    return;
  }
}


// ---------------- Обробники кнопок ----------------
playButton.addEventListener('click', () => {
  block5Content.classList.add('hidden');
  work.classList.remove('hidden');
  addMessage('Відкрито робочу область work');
  logEvent('Натиснуто кнопку play – показано work', 'play');
});

closeButton.addEventListener('click', () => {
  stopAnimation('Натиснуто кнопку close – робочу область приховано', 'close');

  startButton.classList.remove('hidden');
  stopButton.classList.add('hidden');
  reloadButton.classList.add('hidden');

  work.classList.add('hidden');
  block5Content.classList.remove('hidden');

  sendLocalEventsToServer();

  Promise.all([
    fetch('get_events.php').then(r => r.ok ? r.json() : [] ).catch(() => []),
    Promise.resolve(localEvents)
  ]).then(([serverEvents, lsEvents]) => {
    renderEventsTable(serverEvents || [], lsEvents || []);
  });
});

startButton.addEventListener('click', () => {
  startAnimation();
});

stopButton.addEventListener('click', () => {
  stopAnimation('Натиснуто кнопку stop – анімацію зупинено користувачем', 'stop');
  stopButton.classList.add('hidden');
  startButton.classList.remove('hidden');
});

reloadButton.addEventListener('click', () => {
  logEvent('Натиснуто кнопку reload – коло повернуто в центр', 'reload');
  addMessage('reload: стан анімації скинуто');
  reloadButton.classList.add('hidden');
  startButton.classList.remove('hidden');
  resetCircle();
});


// ---------------- Другий спосіб: відправка LocalStorage ----------------
function sendLocalEventsToServer() {
  if (!localEvents.length) return;

  fetch('save_local_events.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(localEvents)
  }).catch(() => {});
}


// ---------------- Формування таблиці ----------------
function renderEventsTable(serverEvents, lsEvents) {
  let html = '<table class="log-table">';
  html += '<thead><tr>' +
    '<th>#</th>' +
    '<th>Спосіб 1 – негайне збереження на сервері</th>' +
    '<th>Спосіб 2 – акумуляція в LocalStorage</th>' +
    '</tr></thead><tbody>';

  const maxLen = Math.max(serverEvents.length, lsEvents.length);

  for (let i = 0; i < maxLen; i++) {
    const s = serverEvents[i];
    const l = lsEvents[i];

    const serverText = s
      ? `[${s.time_server || s.timeLocal}] (${s.type}) ${s.message}`
      : '';

    const localText = l
      ? `[${l.timeLocal}] (${l.type}) ${l.message}`
      : '';

    html += `<tr>
      <td>${i + 1}</td>
      <td>${serverText}</td>
      <td>${localText}</td>
    </tr>`;
  }

  html += '</tbody></table>';
  logTableContainer.innerHTML = html;
}
