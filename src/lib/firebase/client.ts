
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from "firebase/analytics";

// Helper function to get env var or fallback with a warning
function getEnvWithFallback(
  envVarName: string,
  fallbackValue: string,
  isCritical: boolean = false,
  specificPlaceholder?: string // Mantener para compatibilidad
): string | undefined { // Permitir undefined si es crítico y falta
  const envValue = process.env[envVarName];
  const placeholders = ["YOUR_PLACEHOLDER", "TU_VALOR_AQUI", "TU_FIREBASE_WEB_API_KEY"];
  if (specificPlaceholder) {
    placeholders.push(specificPlaceholder);
  }

  if (!envValue || envValue.trim() === "" || placeholders.includes(envValue)) {
    if (isCritical && (!fallbackValue || fallbackValue.trim() === "" || placeholders.includes(fallbackValue))) {
      console.error(
        `Firebase Config: Error Crítico - La variable de entorno esencial "${envVarName}" falta o es un placeholder, y no tiene un valor de fallback funcional. Firebase SDK no se inicializará.`
      );
      return undefined; // Devuelve undefined si es crítico y falta sin fallback válido
    }
    console.warn(
      `Firebase Config: La variable de entorno "${envVarName}" no está definida o es un placeholder. ` +
      (fallbackValue && !placeholders.includes(fallbackValue) ? `Usando valor de fallback que comienza con: "${fallbackValue.substring(0,15)}..."` : `No se usará valor de fallback válido.`)
    );
    return fallbackValue;
  }
  return envValue;
}

// Your web app's Firebase configuration is now constructed conditionally
const firebaseApiKey = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_API_KEY", "", true, "TU_FIREBASE_WEB_API_KEY");
const firebaseAuthDomain = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "account-lockout-analyzer.firebaseapp.com");
const firebaseProjectId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "account-lockout-analyzer", true);
const firebaseStorageBucket = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "account-lockout-analyzer.appspot.com");
const firebaseMessagingSenderId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "1005710075157");
const firebaseAppId = getEnvWithFallback("NEXT_PUBLIC_FIREBASE_APP_ID", "1:1005710075157:web:76b8139a68b55d29e7351c", true);
const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

let app: FirebaseApp | undefined;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side
  if (firebaseApiKey && firebaseProjectId && firebaseAppId) { // Asegurar que las variables críticas tienen valor y no son undefined
    const firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId && firebaseMeasurementId.trim() !== "" && !placeholderKeys.includes(firebaseMeasurementId) ? firebaseMeasurementId : undefined
    };

    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        console.info("Firebase: App inicializada exitosamente con Project ID:", firebaseConfig.projectId);
      } catch (initError) {
        console.error("Firebase: Falló la inicialización de la app Firebase:", initError, "con config:", JSON.stringify(firebaseConfig, (key, value) => key === 'apiKey' ? 'REDACTED' : value));
        app = undefined; 
      }
    } else {
      app = getApp();
      console.info("Firebase: App existente obtenida con Project ID:", app.options.projectId);
    }
  
    if (app && app.name && firebaseConfig.measurementId) {
      isAnalyticsSupported().then((supported) => {
        if (supported) {
          try {
            analytics = getAnalytics(app!); 
            console.info("Firebase: Analytics inicializado para Measurement ID:", firebaseConfig.measurementId);
          } catch (error) {
            console.error("Firebase: Falló la inicialización de Firebase Analytics:", error);
          }
        } else {
          console.warn("Firebase: Firebase Analytics no es compatible en este entorno.");
        }
      }).catch(err => {
          console.error("Firebase: Error verificando compatibilidad de Analytics:", err);
      });
    } else if (app && app.name) {
      console.info("Firebase: App inicializada. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID no proporcionado, es un placeholder, o está vacío. Firebase Analytics no se inicializará.");
    }
  } else {
     console.error(
      "Firebase: Faltan configuraciones críticas (API Key, Project ID, o App ID) o son inválidas/placeholders. " +
      "Firebase SDK no se inicializará. Funcionalidades dependientes de Firebase podrían estar deshabilitadas."
    );
    app = undefined; 
  }
}

export { app, analytics };

