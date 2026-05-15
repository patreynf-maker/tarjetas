// src/auth.js
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase.js';

// Auth State Management
export const AuthState = {
  user: null,
  role: null, // 'admin' or 'user'
  status: null, // 'approved', 'pending'
  listeners: []
};

export function subscribeToAuthChanges(callback) {
  AuthState.listeners.push(callback);
}

function notifyListeners() {
  AuthState.listeners.forEach(cb => cb(AuthState));
}

// User role check
async function fetchUserRole(uid) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      AuthState.role = data.role || 'user';
      AuthState.status = data.status || 'pending';
    } else {
      AuthState.role = 'user';
      AuthState.status = 'pending';
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
    AuthState.status = 'error';
  }
}

// Init Auth Listener
export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      AuthState.user = user;
      await fetchUserRole(user.uid);
    } else {
      AuthState.user = null;
      AuthState.role = null;
      AuthState.status = null;
    }
    notifyListeners();
  });
}

// Login
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Register
export async function register(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore with pending status
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: name,
      role: 'user',
      status: 'pending',
      createdAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Logout
export async function logout() {
  await signOut(auth);
}
