// Firebase Authentication for ExploreMath
// Requires: Firebase JS SDK and Firebase Auth SDK

// Import the functions needed (if using modules), or just rely on CDN scripts.
// For legacy / browser, the CDN scripts are required in index.html (see main file for script tags).

// Firebase configuration -- using your chemphys3d project as requested
const firebaseConfig = {
  apiKey: "AIzaSyBVdI7OjdSwiSN3C47sanSmj0BeX5acBKc",
  authDomain: "chemphys3d.firebaseapp.com",
  projectId: "chemphys3d",
  storageBucket: "chemphys3d.appspot.com", // corrected typo
  messagingSenderId: "242382321033",
  appId: "1:242382321033:web:a2b9401f354fe1c052dd58",
  measurementId: "G-FDERFP24KP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Auth instance
const auth = firebase.auth();

// Show/hide main content depending on auth
function handleAuthState(user) {
  const mainSections = document.querySelectorAll(
    'nav, .hero, .tab-bar, .cats, .toolbar, .cont, .fab-wrap, footer'
  );
  if (user) {
    mainSections.forEach(el => el.style.display = '');
    document.getElementById('firebaseAuthModal').style.display = 'none';
  } else {
    mainSections.forEach(el => el.style.display = 'none');
    document.getElementById('firebaseAuthModal').style.display = 'flex';
  }
}

auth.onAuthStateChanged(handleAuthState);

// Google Auth
function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

// Email/password registration
function doRegister() {
  const email = document.getElementById('firebase-email').value;
  const pass = document.getElementById('firebase-pass').value;
  auth.createUserWithEmailAndPassword(email, pass)
    .catch(err => {
      document.getElementById('firebaseAuthError').textContent = err.message;
    });
}

// Email/password login
function doEmailLogin() {
  const email = document.getElementById('firebase-email').value;
  const pass = document.getElementById('firebase-pass').value;
  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => {
      document.getElementById('firebaseAuthError').textContent = err.message;
    });
}

// Logout
function doLogout() {
  auth.signOut();
}