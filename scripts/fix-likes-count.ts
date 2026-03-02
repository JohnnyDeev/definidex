import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixLikesCount() {
    console.log("Fixing likesCount for decks and teams...");

    try {
        // Fix decks
        const decksSnap = await getDocs(collection(db, 'decks'));
        console.log(`Found ${decksSnap.docs.length} decks.`);
        for (const d of decksSnap.docs) {
            const data = d.data();
            if (data.likesCount === undefined || data.likesCount === null) {
                console.log(`Updating deck ${d.id} (${data.name})...`);
                await updateDoc(doc(db, 'decks', d.id), { likesCount: 0 });
            }
        }

        // Fix teams
        const teamsSnap = await getDocs(collection(db, 'teams'));
        console.log(`Found ${teamsSnap.docs.length} teams.`);
        for (const d of teamsSnap.docs) {
            const data = d.data();
            if (data.likesCount === undefined || data.likesCount === null) {
                console.log(`Updating team ${d.id} (${data.name})...`);
                await updateDoc(doc(db, 'teams', d.id), { likesCount: 0 });
            }
        }

        console.log("Fix completed successfully!");
    } catch (error) {
        console.error("Error fixing likesCount:", error);
    }
    process.exit(0);
}

fixLikesCount().catch(err => {
    console.error(err);
    process.exit(1);
});
