import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function saveUserToFirestore(user: User) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
        userRef,
        {
            displayName: user.displayName ?? null,
            email: user.email ?? null,
            photoURL: user.photoURL ?? null,
            lastLogin: serverTimestamp(),
            // Use setDoc with merge to not overwrite contributionCount if it exists
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );

    // Initialize contributionCount if it's a new user
    // We can use another setDoc or just trust that server rules/logic handles it
    // But for now, let's ensure it exists if we are the owner
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                console.log("[Diagnostic] Auth State Changed: User Logged In", { uid: firebaseUser.uid, email: firebaseUser.email });
            } else {
                console.log("[Diagnostic] Auth State Changed: User Logged Out");
            }
            setUser(firebaseUser);
            if (!firebaseUser) {
                setProfile(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    // Effect to listen to user profile in Firestore
    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    console.log("[Diagnostic] Profile Loaded:", { profileUid: user.uid, rank: docSnap.data().rank });
                    setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
                    setLoading(false);
                } else {
                    // Profile doc doesn't exist yet - auto-create
                    console.log("[Diagnostic] Profile not found, creating for:", user.uid);
                    setDoc(userRef, {
                        displayName: user.displayName ?? null,
                        email: user.email ?? null,
                        photoURL: user.photoURL ?? null,
                        contributionCount: 0,
                        rank: 'Pokéball',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                    }, { merge: true }).catch(err => {
                        console.error("Error creating profile:", err);
                        setLoading(false);
                    });
                    // Note: We don't set loading(false) here because the next snapshot will catch it.
                }
            }, (err) => {
                console.error("Profile snapshot error:", err);
                setLoading(false);
            });
            return unsubscribe;
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [user]);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        saveUserToFirestore(result.user).catch(console.error);
        setShowAuthModal(false);
    };

    const signInWithEmail = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        saveUserToFirestore(result.user).catch(console.error);
        setShowAuthModal(false);
    };

    const signUp = async (email: string, password: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize the profile with contributionCount 0 - non-blocking
        const userRef = doc(db, 'users', result.user.uid);
        setDoc(userRef, {
            displayName: result.user.displayName ?? null,
            email: result.user.email ?? null,
            photoURL: result.user.photoURL ?? null,
            contributionCount: 0,
            createdAt: serverTimestamp(),
        }, { merge: true }).catch(console.error);
        saveUserToFirestore(result.user).catch(console.error);
        setShowAuthModal(false);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            showAuthModal,
            setShowAuthModal,
            signInWithGoogle,
            signInWithEmail,
            signUp,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
