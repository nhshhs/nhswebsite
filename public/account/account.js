'use strict';

firebase.auth().onAuthStateChanged(function (user) {
	firebase.firestore().collection("info").doc("hoursRequirements").get().then(function (doc) {
		if (doc.exists) {
			var reg = doc.data().regularHours + (doc.data().regularHours===1?" regular hour":" regular hours");
			var proj = doc.data().projectHours + (doc.data().projectHours===1?" project hour":" project hours");
			var soc = doc.data().socialHours + (doc.data().socialHours===1?" social hour":" social hours");
			$("#hoursReqs").text("Hours requirements: " + reg + ", " + proj + ", and " + soc);
		} else {
			// doc.data() will be undefined in this case
			console.log("No such document!");
		}
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});
	if (user) {
		firebase.firestore().collection("users").doc(user.uid).get().then(function (doc) {
			if (doc.exists) {
				$("#name").text(doc.data().firstName + " " + doc.data().lastName);
				$("#regularhours").text($("#regularhours").text() + doc.data().regularHours);
				$("#projecthours").text($("#projecthours").text() + doc.data().projectHours);
				$("#socialhours").text($("#socialhours").text() + doc.data().socialHours);

				toggleLoader();

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
