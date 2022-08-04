// Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyAOftN6rBBcOYJBwUuROgrj3v2gaeRWZ0g",
    authDomain: "hhs-nhs.firebaseapp.com",
    databaseURL: "https://hhs-nhs.firebaseio.com",
    projectId: "hhs-nhs",
    storageBucket: "hhs-nhs.appspot.com",
    messagingSenderId: "750103965710",
    appId: "1:750103965710:web:dd489fa07640673be38c5f",
    measurementId: "G-673VFGWCLE"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
