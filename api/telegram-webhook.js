import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function obterCredencialFirebase() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '';

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';

  if (rawJson) {
    const jsonStr = rawJson.trim().startsWith('{')
      ? rawJson.trim()
      : Buffer.from(rawJson.trim(), 'base64').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (!parsed.project_id && parsed.projectId) {
      parsed.project_id = parsed.projectId;
    }
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return cert(parsed);
  }

  throw new Error(
    'Credenciais do Firebase Admin não configuradas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY).'
  );
}

if (!getApps().length) {
  initializeApp({
    credential: obterCredencialFirebase(),
  });
}

const db = getFirestore();