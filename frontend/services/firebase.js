import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_VITE_authDomain,
  databaseURL: import.meta.env.VITE_databaseURL,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const messaging = getMessaging(app);

export const onMessageListener = () => {
  const unsubscribe = onMessage(messaging, payload => console.log('message payload: ', payload));
  return unsubscribe;
}

export const getFCMToken = async () => {
  return await getToken(messaging, { vapidKey: import.meta.env.VITE_vapidKey });
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

// Real-time foreground FCM listener
export const setupFCMListener = (cb) => {
  onMessage(messaging, (payload) => {
    console.log("FCM foreground message:", payload);
    cb(payload.notification);
  });
};