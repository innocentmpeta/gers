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
import { createUserProfile, newUserProfile, subscribeToUserProfile } from './firestore/users'
import type { User as UserProfile } from '../types/models'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
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

  async function signUp(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await createUserProfile(newUserProfile(cred.user.uid, name, email))
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
