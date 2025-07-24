const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.databaseURL
});

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

module.exports = { admin, db, auth, messaging,};