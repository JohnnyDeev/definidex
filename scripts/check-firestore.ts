import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

async function nukeTeams() {
    console.log('--- FIRESTORE RESET: TEAMS ---');
    console.log('Project ID:', firebaseConfig.projectId);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const teamsRef = collection(db, 'teams');
    const snapshot = await getDocs(teamsRef);

    console.log(`Found ${snapshot.size} documents to delete.`);

    const deletePromises = snapshot.docs.map(docSnap => {
        console.log(`Deleting ID: [${docSnap.id}] | Name: "${docSnap.data().name}"`);
        return deleteDoc(docSnap.ref);
    });

    await Promise.all(deletePromises);

    console.log('\n--- ALL TEAMS DELETED FROM FIRESTORE ---');
    process.exit(0);
}

nukeTeams().catch(err => {
    console.error('Error during nuke:', err);
    process.exit(1);
});
