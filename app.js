/* ── Elements ── */
const serviceButtons = document.querySelectorAll('.service-switch button');
const fare = document.querySelector('#fare');
const pickup = document.querySelector('#pickup');
const destination = document.querySelector('#destination');
const views = { booking: document.querySelector('#booking-view'), tracking: document.querySelector('#tracking-view'), progress: document.querySelector('#progress-view'), complete: document.querySelector('#complete-view') };

/* ── View switching ── */
function show(name) { Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; }); window.scrollTo(0, 0); }

/* ── Service selection ── */
serviceButtons.forEach(button => button.addEventListener('click', () => {
  serviceButtons.forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  fare.textContent = button.dataset.service === 'dispatch' ? '₦800 – ₦1,200' : '₦700 – ₦1,000';
}));

/* ── Recent places ── */
document.querySelectorAll('.place').forEach(place => place.addEventListener('click', () => { destination.value = place.dataset.place; destination.focus(); }));

/* ── Booking → Tracking (searching) ── */
document.querySelector('#trip-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#track-pickup').textContent = pickup.value;
  document.querySelector('#track-destination').textContent = destination.value;
  document.querySelector('#map-label').textContent = 'Finding a nearby rider…';
  document.querySelector('#trip-status span').textContent = 'SEARCHING FOR A RIDER';
  document.querySelector('#trip-headline').textContent = "We're finding your rider.";
  document.querySelector('#trip-detail').textContent = 'Keep this screen open while we match you.';
  document.querySelector('#rider-name').textContent = 'MaraGo rider matching';
  document.querySelector('#rider-info').textContent = 'Please wait…';
  document.querySelector('#rider-rating').textContent = '';
  document.querySelector('#call-rider').hidden = true;
  document.querySelector('#cancel-btn').hidden = false;
  show('tracking');

  /* Simulate rider acceptance after 3 seconds */
  setTimeout(() => {
    if (views.tracking.hidden) return;
    document.querySelector('#map-label').textContent = 'Rider is 3 mins away';
    document.querySelector('#trip-status span').textContent = 'RIDER IS ON THE WAY';
    document.querySelector('#trip-status').classList.add('live');
    document.querySelector('#trip-headline').textContent = 'Your trip is moving.';
    document.querySelector('#trip-detail').textContent = 'Ibrahim will arrive in about 3 minutes.';
    document.querySelector('#rider-name').textContent = 'Ibrahim Musa';
    document.querySelector('#rider-info').textContent = 'Honda Ace • ABC 123 DE';
    document.querySelector('#rider-rating').textContent = '4.9 ★';
    document.querySelector('#call-rider').hidden = false;

    /* Simulate rider arrival / start trip after another 4 seconds */
    setTimeout(() => {
      if (views.tracking.hidden) return;
      document.querySelector('#prog-pickup').textContent = pickup.value;
      document.querySelector('#prog-destination').textContent = destination.value;
      show('progress');

      /* Simulate trip completion after 5 seconds */
      setTimeout(() => {
        if (views.progress.hidden) return;
        document.querySelector('#comp-pickup').textContent = pickup.value;
        document.querySelector('#comp-destination').textContent = destination.value;
        const activeService = document.querySelector('.service-switch .active');
        document.querySelector('#comp-fare').textContent = activeService?.dataset.service === 'dispatch' ? '₦1,000' : '₦850';
        show('complete');
      }, 5000);
    }, 4000);
  }, 3000);
});

/* ── Cancel ── */
document.querySelector('#cancel-btn').addEventListener('click', () => {
  show('booking');
  destination.value = '';
});

/* ── Back ── */
document.querySelector('.back').addEventListener('click', () => {
  show('booking');
});

/* ── Star rating ── */
document.querySelectorAll('#stars button').forEach(star => star.addEventListener('click', () => {
  const rating = parseInt(star.dataset.star);
  document.querySelectorAll('#stars button').forEach((s, i) => {
    s.classList.toggle('filled', i < rating);
  });
}));

/* ── Done ── */
document.querySelector('#done-btn').addEventListener('click', () => {
  destination.value = '';
  document.querySelectorAll('#stars button').forEach(s => s.classList.remove('filled'));
  show('booking');
});
