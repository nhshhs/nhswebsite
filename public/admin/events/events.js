/*jshint multistr: true */
'use strict';

const desktopWidth = 992,
	tabletWidth = 600;
var windowWidth = window.innerWidth;

$(document).ready(function () {
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

function doEvents() { //sorts events by date
	firebase.firestore().collection("events").get().then(function (query) {

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

//gets the data for each event and then calls the html function
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

var colCounter = 0;

function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, id) {
	if (isNaN(maxpeople)) {
		maxpeople = "unlimited";
	}
	description = linkifyStr(description);
	var div = document.createElement('div');
	div.className = 'card hoverable';
	div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4"><b>' + title + '</b></span>\
								<br>\
								<p><b>Event leader: </b> ' + leader + '</p>\
								<p><i class="material-icons">today</i> ' + date + '</p>\
								<p><i class="material-icons">access_time</i> ' + time + '</p>\
								<p><i class="material-icons">location_on</i> ' + location + '</p>\
								<p><i class="material-icons">people</i> ' + userCount + '/' + maxpeople + '</p>\
								<br>\
								<p>' + description + '</p>\
							</div>\
							<div class="card-action center-align">\
								<a href="#" class="waves-effect waves-light btn blue darken-4 manage">Manage</a>\
							</div>\
								<p class="hide eventid">' + id + '</p>';
	//for number of columns, which depens on device size
	if (windowWidth > desktopWidth) {
		document.getElementById("col" + (colCounter + 1)).appendChild(div);
		colCounter++;
		if (colCounter >= 3) { //3 columns
			colCounter = 0;
		}
	} else if (windowWidth > tabletWidth) {
		document.getElementById("col" + (colCounter + 1)).appendChild(div);
		colCounter++;
		if (colCounter >= 2) { //2 columns
			colCounter = 0;
		}
	} else { //mobile devices
		document.getElementById("col" + (colCounter + 1)).appendChild(div); //1 column
	}
}

$(document).on('click', '.manage', function () {
	var eventSelectedID = $(this).closest(".card").find(".eventid").text();
	window.location = "/admin/event/index.html?type=regular&eventid=" + eventSelectedID;
});
