import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { auth, db } from './firebase'
import { useAuthStore } from '@/store/authStore'
import type { AppUser } from '@/types'

const googleProvider = new GoogleAuthProvider()

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    currency: 'INR',
    fcmToken: null,
  }
}

/** Creates or merges the user profile document in Firestore. */
async function upsertUserDocument(user: User): Promise<void> {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      currency: 'INR',
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}

function mapAuthError(error: FirebaseError): string {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    default:
      return 'Authentication failed. Please try again.'
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AppUser> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    await upsertUserDocument(user)
    return toAppUser(user)
  } catch (error) {
    if (error instanceof FirebaseError) throw new Error(mapAuthError(error))
    throw error
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return toAppUser(user)
  } catch (error) {
    if (error instanceof FirebaseError) throw new Error(mapAuthError(error))
    throw error
  }
}

export async function signInWithGoogle(): Promise<AppUser> {
  try {
    const { user } = await signInWithPopup(auth, googleProvider)
    await upsertUserDocument(user)
    return toAppUser(user)
  } catch (error) {
    if (error instanceof FirebaseError) throw new Error(mapAuthError(error))
    throw error
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Call once at app startup. Subscribes to Firebase auth state changes and
 * keeps the Zustand authStore in sync. Returns the unsubscribe function.
 */
export function subscribeToAuthChanges(): () => void {
  const { setUser, setLoading } = useAuthStore.getState()
  setLoading(true)

  return firebaseOnAuthStateChanged(auth, (user) => {
    setUser(user ? toAppUser(user) : null)
  })
}
