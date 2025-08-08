console.log("FirebaseStuff.js loading...");

const firebaseConfig = {
  apiKey: "AIzaSyAOftN6rBBcOYJBwUuROgrj3v2gaeRWZ0g",
  authDomain: "hhs-nhs.firebaseapp.com",
  databaseURL: "https://hhs-nhs.firebaseio.com",
  projectId: "hhs-nhs",
  storageBucket: "hhs-nhs.appspot.com",
  messagingSenderId: "750103965710",
  appId: "1:750103965710:web:dd489fa07640673be38c5f",
  measurementId: "G-673VFGWCLE"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized");
        
        firebase.analytics();
        console.log("Analytics initialized");
        
        const db = firebase.firestore();
        window.db = db; // Make it globally available
        console.log("Firestore initialized");

        // Set up auth state listener
        firebase.auth().onAuthStateChanged(function(user) {
            console.log("Auth state changed:", user ? "signed in" : "not signed in");
            if (typeof hideLoader === 'function') {
                hideLoader();
            } else {
                console.error("hideLoader function not found");
            }
        });

        // Set persistence
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => console.log("Persistence set to LOCAL"))
            .catch(error => console.error("Persistence error:", error));
            
    } else {
        console.log("Firebase already initialized");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    if (typeof hideLoader === 'function') {
        hideLoader();
    }
}

window.db = firebase.firestore();

firebase.auth().onAuthStateChanged(function(user) {
    if (typeof hideLoader === 'function') {
        hideLoader();
    }
});