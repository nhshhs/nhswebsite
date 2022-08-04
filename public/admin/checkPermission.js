'use strict';

//make sure that the user should be allowed to access the admin pages
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		firebase.firestore().collection("info").doc("admins").get().then(function (doc) {
			if (doc.exists) {

				if (!doc.data().execs.includes(user.uid)) {
					if (window.location.href.includes("/project") || window.location.href.includes("project=true")) {
						if (!doc.data().project.includes(user.uid)) {
							window.location.href = "/404.html";
						}
					} else if (window.location.href.includes("/event") || window.location.href.includes("project=false")) {
						if (!doc.data().ads.includes(user.uid)) {
							window.location.href = "/404.html";
						}
					}
				}
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	} else {
		window.location.href = "/index.html";
	}
});
