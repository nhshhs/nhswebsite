//public/login/login.js
'use strict';

console.log("login.js loaded at", new Date().toISOString());console.log("login.js loaded at", new Date().toISOString());

$(document).ready(function () {
    $(".modal").modal();
});

let isSignUp = false;

firebase.auth().onAuthStateChanged(function (user) {
    console.log("Auth state changed. User:", user ? "signed in" : "not signed in");
    
    if (user) {
        console.log("Calling verifyUserDocument for:", user.uid);
        verifyUserDocument(user.uid)
            .then((doc) => {
                console.log("verifyUserDocument result:", doc.exists, doc.data());
                if (doc.exists && doc.data().deleted) {
                    throw new Error("User deleted");
                }
                // If the user signed in with Google but has no Firestore doc, either create from
                // signup session data, or prompt for missing info via modal and create from that.
                if (!doc.exists && user.providerData[0] && user.providerData[0].providerId === "google.com") {
                    if (isSignUp) {
                        // Create from sessionStorage values set during sign-up flow
                        const grade = parseInt(sessionStorage.getItem("signupGrade"), 10);
                        const idNumber = parseFloat(sessionStorage.getItem("signupIdNumber"));
                        if (!grade || !idNumber) {
                            alert("Please sign up using the Google sign-up button and fill out all fields.");
                            throw new Error("Missing signup info");
                        }
                        return firebase.firestore().collection("info").doc("allowedUsers").get()
                            .then(function (allowedDoc) {
                                if (!allowedDoc.exists || !allowedDoc.data().emailList.includes(user.email)) {
                                    throw new Error("User not allowed");
                                }
                                const userData = {
                                    firstName: user.displayName?.split(' ')[0] || "",
                                    lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
                                    email: user.email,
                                    grade: grade,
                                    idNumber: idNumber,
                                    deductions: "",
                                    projectHours: 0,
                                    regularHours: 0,
                                    socialHours: 0,
                                    hours: {
                                        fall: 0,
                                        spring: 0,
                                        summer: 0,
                                        total: 0
                                    },
                                    justUpdatedBy: user.uid,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                };
                                return firebase.firestore()
                                    .collection("users")
                                    .doc(user.uid)
                                    .set(userData)
                                    .then(() => firebase.firestore().collection('users').doc(user.uid).get());
                            });
                    } else {
                        // Not signing up: open modal so the user can supply missing grade/ID and create the doc
                        window.__pendingGoogleUser = user;
                        hideLoader();
                        const modalEl = document.getElementById("needAccountModal");
                        const modalInstance = M.Modal.getInstance(modalEl) || M.Modal.init(modalEl);
                        modalInstance.open();
                        return new Promise(function (resolve, reject) {
                            const handler = function () {
                                createUserDocFromModal(user).then(resolve).catch(reject).finally(() => {
                                    document.getElementById('createAccountBtn').removeEventListener('click', handler);
                                });
                            };
                            document.getElementById('createAccountBtn').addEventListener('click', handler);
                        });
                    }
                }
                return doc;
            })
            .then((doc) => {
                // Only redirect if doc exists or was just created
                if (doc && doc.exists) {
                    hideLoader();
                    window.location.href = "/index.html";
                }
            })
            .catch(error => {
                hideLoader();
                if (error.message === "User not allowed") {
                    M.Modal.getInstance(document.getElementById("notAllowed")).open();
                } else if (error.message === "User deleted") {
                    alert("This account has been removed. Please contact an officer if you believe this is a mistake.");
                    firebase.auth().signOut();
                } else if (error.message === "No Firestore user document") {
                    // Already handled by modal
                } else {
                    console.error("Error verifying user document:", error);
                }
            });
    } else {
        hideLoader();
    }
});

function loginWithGoogle() {
    isSignUp = false;
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().useDeviceLanguage();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // The onAuthStateChanged handler will handle the rest
            console.log("Google login popup successful", result.user);
        })
        .catch((error) => {
            console.error("Google login popup error:", error);
            alert("Google login failed: " + error.message);
        });
}

function signUpWithGoogle() {
    isSignUp = true;
    const idNumber = document.getElementById("idnumber").value;
    if (!idNumber) {
        alert("Please enter your ID number before signing up with Google.");
        return;
    }

    const selectedGrade = document.querySelector('input[name="grade"]:checked');
    const gradeValue = selectedGrade ? selectedGrade.nextElementSibling.textContent : null;
    if (!gradeValue) {
        alert("Please select a grade level before signing up with Google.");
        return;
    }
    const grade = parseInt(gradeValue, 10);

    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().useDeviceLanguage();
    sessionStorage.setItem("signupGrade", grade);
    sessionStorage.setItem("signupIdNumber", idNumber);

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // All user creation is handled in onAuthStateChanged, so nothing else needed here
            hideLoader();
        })
        .catch((error) => {
            hideLoader();
            console.error("Google sign up popup error:", error);
            alert("Google sign up failed: " + error.message);
        });
    console.log("Google sign up popup initiated");
}

// function login() {
//     const userEmail = document.getElementById("email").value;
//     const userPass = document.getElementById("password").value;

//     if (!userEmail || !userPass) {
//         alert("Please fill all of the fields before submitting.");
//         return;
//     }

//     toggleLoader();
//     firebase.auth().signInWithEmailAndPassword(userEmail, userPass)
//         .then(function(userCredential) {
//             console.log("User logged in successfully");
//         })
//         .catch(function (error) {
//             console.error("Login error:", error);
//             toggleLoader();
//             alert("Error: " + error.message);
//         });
// }

// function signUp() {
//     const firstName = document.getElementById("firstname").value;
//     const lastName = document.getElementById("lastname").value;
//     const idNumber = document.getElementById("idnumber").value;
//     const userEmail = document.getElementById("signupemail").value;
//     const userPass = document.getElementById("signuppassword").value;
    
//     // Modified grade selection to get the text content
//     const selectedGrade = document.querySelector('input[name="grade"]:checked');
//     const gradeValue = selectedGrade ? selectedGrade.nextElementSibling.textContent : null;

//     console.log("Grade Selection Debug:", {
//         selectedElement: selectedGrade,
//         gradeText: gradeValue,
//         allGradeInputs: Array.from(document.querySelectorAll('input[name="grade"]')).map(input => ({
//             text: input.nextElementSibling?.textContent,
//             checked: input.checked
//         }))
//     });

//     if (!gradeValue) {
//         alert("Please select a grade level");
//         return;
//     }

//     const grade = parseInt(gradeValue, 10);

//     console.log("Form values:", {
//         firstName,
//         lastName,
//         idNumber,
//         email: userEmail,
//         gradeValue,
//         grade,
//         hasPassword: !!userPass
//     });


//     if (!grade) {
//         alert("Please select a grade level");
//         return;
//     }

//     if (!firstName || !lastName || !idNumber || !userEmail || !userPass) {
//         const missing = [];
//         if (!firstName) missing.push('firstName');
//         if (!lastName) missing.push('lastName');
//         if (!idNumber) missing.push('idNumber');
//         if (!userEmail) missing.push('email');
//         if (!userPass) missing.push('password');
//         console.log("Missing fields:", missing);
//         alert("Please fill all of the fields before submitting.");
//         return;
//     }

    

//     toggleLoader();
//     let createdUserId;

//     firebase.firestore().collection("info").doc("allowedUsers").get()
//         .then(function (doc) {
//             console.log("Checking allowed users:", doc.data());
//             if (!doc.exists || !doc.data().emailList.includes(userEmail)) {
//                 throw new Error("User not allowed");
//             }
            
//             return firebase.auth().createUserWithEmailAndPassword(userEmail, userPass);
//         })
//         .then(function(userCredential) {
//             createdUserId = userCredential.user.uid;
//             console.log("Auth user created with ID:", createdUserId);
            
//             const userData = {
//                 firstName: firstName,
//                 lastName: lastName,
//                 email: userEmail,
//                 grade: grade,  // This will now be the number from the text next to the radio button
//                 idNumber: parseFloat(idNumber),
//                 deductions: "",
//                 projectHours: 0,
//                 regularHours: 0,
//                 socialHours: 0,
//                 hours: {
//                     fall: 0,
//                     spring: 0,
//                     summer: 0,
//                     total: 0
//                 },
//                 justUpdatedBy: createdUserId,
//                 createdAt: firebase.firestore.FieldValue.serverTimestamp()
//             };
        
//             console.log("Attempting to create user document with data:", userData);
//             return firebase.firestore()
//                 .collection("users")
//                 .doc(createdUserId)
//                 .set(userData);
//         })
//         .then(function() {
//             console.log("User document created successfully");
//             toggleLoader();
//             window.location.href = "/index.html";
//         })
//         .catch(function(error) {
//             console.error("Error in signup process:", error);
//             toggleLoader();
//             if (error.message === "User not allowed") {
//                 M.Modal.getInstance(document.getElementById("notAllowed")).open();
//             } else {
//                 alert("An error occurred during signup: " + error.message);
//             }
//         });
// }

function verifyUserDocument(userId) {
    return firebase.firestore()
        .collection("users")
        .doc(userId)
        .get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                const needsUpdate = !data.hours;
                
                if (needsUpdate) {
                    console.log('Fixing user document structure');
                    const updatedData = {
                        ...data,
                        hours: {
                            fall: 0,
                            spring: 0,
                            summer: 0,
                            total: 0
                        }
                    };
                    
                    return firebase.firestore()
                        .collection("users")
                        .doc(userId)
                        .set(updatedData, { merge: true })
                        .then(() => doc); // Return the original doc after updating
                }
            }
            // If doc does not exist, just return it (do not create/merge)
            return doc;
        });
}

function forgotPassword() {
    toggleLoader();
    firebase.auth().sendPasswordResetEmail(document.getElementById("forgotpassemail").value)
        .then(function () {
            M.toast({ html: "Email has been sent." });
            document.getElementById("forgotpassemail").value = "";
        })
        .catch(function (error) {
            M.toast({ html: "There is no account associated with that email." });
            console.error("Password reset error:", error);
        })
        .finally(() => {
            toggleLoader();
        });
}

function toggleLoginSignUp() {
    if ($("#login").hasClass("hide")) {
        $("#login").removeClass("hide");
        $("#signup").addClass("hide");
    } else {
        $("#login").addClass("hide");
        $("#signup").removeClass("hide");
    }
}

// Create a Firestore user document using data from the needAccountModal
function createUserDocFromModal(user) {
    return new Promise(function (resolve, reject) {
        try {
            const selected = document.querySelector('input[name="modalGrade"]:checked');
            const grade = selected ? parseInt(selected.value, 10) : null;
            const idNumberRaw = document.getElementById('modalIdNumber').value;
            const idNumber = idNumberRaw ? parseFloat(idNumberRaw) : null;

            if (!grade || !idNumber) {
                M.toast({html: 'Please select a grade and enter an ID number.'});
                return reject(new Error('Missing modal info'));
            }

            // Check allowedUsers list
            firebase.firestore().collection('info').doc('allowedUsers').get()
                .then(function (allowedDoc) {
                    if (!allowedDoc.exists || !allowedDoc.data().emailList.includes(user.email)) {
                        throw new Error('User not allowed');
                    }
                    const userData = {
                        firstName: user.displayName?.split(' ')[0] || '',
                        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                        email: user.email,
                        grade: grade,
                        idNumber: idNumber,
                        deductions: '',
                        projectHours: 0,
                        regularHours: 0,
                        socialHours: 0,
                        hours: { fall: 0, spring: 0, summer: 0, total: 0 },
                        justUpdatedBy: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    return firebase.firestore().collection('users').doc(user.uid).set(userData).then(function () {
                        // close modal and redirect
                        const modalEl = document.getElementById('needAccountModal');
                        const modalInstance = M.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.close();
                        M.toast({html: 'Account created. Redirecting...'});
                        resolve(firebase.firestore().collection('users').doc(user.uid).get());
                    });
                })
                .catch(function (err) {
                    console.error('Error creating user from modal:', err);
                    if (err.message === 'User not allowed') {
                        M.Modal.getInstance(document.getElementById('notAllowed')).open();
                    } else {
                        M.toast({html: 'Failed to create account.'});
                    }
                    reject(err);
                });
        } catch (e) {
            reject(e);
        }
    });
}