import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCdW8uDO8Uy27UwmKK49TS5riNnB1mOGT0",
  authDomain: "fire-detection-ca65d.firebaseapp.com",
  projectId: "fire-detection-ca65d",
  storageBucket: "fire-detection-ca65d.firebasestorage.app",
  messagingSenderId: "421747700938",
  appId: "1:421747700938:web:cd92a2e2fa4b2edef5b033"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const messaging = getMessaging(app);

export const onMessageListener = () => {
  const unsubscribe = onMessage(messaging, payload => console.log('message payload: ', payload));
  return unsubscribe;
}

export const getFCMToken = async () => {
  return await getToken(messaging, { vapidKey: "BPROcKH3qUk7KCzSPLgLLjo8imMQIXm3SE44cx8WdOcsO5MgXNbwu68d-oA75fppCgf_F2mZCVI0285KdoV-0gI" });
}

export function requestPermission() {
  console.log('Requesting permission...');
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then(worker => console.log(worker))
        .catch(err => console.error('service worker error: ', err));
    } else {
      console.warn('Permission denied')
    }
  }).catch(err => console.error(err));
};