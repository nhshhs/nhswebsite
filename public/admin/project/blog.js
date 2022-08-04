/*jshint multistr: true */
'use strict';

const desktopWidth = 992, tabletWidth = 600;
var windowWidth = window.innerWidth;

$(document).ready(function () {

	firebase.firestore().collection("project").doc("blog").collection("pending").get().then(snap => {
		if (snap.size === 0) {
			$("#blogcontainer").html('<h5 class="center">There are no pending blog posts.</h5>');
		} else {
			firebase.firestore().collection("project").doc("blog").collection("pending").get()
				.then(querySnapshot => {
					querySnapshot.docs.forEach(doc => {
						var data = doc.data();
						addPost(data.event, data.author, data.post, doc.id);
					});
				});
		}
		toggleLoader();
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

function addPost(event, author, post, blogid) {
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
			addHTMLPost(eventTitle, authorName, post, blogid, author);
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});
}

var colCounter = 0;

function addHTMLPost(event, author, post, blogid, authorid) {
	var div = document.createElement('div');
	div.className = 'card hoverable';
	div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4 center"><b>' + event + '</b></span>\
							<p class="center">Author: <span class="author">' + author + '</span></p>\
							<br>\
							<p class="center">' + post + '</p>\
						</div>\
						<div class="card-action center-align">\
							<a href="#" class="waves-effect waves-light btn blue darken-4 approve">Approve</a>\
						</div>\
							<p class="hide blogid">' + blogid + '</p>\
							<p class="hide authorid">' + authorid + '</p>';
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

//approves the blog and gives the author .5 hours
$(document).on('click', '.approve', function () {
	toggleLoader();
	var blogid = $(this).closest(".card").find(".blogid").text();
	var authorid = $(this).closest(".card").find(".authorid").text();
	var authorName = $(this).closest(".card").find(".author").text();
	firebase.firestore().collection("project").doc("blog").collection("pending").doc(blogid).get().then(function (doc) {
		if (doc.exists) {
			var data = doc.data();
			firebase.firestore().collection("project").doc("blog").collection("approved").add({
				author: data.author,
				event: data.event,
				post: data.post,
			}).then(function (docRef) {
				firebase.firestore().collection("project").doc("blog").update({
					order: firebase.firestore.FieldValue.arrayUnion(docRef.id),
				}).then(function () {
					firebase.firestore().collection("project").doc("blog").collection("pending").doc(blogid).delete().then(function () {
						firebase.firestore().collection("users").doc(authorid).update({
							projectHours: firebase.firestore.FieldValue.increment(.5),
							justUpdatedBy: firebase.auth().currentUser.uid + " (approved a project blog post)",
						}).then(function () {
							toggleLoader();
							M.toast({
								html: '0.5 hour(s) given to ' + authorName
							});
							M.toast({
								html: 'Approved!'
							});
							location.reload();
						}).catch(function (error) {
							toggleLoader();
							window.alert("Could not update. Error: " + error);
							location.reload();
						});
					}).catch(function (error) {
						toggleLoader();
						window.alert("Error removing document: ", error);
					});
				}).catch(function (error) {
					toggleLoader();
					window.alert("Could not update. Error: " + error);
				});
			}).catch(function (error) {
				toggleLoader();
				window.alert("Could not update. Error: " + error);
			});
		} else {
			// doc.data() will be undefined in this case
			console.log("No such document!");
		}
	}).catch(function (error) {
		toggleLoader();
		window.alert("Error: " + error);
	});
});
