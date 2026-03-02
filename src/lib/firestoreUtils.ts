import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    increment,
    setDoc,
    onSnapshot,
    limit,
    getDoc,
    runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

export interface SavedDeck {
    id?: string;
    uid: string;
    userName?: string;
    userPhotoURL?: string;
    name: string;
    cards: { id: string; quantity: number; card: any }[];
    coverCardId: string;
    coverCardImg: string;
    isPublic: boolean;
    likesCount?: number;
    totalCards?: number;
    createdAt: any;
    type: 'tcg';
}

export interface SavedTeam {
    id?: string;
    uid: string;
    userName?: string;
    userPhotoURL?: string;
    name: string;
    pokemons: { pokemonId: number; moves: string[]; item?: string }[];
    isPublic: boolean;
    likesCount?: number;
    createdAt: any;
    type: 'vgc';
}

/**
 * Saves or updates a TCG Deck in Firestore.
 */
export async function saveDeck(
    uid: string,
    deckData: Omit<SavedDeck, 'uid' | 'createdAt' | 'type'>,
    deckId?: string,
    userName?: string,
    userPhotoURL?: string
) {
    const userRef = doc(db, 'users', uid);

    // If it's an update
    if (deckId) {
        const deckRef = doc(db, 'decks', deckId);
        await setDoc(deckRef, {
            ...deckData,
            totalCards: countDeckCards(deckData.cards),
            uid,
            userName: userName || null,
            userPhotoURL: userPhotoURL || null,
            type: 'tcg',
        }, { merge: true });
        return deckId;
    }

    // New Deck
    const decksCollection = collection(db, 'decks');
    const newDeck = {
        ...deckData,
        totalCards: countDeckCards(deckData.cards),
        uid,
        userName: userName || null,
        userPhotoURL: userPhotoURL || null,
        type: 'tcg',
        likesCount: 0,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(decksCollection, newDeck);

    // Increment contribution count
    await setDoc(userRef, {
        contributionCount: increment(1)
    }, { merge: true });

    return docRef.id;
}

/**
 * Saves or updates a VGC Team in Firestore.
 */
export async function saveTeam(
    uid: string,
    teamData: Omit<SavedTeam, 'uid' | 'createdAt' | 'type'>,
    teamId?: string,
    userName?: string,
    userPhotoURL?: string
) {
    const userRef = doc(db, 'users', uid);

    // If it's an update
    if (teamId) {
        const teamRef = doc(db, 'teams', teamId);
        await setDoc(teamRef, {
            ...teamData,
            uid,
            userName: userName || null,
            userPhotoURL: userPhotoURL || null,
            type: 'vgc',
        }, { merge: true });
        return teamId;
    }

    // New Team
    const teamsCollection = collection(db, 'teams');
    const newTeam = {
        ...teamData,
        uid,
        userName: userName || null,
        userPhotoURL: userPhotoURL || null,
        type: 'vgc',
        likesCount: 0,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(teamsCollection, newTeam);

    // Increment contribution count
    await setDoc(userRef, {
        contributionCount: increment(1)
    }, { merge: true });

    return docRef.id;
}

export async function getUserDecks(uid: string, isOwner: boolean) {
    const decksRef = collection(db, 'decks');
    const q = query(
        decksRef,
        where('uid', '==', uid)
        // Removed orderBy and composite where to avoid indexing requirements for now
    );

    const snapshot = await getDocs(q);
    let decks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDeck));

    // Sort by createdAt desc (client side)
    decks.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });

    // Filter by isPublic if not owner
    if (!isOwner) {
        decks = decks.filter(d => d.isPublic);
    }

    return decks;
}

/**
 * Subscribes to a specific user's TCG Decks in real-time.
 */
export function subscribeToUserDecks(uid: string, callback: (decks: SavedDeck[]) => void) {
    const decksRef = collection(db, 'decks');
    const q = query(decksRef, where('uid', '==', uid));

    return onSnapshot(q, (snapshot) => {
        const decks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDeck));
        // Sort by createdAt desc (client side)
        decks.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
        callback(decks);
    }, (err) => {
        console.error("Error in user decks subscription:", err);
    });
}

export async function getUserTeams(uid: string, isOwner: boolean) {
    const teamsRef = collection(db, 'teams');
    const q = query(
        teamsRef,
        where('uid', '==', uid)
    );

    const snapshot = await getDocs(q);
    let teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedTeam));

    // Sort by createdAt desc (client side)
    teams.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });

    // Filter by isPublic if not owner
    if (!isOwner) {
        teams = teams.filter(t => t.isPublic);
    }

    return teams;
}

/**
 * Subscribes to a specific user's VGC Teams in real-time.
 */
export function subscribeToUserTeams(uid: string, callback: (teams: SavedTeam[]) => void) {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('uid', '==', uid));

    return onSnapshot(q, (snapshot) => {
        const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedTeam));
        // Sort by createdAt desc (client side)
        teams.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
        callback(teams);
    }, (err) => {
        console.error("Error in user teams subscription:", err);
    });
}

export async function getCommunityHighlight() {
    try {
        // Fetch top 2 public TCG Decks by likes
        const decksRef = collection(db, 'decks');
        const qDecks = query(
            decksRef,
            where('isPublic', '==', true),
            orderBy('likesCount', 'desc'),
            limit(2)
        );
        const snapshotDecks = await getDocs(qDecks);
        const topDecks = snapshotDecks.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDeck));

        // Fetch top 2 public VGC Teams by likes
        const teamsRef = collection(db, 'teams');
        const qTeams = query(
            teamsRef,
            where('isPublic', '==', true),
            orderBy('likesCount', 'desc'),
            limit(2)
        );
        const snapshotTeams = await getDocs(qTeams);
        const topTeams = snapshotTeams.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedTeam));

        // Enrich with up-to-date user profile data (Rank, Photo)
        const enrichWithUserProfile = async (item: any) => {
            if (!item.uid) return item;
            try {
                const userDoc = await getDoc(doc(db, 'users', item.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    return {
                        ...item,
                        userPhotoURL: userData.photoURL || item.userPhotoURL,
                        userName: userData.displayName || item.userName,
                        contributionCount: userData.contributionCount || 0
                    };
                }
            } catch (e) {
                console.error('Error fetching user for highlight:', e);
            }
            return item;
        };

        const enrichedDecks = await Promise.all(topDecks.map(enrichWithUserProfile));
        const enrichedTeams = await Promise.all(topTeams.map(enrichWithUserProfile));

        return {
            tcg: enrichedDecks,
            vgc: enrichedTeams
        };
    } catch (err) {
        console.error("Error fetching community highlight:", err);
        return { tcg: [], vgc: [] };
    }
}


export async function deleteDeck(deckId: string) {
    await deleteDoc(doc(db, 'decks', deckId));
}

export async function deleteTeam(teamId: string) {
    try {
        await deleteDoc(doc(db, 'teams', teamId));
    } catch (error: any) {
        console.error(`Error deleting team (${teamId}):`, error.message || error);
        throw error;
    }
}

/**
 * Toggles a like for a deck or team.
 */
export async function toggleLike(uid: string, itemId: string, type: 'tcg' | 'vgc') {
    const collectionName = type === 'tcg' ? 'decks' : 'teams';
    const itemRef = doc(db, collectionName, itemId);
    const likeRef = doc(db, collectionName, itemId, 'likes', uid);

    try {
        let isNowLiked = false;
        await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const itemDoc = await transaction.get(itemRef);

            if (!itemDoc.exists()) throw new Error("Item not found");

            if (likeDoc.exists()) {
                transaction.delete(likeRef);
                transaction.update(itemRef, { likesCount: increment(-1) });
                isNowLiked = false;
            } else {
                transaction.set(likeRef, { createdAt: serverTimestamp() });
                transaction.update(itemRef, { likesCount: increment(1) });
                isNowLiked = true;
            }
        });

        return isNowLiked;
    } catch (err) {
        console.error("Error toggling like:", err);
        throw err;
    }
}

/**
 * Checks if a user has liked an item.
 */
export async function checkIfLiked(uid: string, itemId: string, type: 'tcg' | 'vgc') {
    if (!uid) return false;
    const collectionName = type === 'tcg' ? 'decks' : 'teams';
    const likeRef = doc(db, collectionName, itemId, 'likes', uid);
    const docSnap = await getDoc(likeRef);
    return docSnap.exists();
}

/**
 * Subscribes to the real-time social feed.
 */
export function subscribeToSocialFeed(type: 'tcg' | 'vgc', callback: (items: any[]) => void) {
    const collectionName = type === 'tcg' ? 'decks' : 'teams';
    const q = query(
        collection(db, collectionName),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(items);
    }, (err) => {
        console.error(`Error in ${type} feed subscription:`, err);
    });
}

/**
 * Imports a public deck or team into the user's collection.
 */
export async function importItem(uid: string, item: any, type: 'tcg' | 'vgc') {
    const userRef = doc(db, 'users', uid);
    const collectionName = type === 'tcg' ? 'decks' : 'teams';

    const { id, likesCount, createdAt, userName, userPhotoURL, totalCards, ...cleanItem } = item;

    const newItem: any = {
        ...cleanItem,
        uid,
        name: `${item.name} (Import)`,
        isPublic: false,
        createdAt: serverTimestamp(),
    };

    if (type === 'tcg') {
        newItem.totalCards = countDeckCards(cleanItem.cards);
    }

    const docRef = await addDoc(collection(db, collectionName), newItem);

    // Increment contribution count
    await setDoc(userRef, {
        contributionCount: increment(1)
    }, { merge: true });

    return docRef.id;
}

/**
 * Robustly counts the total number of cards in a deck.
 * Handles different card entry formats.
 */
export function countDeckCards(cards: any[] | undefined): number {
    if (!cards || !Array.isArray(cards)) return 0;
    return cards.reduce((acc: number, c: any) => {
        // Handle: { quantity: N }, { card: { quantity: N } }, or just { card: ... } (default 1)
        let q = 1;
        if (c.quantity !== undefined) q = c.quantity;
        else if (c.card?.quantity !== undefined) q = c.card.quantity;
        else if (typeof c === 'number') q = c; // Unusual but handle just in case

        return acc + (Number(q) || 0);
    }, 0);
}

// ─── Comments ───────────────────────────────────────
export interface Comment {
    id?: string;
    uid: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    createdAt: any;
    targetId: string; // deck id or team id
    targetType: 'tcg' | 'vgc';
}

/**
 * Adds a new comment to a deck or team.
 */
export async function addComment(
    uid: string,
    userName: string,
    userPhotoURL: string | undefined,
    content: string,
    targetId: string,
    targetType: 'tcg' | 'vgc'
) {
    const commentsCollection = collection(db, 'comments');
    const newComment = {
        uid,
        userName,
        userPhotoURL: userPhotoURL || null,
        content,
        targetId,
        targetType,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(commentsCollection, newComment);

    // Update target document to increment comment count (optional but good for UI)
    const collectionName = targetType === 'tcg' ? 'decks' : 'teams';
    const targetRef = doc(db, collectionName, targetId);
    await setDoc(targetRef, { commentsCount: increment(1) }, { merge: true });

    return docRef.id;
}

/**
 * Subscribes to comments for a specific deck or team.
 */
export function subscribeToComments(targetId: string, callback: (comments: Comment[]) => void) {
    const q = query(
        collection(db, 'comments'),
        where('targetId', '==', targetId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
        callback(comments);
    }, (err) => {
        console.error("Error in comments subscription:", err);
    });
}
