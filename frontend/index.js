// Push notification logic.

const VAPID_PUBLIC_KEY = 'BL4TdSQYnTKtDwo2oCxsw7FuVP7K96YgfhygDjjQD1Yg6YIFnVEap-m85LaOFC_rm4IJ_HZQVQUCEB5r6lUPIdw';

const subscribeButton = document.getElementById('subscribe');

async function subscribeButtonHandler() {
 subscribeButton.disabled = true;
  const result = await Notification.requestPermission();
  if (result === 'denied') {
    console.error('The user explicitly denied the permission request.');
    return;
  }
  if (result === 'granted') {
    console.info('The user accepted the permission request.');
  }
  const registration = await navigator.serviceWorker.getRegistration();
  const subscribed = await registration.pushManager.getSubscription();
  if (subscribed) {
    console.info('User is already subscribed.');
    return;
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  fetch('http://192.168.2.57/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  });
}


// Convert a base64 string to Uint8Array.
// Must do this so the server can understand the VAPID_PUBLIC_KEY.
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray; 
}

// Startup logic.
if('PushManager' in window){
    document.getElementById('heading').innerText = 'something';
}
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('./serviceWorker.js').then(serviceWorkerRegistration => {
    console.info('Service worker was registered.');
    console.info({serviceWorkerRegistration});
  }).catch(error => {
    console.error('An error occurred while registering the service worker.');
    console.error(error);
  });
  subscribeButton.disabled = false;
} else {
  console.error('Browser does not support service workers or push messages.');
}

subscribeButton.addEventListener('click', subscribeButtonHandler);

