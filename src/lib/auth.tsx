import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile, newUserProfile, subscribeToUserProfile, type NewUserProfileInput } from './firestore/users'
import type { User as UserProfile } from '../types/models'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  // Returns the new uid directly — profile/firebaseUser context state updates
  // asynchronously via onAuthStateChanged, so a caller that needs the uid
  // right away (e.g. to create a Registration in the same submit) can't wait
  // on that.
  signUp: (password: string, profileData: NewUserProfileInput) => Promise<string>
  logIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubAuth
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    setLoading(true)
    const unsubProfile = subscribeToUserProfile(firebaseUser.uid, (p) => {
      setProfile(p)
      setLoading(false)
    })
    return unsubProfile
  }, [firebaseUser])

  async function signUp(password: string, profileData: NewUserProfileInput): Promise<string> {
    const cred = await createUserWithEmailAndPassword(auth, profileData.email, password)
    // Firestore's own auth listener can lag a beat behind Auth SDK's —
    // writing immediately after createUserWithEmailAndPassword sometimes
    // hits a transient permission-denied because the token hasn't
    // propagated yet. Forcing a fresh token first reliably settles it.
    await cred.user.getIdToken(true)
    await updateProfile(cred.user, { displayName: `${profileData.name} ${profileData.surname}` })
    await createUserProfile(newUserProfile(cred.user.uid, profileData))
    return cred.user.uid
  }

  async function logIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logOut() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
