
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "account-lockout-analyzer.firebaseapp.com";
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "account-lockout-analyzer";
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "account-lockout-analyzer.appspot.com";
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1005710075157";
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1005710075157:web:76b8139a68b55d29e7351c";
const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional, for Analytics

let app: FirebaseApp | undefined;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side
  if (!firebaseApiKey || firebaseApiKey === "TU_FIREBASE_WEB_API_KEY") { // Check for placeholder too
    console.warn(
      "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is not defined or is a placeholder in environment variables. " +
      "Firebase SDK will not be initialized. Firebase-dependent features like Analytics will be disabled."
    );
  } else {
    const firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId // Can be undefined if not using Analytics extensively
    };

    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
      } catch (initError) {
        console.error("Firebase: Failed to initialize Firebase app:", initError);
        // app remains undefined
      }
    } else {
      app = getApp();
    }
  
    // Check if app was successfully initialized and Analytics is supported & configured
    if (app && app.name && firebaseConfig.measurementId) {
      isAnalyticsSupported().then((supported) => {
        if (supported) {
          try {
            analytics = getAnalytics(app!); // app is guaranteed to be defined here if we reach this point
          } catch (error) {
            console.error("Firebase: Failed to initialize Firebase Analytics:", error);
            // analytics remains null
          }
        } else {
          console.warn("Firebase: Firebase Analytics is not supported in this environment.");
        }
      }).catch(err => {
          console.error("Firebase: Error checking Analytics support:", err);
      });
    } else if (app && app.name && !firebaseConfig.measurementId) {
        console.info("Firebase: Firebase App initialized. Measurement ID not provided, so Firebase Analytics is not initialized.");
    }
  }
}

// Export app as potentially undefined if you want consuming code to check
export { app, analytics };
