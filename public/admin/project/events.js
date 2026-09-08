//public/admin/project/events.js
/*jshint multistr: true */
'use strict';

const desktopWidth = 992,
	tabletWidth = 600;
var windowWidth = window.innerWidth;

$(document).ready(function () {
	$(".modal").modal();
	doEvents();
});

//for number of columns, which depens on device size
window.onresize = function () {
	if (window.innerWidth > windowWidth) { //window width got bigger
		if (window.innerWidth > tabletWidth && windowWidth <= tabletWidth) {
			location.reload();
		} else if (window.innerWidth > desktopWidth && windowWidth <= desktopWidth) {
			location.reload();
		}
	} else { //window width got smaller
		if (window.innerWidth <= tabletWidth && windowWidth > tabletWidth) {
			location.reload();
		} else if (window.innerWidth <= desktopWidth && windowWidth > desktopWidth) {
			location.reload();
		}
	}
};

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
	}
});

var events = [];

function doEvents() {//sorts events by date
	firebase.firestore().collection("project").doc("events").collection("events").get().then(function (query) {

		query.forEach(function (doc) {
			events.push(doc);
		});
		
		if(events.length == 0){
			document.getElementById("messagearea").innerHTML = '<h5 class="center">There are no events right now.</h5>';
			toggleLoader();
		} else {
			events.sort(eventcompare);

			function eventcompare(a, b) {
				var date1 = new Date(a.data().date).getTime();
				var date2 = new Date(b.data().date).getTime();
				if (date1 > date2) return -1;
				else if (date1 < date2) return 1;
				else return 0;
			}
			
			doEventsHelper();	
		}

	}).catch(function (error) {
		console.log("new error", error);
	});
}

var counter = -1;

function doEventsHelper() {
	counter++;
	if (counter<events.length) {
		//doesn't show member names in event cards
		addEvent(events[counter].data().title, events[counter].data().leader, events[counter].data().date, events[counter].data().time, events[counter].data().maxpeople, events[counter].data().location, events[counter].data().description, events[counter].data().users, events[counter].id);
		//shows member names in event cards
//		addEventWithNames(events[counter].data().title, events[counter].data().leader, events[counter].data().date, events[counter].data().time, events[counter].data().maxpeople, events[counter].data().location, events[counter].data().description, events[counter].data().users, events[counter].id);
	} else {
		toggleLoader();
	}
}

function addEvent(title, leader, date, time, maxpeople, location, description, users, id) {
	addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, description, id);
	doEventsHelper();
}

function addEventWithNames(title, leader, date, time, maxpeople, location, description, users, id) {
	if (users.length == 0) {
		addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, description+="</p><br><p>No members have signed up.</p>", id);
		doEventsHelper();
	} else {
		var userList = "";
		var numberDone = 0;
		var alreadySignedUp = false;
		for (var i = 0; i < users.length; i++) {
			firebase.firestore().collection("users").doc(users[i]).get().then(function (doc) {
				if (doc.exists) {
					userList += "<p>" + doc.data().firstName + " " + doc.data().lastName + "</p>";

					numberDone++;
					if (numberDone >= users.length) {
						description += "</p><br><h6>Members Attending:</h6>" + userList;
						addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, description, id);
						doEventsHelper();
					}
				} else {
					// doc.data() will be undefined in this case
					console.log("No such document!");
				}
			}).catch(function (error) {
				console.log("Error getting document:", error);
			});
		}
	}
}


function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, id) {
	if (isNaN(maxpeople)) {
		maxpeople = "unlimited";
	}
	// Build a panel that matches the site-wide event panels (collapsible body + footer show-more)
	var div = document.createElement('div');
	div.className = 'panel panel--event card hoverable';
	div.innerHTML = `
		<div class="card-content panel-content--event">
			<div class="container event-header-container">
				<div class="row event-header-row" style="margin: 0">
					<div class="col s8 event-header-left">
						<span class="card-title blue-text text-darken-4"><b>${title}</b></span>
					</div>
					<div class="col s4 event-header-right">
						<p class="event-text"><b>Event Leader:</b>${leader}</p>
					</div>
				</div>
			</div>
			<div class="container event-body-container">
				<div class="event-body-inner collapsed">
					<div class="row" style="margin: 0;">
						<div class="col s12">
							<p><i class="material-icons">today</i>${date}</p>
							<p><i class="material-icons">access_time</i>${time}</p>
							<p><i class="material-icons">location_on</i>${location}</p>
							<div class="event-description">${description}</div>
						</div>
					</div>
				</div>
			</div>
			<div class="container event-footer-container">
				<div class="row event-footer-row">
					<div class="col s12 event-footer-col">
						<a href="#" class="waves-effect waves-light btn blue darken-4 manage" style="margin-left: auto;">Manage</a>
						<a href="#" class="waves-effect waves-light btn red accent-4 delete-event-btn" style="margin-left: 8px;">Delete</a>
					</div>
				</div>
			</div>
		</div>
		<p class="hide eventid">${id}</p>`;
	//for number of columns, which depens on device size
	document.getElementById('projectEventCol').appendChild(div);
}

$(document).on('click', '.manage', function () {
	var eventSelectedID = $(this).closest(".card").find(".eventid").text();
	window.location = "/admin/event/index.html?type=project&eventid=" + eventSelectedID;
});

var pendingDeleteEventId = null;
var pendingDeleteEventCard = null;

$(document).on('click', '.delete-event-btn', function (e) {
	e.preventDefault();
	var card = $(this).closest(".card");
	var id = card.find(".eventid").text();
	var title = card.find(".card-title").text().trim();
	if (e.shiftKey) {
		deleteListEvent(id, card);
	} else {
		pendingDeleteEventId = id;
		pendingDeleteEventCard = card;
		$("#deleteEventName").text(title);
		M.Modal.getInstance($("#areyousuredeleteevent")).open();
	}
});

function confirmDeleteListEvent() {
	if (!pendingDeleteEventId) {
		return;
	}
	deleteListEvent(pendingDeleteEventId, pendingDeleteEventCard);
}

function deleteListEvent(id, card) {
	toggleLoader();
	firebase.firestore().collection("project").doc("events").collection("events").doc(id).delete().then(function () {
		pendingDeleteEventId = null;
		pendingDeleteEventCard = null;
		if (card && card.length) {
			card.remove();
		}
		if ($("#projectEventCol .card").length === 0) {
			document.getElementById("messagearea").innerHTML =
				'<h5 class="center">There are no events right now.</h5>';
		}
		toggleLoader();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not delete event. Error: " + (error.message || error));
	});
}
