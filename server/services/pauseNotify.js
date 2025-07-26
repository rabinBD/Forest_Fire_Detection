//to pause notifications and emails for a certain period of time
let lastNotificationTime = null;
let lastEmailTime = null;
const {db} = require('../config/firebase');

const EMAIL_COOLDOWN_MIN = 5;
const NOTIFICATION_COOLDOWN_MIN = 1;

const canSendEmail = () =>{
  const now = Date.now();
  if (!lastEmailTime || (now - lastEmailTime) > EMAIL_COOLDOWN_MIN * 60 * 1000) {
    lastEmailTime = now;
    return true;
  }
  return false;
}

const canSendNotification = () => {
  const now = Date.now();
  if (!lastNotificationTime || (now - lastNotificationTime) > NOTIFICATION_COOLDOWN_MIN * 60 * 1000) {
    lastNotificationTime = now;
    return true;
  }
  return false;
}

const checkLongSuppression = async () =>{
    const settingsDocs = await db.collection('settings').doc('notification_control').get();
    if(!settingsDocs.exists) {
      console.log('No settings document found, assuming no suppression');
      return false;
    }

    const settingsData = settingsDocs.data();
    if(!settingsData.longSuppression) return false;

    const suppressedAt = new Date(settingsData.suppressedAt).getTime()
    const now = Date.now();
    const duration = (settingsData.suppressionDurationHours || 24)* 60 * 60 * 1000; 

    if((now - suppressedAt) >= duration) {
        await db.collection('settings').doc('notification_control').update({
          longSuppression: false,
          resumeAt: new Date().toLocaleString(),
          autoResumed: true
        })

    await db.collection('notification_log').add({
        action: 'resumed (long)',
        timestamp: new Date().toLocaleString(),
        by: 'system',
        auto: true
    })
    return false;
}
return true;
}



module.exports = { canSendEmail, canSendNotification, checkLongSuppression };
