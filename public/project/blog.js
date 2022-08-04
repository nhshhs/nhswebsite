/*jshint multistr: true */
'use strict';

const desktopWidth = 992,
	tabletWidth = 600;
var windowWidth = window.innerWidth;

var noProjectEvents;


$(document).ready(function () {
	$('select').formSelect();
	$('.modal').modal();
	firebase.firestore().collection("project").doc("blog").get().then(function (doc) {
		if (doc.exists) {
			if (doc.data().order.length === 0) {
				document.getElementById("blogcontainer").innerHTML = '<h5 class="center">There are no blog posts right now.</h5>';
			} else {
				for (var i = doc.data().order.length - 1; i >= 0; i--) {
					firebase.firestore().collection("project").doc("blog").collection("approved").doc(doc.data().order[i]).get().then(function (doc) {
						if (doc.exists) {
							var data = doc.data();
							addPost(data.event, data.author, data.post);
						} else {
							// doc.data() will be undefined in this case
							console.log("No such document!");
						}
					}).catch(function (error) {
						console.log("Error getting document:", error);
					});
				}
			}
			toggleLoader();
		} else {
			// doc.data() will be undefined in this case
			console.log("No such document!");
		}
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});

	//adds the dropdown to show all project events
	let events = [];
	firebase.firestore().collection("project").doc("events").collection("events").get().then(function (query) {

		query.forEach(function (doc) {
			events.push(doc);
		});

		if (events.length == 0) {
			noProjectEvents = true;
		} else {
			noProjectEvents = false;


			events.sort(eventcompare);

			function eventcompare(a, b) {
				var date1 = new Date(a.data().date).getTime();
				var date2 = new Date(b.data().date).getTime();
				if (date1 > date2) return -1;
				else if (date1 < date2) return 1;
				else return 0;
			}

			events.forEach(function(doc) {
				$("#event").append('<option value="' + doc.id + '">' + doc.data().title + '</option>');
				$('select').formSelect();
			});
		}

	}).catch(function (error) {
		console.log("new error", error);
	});
});

window.onresize = function () {
	if (window.innerWidth > windowWidth) { //window width got bigger
		if (window.innerWidth > tabletWidth && windowWidth <= tabletWidth) {
			location.reload();
		}
	} else { //window width got smaller
		if (window.innerWidth <= tabletWidth && windowWidth > tabletWidth) {
			location.reload();
		}
	}
};

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
	}
});

function addPost(event, author, post) {
	var eventTitle = "",
		authorName = "";
	firebase.firestore().collection("project").doc("events").collection("events").doc(event).get().then(function (doc) {
		if (doc.exists) {
			eventTitle = doc.data().title;
		} else {
			// doc.data() will be undefined in this case
			console.log("No such document!");
		}
	}).then(function () {
		firebase.firestore().collection("users").doc(author).get().then(function (doc) {
			if (doc.exists) {
				authorName = doc.data().firstName + " " + doc.data().lastName;
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).then(function () {
			addHTMLPost(eventTitle, authorName, post);
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});
}

var colCounter = 0;

function addHTMLPost(event, author, post) {
	var div = document.createElement('div');
	div.className = 'card hoverable';
	div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4 center"><b>' + event + '</b></span>\
							<p class="center">Author: ' + author + '</p>\
							<br>\
							<p>' + post + '</p>';
	if (windowWidth > tabletWidth) {
		document.getElementById("col" + (colCounter + 1)).appendChild(div);
		colCounter++;
		if (colCounter >= 2) { //2 columns
			colCounter = 0;
		}
	} else { //mobile devices
		document.getElementById("col" + (colCounter + 1)).appendChild(div); //1 column
	}
}

$(document).on('click', '#writenew', function () {
	if (firebase.auth().currentUser === null) {
		M.Modal.getInstance($("#login")).open();
	} else if (noProjectEvents) {
		M.Modal.getInstance($("#noevents")).open();
	} else {
		M.Modal.getInstance($("#newblog")).open();
	}
});

function createPost() {
	if ($("#event").val() === "" || $("#post").val() === "") {
		window.alert("Please fill out everything before submitting your post.");
	} else {
		toggleLoader();
		firebase.firestore().collection("project").doc("blog").collection("pending").add({
			author: firebase.auth().currentUser.uid,
			event: $("#event").val(),
			post: $("#post").val(),
		}).then(function (docRef) {
			toggleLoader();
			M.Modal.getInstance($("#approval")).open();
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
		});
	}
}
