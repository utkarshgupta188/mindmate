// backend/firebaseAdmin.js
import admin from 'firebase-admin'

let adminApp = null

function init() {
  if (adminApp) return adminApp
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT
  try {
    if (svc) {
      const creds = JSON.parse(svc)
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(creds)
      })
      // eslint-disable-next-line no-console
      console.log('✅ Firebase Admin initialized')
    } else {
      // eslint-disable-next-line no-console
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set; Firebase token verification disabled')
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to initialize Firebase Admin:', e)
  }
  return adminApp
}

export function isFirebaseAdminReady() {
  return !!init()
}

export async function verifyFirebaseIdToken(idToken) {
  const app = init()
  if (!app) throw new Error('Firebase Admin not initialized')
  return admin.auth().verifyIdToken(idToken)
}
