/*jshint multistr: true */
'use strict';

const desktopWidth = 992, tabletWidth = 600;
var windowWidth = window.innerWidth;

$(document).ready(function () {
	$(".modal").modal();

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
	// mark as blog so it can bypass event preview clipping
	div.className = 'panel panel--event panel--blog card hoverable';
	div.innerHTML = `
		<div class="card-content panel-content--event">
			<div class="container event-header-container">
				<div class="row event-header-row" style="margin: 0">
					<div class="col s8 event-header-left">
						<span class="card-title blue-text text-darken-4"><b>${event}</b></span>
					</div>
					<div class="col s4 event-header-right">
						<p class="event-text"><b>Author:</b> ${author}</p>
					</div>
				</div>
			</div>
			<div class="container event-body-container">
				<p>${post}</p>
			</div>
			<div class="container event-footer-container">
				<div class="row event-footer-row">
					<div class="col s12 event-footer-col">
						<a href="#" class="waves-effect waves-light btn blue darken-4 approve" style="margin:auto;">Approve</a>
						<a href="#" class="waves-effect waves-light btn red accent-4 delete-blog-btn" style="margin-left: 8px;">Delete</a>
					</div>
				</div>
			</div>
		</div>
		<p class="hide blogid">${blogid}</p>
		<p class="hide authorid">${authorid}</p>`;
	document.getElementById("projectBlogsCol").appendChild(div);
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

var pendingDeleteBlogId = null;
var pendingDeleteBlogCard = null;

$(document).on('click', '.delete-blog-btn', function (e) {
	e.preventDefault();
	var card = $(this).closest(".card");
	var id = card.find(".blogid").text();
	var author = card.find(".event-text").text().replace(/^Author:\s*/i, "").trim();
	if (e.shiftKey) {
		deleteBlogPost(id, card);
	} else {
		pendingDeleteBlogId = id;
		pendingDeleteBlogCard = card;
		$("#deleteBlogName").text(author || "this author");
		M.Modal.getInstance($("#areyousuredeleteblog")).open();
	}
});

function confirmDeleteBlog() {
	if (!pendingDeleteBlogId) {
		return;
	}
	deleteBlogPost(pendingDeleteBlogId, pendingDeleteBlogCard);
}

function deleteBlogPost(id, card) {
	toggleLoader();
	firebase.firestore().collection("project").doc("blog").collection("pending").doc(id).delete().then(function () {
		pendingDeleteBlogId = null;
		pendingDeleteBlogCard = null;
		if (card && card.length) {
			card.remove();
		}
		if ($("#projectBlogsCol .card").length === 0) {
			$("#blogcontainer").html('<h5 class="center">There are no pending blog posts.</h5>');
		}
		toggleLoader();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not delete blog post. Error: " + (error.message || error));
	});
}
