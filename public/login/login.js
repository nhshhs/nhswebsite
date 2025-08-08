//public/login/login.js
'use strict';

$(document).ready(function () {
    $(".modal").modal();
});

firebase.auth().onAuthStateChanged(function (user) {
    console.log("Auth state changed. User:", user ? "signed in" : "not signed in");
    
    if (user) {
        verifyUserDocument(user.uid)
            .then(() => {
                hideLoader();
                window.location.href = "/index.html";
            })
            .catch(error => {
                console.error("Error verifying user document:", error);
                hideLoader();
            });
    } else {
        hideLoader();
    }
});

function login() {
    const userEmail = document.getElementById("email").value;
    const userPass = document.getElementById("password").value;

    if (!userEmail || !userPass) {
        alert("Please fill all of the fields before submitting.");
        return;
    }

    toggleLoader();
    firebase.auth().signInWithEmailAndPassword(userEmail, userPass)
        .then(function(userCredential) {
            console.log("User logged in successfully");
        })
        .catch(function (error) {
            console.error("Login error:", error);
            toggleLoader();
            alert("Error: " + error.message);
        });
}

function signUp() {
    const firstName = document.getElementById("firstname").value;
    const lastName = document.getElementById("lastname").value;
    const idNumber = document.getElementById("idnumber").value;
    const userEmail = document.getElementById("signupemail").value;
    const userPass = document.getElementById("signuppassword").value;
    
    // Modified grade selection to get the text content
    const selectedGrade = document.querySelector('input[name="grade"]:checked');
    const gradeValue = selectedGrade ? selectedGrade.nextElementSibling.textContent : null;

    console.log("Grade Selection Debug:", {
        selectedElement: selectedGrade,
        gradeText: gradeValue,
        allGradeInputs: Array.from(document.querySelectorAll('input[name="grade"]')).map(input => ({
            text: input.nextElementSibling?.textContent,
            checked: input.checked
        }))
    });

    if (!gradeValue) {
        alert("Please select a grade level");
        return;
    }

    const grade = parseInt(gradeValue, 10);

    console.log("Form values:", {
        firstName,
        lastName,
        idNumber,
        email: userEmail,
        gradeValue,
        grade,
        hasPassword: !!userPass
    });


    if (!grade) {
        alert("Please select a grade level");
        return;
    }

    if (!firstName || !lastName || !idNumber || !userEmail || !userPass) {
        const missing = [];
        if (!firstName) missing.push('firstName');
        if (!lastName) missing.push('lastName');
        if (!idNumber) missing.push('idNumber');
        if (!userEmail) missing.push('email');
        if (!userPass) missing.push('password');
        console.log("Missing fields:", missing);
        alert("Please fill all of the fields before submitting.");
        return;
    }

    

    toggleLoader();
    let createdUserId;

    firebase.firestore().collection("info").doc("allowedUsers").get()
        .then(function (doc) {
            console.log("Checking allowed users:", doc.data());
            if (!doc.exists || !doc.data().emailList.includes(userEmail)) {
                throw new Error("User not allowed");
            }
            
            return firebase.auth().createUserWithEmailAndPassword(userEmail, userPass);
        })
        .then(function(userCredential) {
            createdUserId = userCredential.user.uid;
            console.log("Auth user created with ID:", createdUserId);
            
            const userData = {
                firstName: firstName,
                lastName: lastName,
                email: userEmail,
                grade: grade,  // This will now be the number from the text next to the radio button
                idNumber: parseFloat(idNumber),
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
                justUpdatedBy: createdUserId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
        
            console.log("Attempting to create user document with data:", userData);
            return firebase.firestore()
                .collection("users")
                .doc(createdUserId)
                .set(userData);
        })
        .then(function() {
            console.log("User document created successfully");
            toggleLoader();
            window.location.href = "/index.html";
        })
        .catch(function(error) {
            console.error("Error in signup process:", error);
            toggleLoader();
            if (error.message === "User not allowed") {
                M.Modal.getInstance(document.getElementById("notAllowed")).open();
            } else {
                alert("An error occurred during signup: " + error.message);
            }
        });
}

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
                        .set(updatedData, { merge: true });
                }
            }
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