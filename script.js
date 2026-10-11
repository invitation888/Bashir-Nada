// ================= Intro video =================
const WEDDING_DATE = new Date('2026-11-25T18:00:00');
// How many seconds before the end of the video the fade-out starts
// (increase this number to make the intro shorter)
const VIDEO_CUT_SECONDS = 3;

const intro = document.getElementById('intro');
const video = document.getElementById('introVideo');
const overlay = document.getElementById('introOverlay');

let opened = false;
let videoFailed = false;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

function openInvitation() {
  if (opened) return;
  opened = true;
  intro.classList.add('hide'); // video keeps playing while it fades out
  document.body.classList.remove('locked');
  document.body.classList.add('opened');
  startPetals();
  playSong();
  setTimeout(() => { video.pause(); intro.remove(); }, 1800);
}

function startVideo() {
  overlay.classList.add('gone');
  if (videoFailed) return openInvitation();
  const playing = video.play();
  if (playing) playing.catch(openInvitation);
}

overlay.addEventListener('click', startVideo);
overlay.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startVideo(); }
});
video.addEventListener('ended', openInvitation);
video.addEventListener('timeupdate', () => {
  if (video.duration && video.currentTime >= video.duration - VIDEO_CUT_SECONDS) openInvitation();
});
video.addEventListener('error', () => { videoFailed = true; });

// ================= Background music =================
const song = document.getElementById('song');
const musicBtn = document.getElementById('musicBtn');

function setMusicState(playing) {
  musicBtn.classList.toggle('playing', playing);
  musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
}

function playSong() {
  // gentle fade-in of the volume
  song.volume = 0;
  song.play().then(() => {
    const fade = setInterval(() => {
      song.volume = Math.min(1, song.volume + 0.05);
      if (song.volume >= 1) clearInterval(fade);
    }, 120);
  }).catch(() => setMusicState(false));
}

song.addEventListener('play', () => setMusicState(true));
song.addEventListener('pause', () => setMusicState(false));
musicBtn.addEventListener('click', () => {
  if (song.paused) { song.volume = 1; song.play(); } else song.pause();
});

// ================= Falling petals =================
function startPetals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.getElementById('petals');

  const spawn = () => {
    if (document.hidden || box.childElementCount > 22) return;
    const p = document.createElement('span');
    const size = 8 + Math.random() * 10;
    p.className = 'petal';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = size + 'px';
    p.style.height = size * 0.8 + 'px';
    p.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
    p.style.animationDuration = 9 + Math.random() * 8 + 's';
    p.addEventListener('animationend', () => p.remove());
    box.appendChild(p);
  };

  for (let i = 0; i < 6; i++) setTimeout(spawn, i * 300);
  setInterval(spawn, 900);
}

// ================= Reveal on scroll =================
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  // small stagger for siblings (timeline items, countdown, etc.)
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.transitionDelay = siblings.indexOf(el) * 0.12 + 's';
  revealObserver.observe(el);
});

// ================= Countdown =================
const cdNums = {};
document.querySelectorAll('.cd-num').forEach(el => { cdNums[el.dataset.unit] = el; });

function updateCountdown() {
  const diff = WEDDING_DATE - new Date();

  if (diff <= 0) {
    document.getElementById('countdown').innerHTML =
      '<p class="script-title">Today we say "I do"!</p>';
    clearInterval(cdTimer);
    return;
  }

  const values = {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };

  for (const unit in values) {
    const el = cdNums[unit];
    const text = String(values[unit]).padStart(2, '0');
    if (el.textContent !== text) {
      el.textContent = text;
      el.classList.remove('tick');
      void el.offsetWidth; // restart animation
      el.classList.add('tick');
    }
  }
}
const cdTimer = setInterval(updateCountdown, 1000);
updateCountdown();

// ================= Add to calendar (.ics) =================
document.getElementById('calendarBtn').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bashir & Nada//Wedding//EN',
    'BEGIN:VEVENT',
    'UID:bashir-nada-wedding-20261125',
    'DTSTART:20261125T180000',
    'DTEND:20261126T000000',
    'SUMMARY:Wedding of Bashir & Nada',
    'LOCATION:St. George Cathedral',
    'DESCRIPTION:We can\'t wait to celebrate with you!',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  link.download = 'Bashir-and-Nada-Wedding.ics';
  link.click();
  URL.revokeObjectURL(link.href);
});

// ================= Love quotes slider =================
const quotes = document.querySelectorAll('.quote');
const dotsBox = document.getElementById('quoteDots');
let quoteIndex = 0;

quotes.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', 'Quote ' + (i + 1));
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => { showQuote(i); restartQuotes(); });
  dotsBox.appendChild(dot);
});

function showQuote(i) {
  quotes[quoteIndex].classList.remove('active');
  dotsBox.children[quoteIndex].classList.remove('active');
  quoteIndex = i;
  quotes[quoteIndex].classList.add('active');
  dotsBox.children[quoteIndex].classList.add('active');
}

let quoteTimer;
function restartQuotes() {
  clearInterval(quoteTimer);
  quoteTimer = setInterval(() => showQuote((quoteIndex + 1) % quotes.length), 5000);
}
restartQuotes();

// ================= RSVP =================
const form = document.getElementById('rsvpForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const nameField = form.elements.name.closest('.field');
  const name = form.elements.name.value.trim();

  if (!name) {
    nameField.classList.add('error');
    form.elements.name.focus();
    return;
  }
  nameField.classList.remove('error');

  const attending = form.elements.attend.value === 'yes';
  document.getElementById('thanksText').textContent = attending
    ? `Dear ${name}, we are overjoyed you'll be celebrating with us. See you on our special day!`
    : `Dear ${name}, you will be missed dearly. Thank you for your love and kind wishes.`;

  form.hidden = true;
  document.getElementById('rsvpThanks').hidden = false;
});
