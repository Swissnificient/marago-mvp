const home=document.querySelector('#home-view');
const request=document.querySelector('#request-view');
const active=document.querySelector('#active-view');
const toggle=document.querySelector('#status-toggle');
toggle.addEventListener('click',()=>{const online=toggle.classList.toggle('online');toggle.querySelector('span').textContent=online?'Online':'Offline';if(online){home.hidden=true;request.hidden=false}});
document.querySelector('#decline').addEventListener('click',()=>{request.hidden=true;home.hidden=false});
document.querySelector('#accept').addEventListener('click',()=>{request.hidden=true;active.hidden=false});
document.querySelector('#arrived').addEventListener('click',()=>{alert('Customer has been notified that you have arrived.');});
document.querySelector('#support').addEventListener('click',()=>{alert('MaraGo support will be available here in the live app.');});
