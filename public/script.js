const menu = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
const modal = document.querySelector('.modal');
const form = document.querySelector('#booking-form');
const head = document.querySelector('.form-head');
const success = document.querySelector('.success');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
function choose(service){document.querySelectorAll('.choice button').forEach(b=>b.classList.toggle('selected',b.dataset.service===service));document.querySelector('.form-head h2').textContent=service==='dispatch'?'Where should we deliver?':service==='rider'?'Ride with MaraGo':'Where are we going?'}
document.querySelectorAll('.open-booking').forEach(b=>b.addEventListener('click',()=>{form.hidden=false;head.hidden=false;success.hidden=true;choose(b.dataset.service||'ride');modal.showModal()}));
document.querySelectorAll('.choice button').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.service)));
document.querySelector('.close').addEventListener('click',()=>modal.close());document.querySelector('.done').addEventListener('click',()=>modal.close());
form.addEventListener('submit',e=>{e.preventDefault();form.hidden=true;head.hidden=true;success.hidden=false});
