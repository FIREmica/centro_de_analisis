
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Helper function to get env var or fallback with a warning
function getEnvWithFallback(
  envVarName: string,
  fallbackValue: string,
  isCritical: boolean = false,
  specificPlaceholder?: string
): string {
  const envValue = process.env[envVarName];
  const placeholders = ["YOUR_PLACEHOLDER", "TU_VALOR_AQUI", "TU_FIREBASE_WEB_API_KEY"];
  if (specificPlaceholder) {
    placeholders.push(specificPlaceholder);
  }

  if (!envValue || envValue.trim() === "" || placeholders.includes(envValue)) {
    console.warn(
      `Firebase Config: La variable de entorno "${envVarName}" no está definida o es un placeholder. ` +
      `Usando valor de fallback: "${fallbackValue}". ` +
      `Asegúrate de que esto sea correcto para tu proyecto Firebase o configura la variable en tu archivo .env.local.`
    );
    if (isCritical && (!fallbackValue || fallbackValue.trim() === "")) {
      const errorMessage = `Error Crítico: La configuración esencial de Firebase "${envVarName}" falta y no tiene un valor de fallback válido.`;
      console.error(errorMessage);
      throw new Error(errorMessage); // Detener si una configuración crítica sin fallback está ausente.
    }
    return fallbackValue;
  }
  return envValue;
}

// Your web app's Firebase configuration
const firebaseApiKey = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_API_KEY", "", true, "TU_FIREBASE_WEB_API_KEY"); // API Key is critical, no fallback
const firebaseAuthDomain = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "account-lockout-analyzer.firebaseapp.com");
const firebaseProjectId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "account-lockout-analyzer", true); // Project ID is critical
const firebaseStorageBucket = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "account-lockout-analyzer.appspot.com");
const firebaseMessagingSenderId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "1005710075157");
const firebaseAppId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_APP_ID", "1:1005710075157:web:76b8139a68b55d29e7351c", true); // App ID is critical
const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional, for Analytics

let app: FirebaseApp | undefined;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side
  // Check if API Key was actually resolved (it would have thrown an error in getEnvWithFallback if critical and missing)
  if (firebaseApiKey && firebaseProjectId && firebaseAppId) {
    const firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId || undefined // Ensure it's undefined if not set, not an empty string
    };

    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        console.info("Firebase: App inicializada exitosamente.");
      } catch (initError) {
        console.error("Firebase: Falló la inicialización de la app Firebase:", initError);
        // app remains undefined
      }
    } else {
      app = getApp();
      console.info("Firebase: App existente obtenida.");
    }
  
    // Check if app was successfully initialized and Analytics is supported & configured
    if (app && app.name && firebaseConfig.measurementId && firebaseConfig.measurementId.trim() !== "") {
      isAnalyticsSupported().then((supported) => {
        if (supported) {
          try {
            analytics = getAnalytics(app!); 
            console.info("Firebase: Analytics inicializado.");
          } catch (error) {
            console.error("Firebase: Falló la inicialización de Firebase Analytics:", error);
          }
        } else {
          console.warn("Firebase: Firebase Analytics no es compatible en este entorno.");
        }
      }).catch(err => {
          console.error("Firebase: Error verificando compatibilidad de Analytics:", err);
      });
    } else if (app && app.name && (!firebaseConfig.measurementId || firebaseConfig.measurementId.trim() === "")) {
        console.info("Firebase: App inicializada. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID no proporcionado, Firebase Analytics no se inicializará.");
    }
  } else {
     console.error(
      "Firebase: Faltan configuraciones críticas (API Key, Project ID, o App ID). " +
      "Firebase SDK no se inicializará. Funcionalidades dependientes de Firebase serán deshabilitadas."
    );
  }
}

export { app, analytics };
