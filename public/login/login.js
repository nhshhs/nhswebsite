'use strict';

$(document).ready(function () {
	$(".modal").modal();
});

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		if (justSignedUp) {
			fillDoc(user);
		} else {
			window.location.href = "/index.html";
		}
	} else {
		toggleLoader();
	}
});

var userEmail, userPass, firstName, lastName, idNumber, grade;

function login() {
	userEmail = document.getElementById("email").value;
	userPass = document.getElementById("password").value;

	if (firstName === "" || lastName === "" || idNumber === "" || userEmail === "" || userPass === "" || grade === "") {
		alert("Please fill all of the fields before submitting.");
	} else {
		toggleLoader();
		firebase.auth().signInWithEmailAndPassword(userEmail, userPass).catch(function (error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			
			toggleLoader();
			alert("Error : " + errorMessage);
			

		});
	}
}

function signUp() {
	firstName = document.getElementById("firstname").value;
	lastName = document.getElementById("lastname").value;
	idNumber = document.getElementById("idnumber").value;
	userEmail = document.getElementById("signupemail").value;
	userPass = document.getElementById("signuppassword").value;
	grade = $('input[name=grade]:checked').next().text();

	if (firstName === "" || lastName === "" || idNumber === "" || userEmail === "" || userPass === "" || grade === "") {
		alert("Please fill all of the fields before submitting.");
	} else {
		toggleLoader();
		var allowed = false;

		firebase.firestore().collection("info").doc("allowedUsers").get().then(function (doc) {
			if (doc.exists) {
				var data = doc.data();
				var emailList = data.emailList;
				if (emailList.indexOf(userEmail) != -1) {
					allowed = true;
				}
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		}).then(function () {
			if (allowed) {
				createUser();
			} else {
				toggleLoader();
				M.Modal.getInstance(document.getElementById("notAllowed")).open();
			}
		});
	}
}

var justSignedUp = false;

function createUser() {
	firebase.auth().createUserWithEmailAndPassword(userEmail, userPass)
		.catch(function (error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			if (errorCode == 'auth/weak-password') {
				alert('The password is too weak.');
			} else {
				alert(errorMessage);
			}
			console.log(error);
			toggleLoader();
		}).then(function (userCredentials) {
			justSignedUp = true;
		});
}

function fillDoc(user) {
	if (user == null) {

		setTimeout(function () { //waiting for createUser firebase function to run and create doc
			fillDoc(user);
		}, 500);

	} else {
		firebase.firestore().collection("users").doc(user.uid).get().then(function (doc) {
			if (doc.exists) {
				firebase.firestore().collection("users").doc(user.uid).update({
					email: userEmail,
					firstName: firstName,
					lastName: lastName,
					grade: parseFloat(grade),
					idNumber: parseFloat(idNumber),
				}).then(function () {
					toggleLoader();
					window.location.href = "/index.html";
				}).catch(function (error) {
					toggleLoader();
					window.alert("Could not update. Error: " + error);
					location.reload();
				});
			} else {
				console.log("No such document!");
				setTimeout(function () {
					fillDoc(user);
				}, 500);
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}
}

function forgotPassword() {
	toggleLoader();
	firebase.auth().sendPasswordResetEmail(document.getElementById("forgotpassemail").value).then(function () {
		M.toast({
			html: "Email has been sent."
		});
		document.getElementById("forgotpassemail").value = "";
	}).catch(function (error) {
		M.toast({
			html: "There is no account associated with that email."
		});
		console.log("Error getting document:", error);
	});
	toggleLoader();
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
