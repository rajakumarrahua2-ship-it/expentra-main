import admin from "firebase-admin";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp;

const initializeFirebase = async () => {
    try {
        if (admin.apps.length > 0) {
            firebaseApp = admin.app();
            return firebaseApp;
        }

        const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
        
        // 1. Try serviceAccountKey.json file first (more reliable)
        try {
            const fileContent = await readFile(serviceAccountPath, "utf8");
            const serviceAccount = JSON.parse(fileContent);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            return firebaseApp;
        } catch (fileError) {
            // 2. Fallback to Environment Variables if file is missing or invalid
            const projectId = (process.env.FIREBASE_PROJECT_ID || "").replace(/^"(.*)"$/, '$1').trim();
            const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/^"(.*)"$/, '$1').trim();
            let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/^"(.*)"$/, '$1').trim();

            if (projectId && clientEmail && privateKey) { // Added clientEmail check for completeness
                // Fix common PEM formatting issues from .env
                if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
                    privateKey = privateKey.replace(/\\n/g, '\n');
                }

                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                return firebaseApp;
            }
            throw new Error(`Credentials not found in .env and file not found at: ${serviceAccountPath}`);
        }

    } catch (error) {
        console.error("❌ Firebase Admin initialization error:", error.message);
        return null;
    }
};

// Start initialization
firebaseApp = await initializeFirebase();

export { firebaseApp, admin };
export default admin;