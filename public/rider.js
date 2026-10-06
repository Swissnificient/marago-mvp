/* ── Elements ── */
const views = {
  home: document.querySelector('#home-view'),
  request: document.querySelector('#request-view'),
  active: document.querySelector('#active-view'),
  trip: document.querySelector('#trip-view'),
  complete: document.querySelector('#complete-view')
};
const toggle = document.querySelector('#status-toggle');
let tripCount = 0;
let totalEarnings = 0;

/* ── View switching ── */
function show(name) {
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  window.scrollTo(0, 0);
}

/* ── Go online / offline ── */
toggle.addEventListener('click', () => {
  const online = toggle.classList.toggle('online');
  toggle.classList.toggle('offline', !online);
  toggle.querySelector('span').textContent = online ? 'Online' : 'Offline';
  if (online) {
    /* Simulate incoming request after 2 seconds */
    setTimeout(() => {
      if (views.home.hidden) return;
      show('request');
    }, 2000);
  }
});

/* ── Decline ── */
document.querySelector('#decline').addEventListener('click', () => {
  show('home');
});

/* ── Accept → heading to pickup ── */
document.querySelector('#accept').addEventListener('click', () => {
  show('active');
});

/* ── Arrived at pickup → start trip ── */
document.querySelector('#arrived').addEventListener('click', () => {
  show('trip');
});

/* ── Complete trip ── */
document.querySelector('#complete-trip').addEventListener('click', () => {
  tripCount++;
  totalEarnings += 850;
  document.querySelector('#earnings-total').textContent = `₦${totalEarnings.toLocaleString()}`;
  document.querySelector('#earnings-trips').textContent = `${tripCount} trip${tripCount > 1 ? 's' : ''} completed`;
  show('complete');
});

/* ── Support ── */
document.querySelector('#support').addEventListener('click', () => {
  alert('MaraGo support will be available here in the live app.');
});

/* ── Back online from completion ── */
document.querySelector('#back-online').addEventListener('click', () => {
  show('home');
  toggle.classList.add('online');
  toggle.classList.remove('offline');
  toggle.querySelector('span').textContent = 'Online';
  /* Simulate next request after a short wait */
  setTimeout(() => {
    if (views.home.hidden) return;
    show('request');
  }, 3000);
});
