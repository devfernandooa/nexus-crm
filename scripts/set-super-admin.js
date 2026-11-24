import { readFileSync } from 'node:fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountPath = new URL('./service-account.json', import.meta.url);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const uid = 'w7RcCjfYE7OXva5zoOL0vwqV7Z33';

await getAuth().setCustomUserClaims(uid, { superAdmin: true });
console.log(`Super Admin configurado com sucesso para o UID: ${uid}`);
process.exit(0);