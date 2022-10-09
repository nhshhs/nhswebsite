/*jshint multistr: true */
'use strict';


const desktopWidth = 992,
	tabletWidth = 600;
var windowWidth = window.innerWidth;

$(document).ready(function () {
	$('.modal').modal();
	doEvents();
});

//for the number of columns, which depends on device
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

function doEvents() {//sorts events by date and puts them on the page
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
				if (date1 > date2) {return -1;}
				else if (date1 < date2) {return 1;}
				else {return 0;}
			}
			if(events.length>limit) {
				document.getElementById("loadpast").classList.remove("hide");
			}
			doEventsHelper();	
		}

	}).catch(function (error) {
		console.log("new error", error);
	});
}

var counter = -1;
var limit = 7; //just to not go over the read limit on firebase

function doEventsHelper() {
	counter++;
	if (counter<events.length&&(counter < limit || new Date() < new Date(events[counter].data().date))) {
		addEvent(events[counter].data().title, events[counter].data().leader, events[counter].data().date, events[counter].data().time, events[counter].data().maxpeople, events[counter].data().location, events[counter].data().description, events[counter].data().users, events[counter].data().signupsOpen, events[counter].id);
	} else {
		toggleLoader();
	}
}

function loadPast(){
	toggleLoader();
	limit = events.length;
	document.getElementById("loadpast").classList.add("hide");
	doEventsHelper();
}

//formats the data nicer then calls the function that does the html
function addEvent(title, leader, date, time, maxpeople, location, description, users, signupsOpen, id) {
	if (users.length == 0) {
		addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, description, "<p>No members have signed up.</p>", false, signupsOpen, id);
		doEventsHelper();
	} else {
		var userList = "";
		var numberDone = 0;
		var alreadySignedUp = false;
		for (var i = 0; i < users.length; i++) {
			firebase.firestore().collection("users").doc(users[i]).get().then(function (doc) {
				if (doc.exists) {
					if (firebase.auth().currentUser != null && doc.id === firebase.auth().currentUser.uid) {
						userList += "<p>" + doc.data().firstName + " " + doc.data().lastName + " (you)</p>";
						alreadySignedUp = true;
					} else {
						userList += "<p>" + doc.data().firstName + " " + doc.data().lastName + "</p>";
					}

					numberDone++;
					if (numberDone >= users.length) {
						addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id);
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

function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id) {
	if (isNaN(maxpeople)) {
		maxpeople = "unlimited";
	}
	//description = linkifyStr(description);
	var div = document.createElement('div');
	div.className = 'card hoverable';
	if (alreadySignedUp) {
		div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4"><b>' + title + '</b></span>\
							<br>\
							<p><b>Event leader: </b> ' + leader + '</p>\
							<p><i class="material-icons">today</i> ' + date + '</p>\
							<p><i class="material-icons">access_time</i> ' + time + '</p>\
							<p><i class="material-icons">location_on</i> ' + location + '</p>\
							<p><i class="material-icons">people</i> ' + userCount + '/' + maxpeople + '</p>\
							<br>\
							<p>' + description + '</p>\
							<br>\
							<h6>Members Attending:</h6>' + userList + '\
						</div>\
						<div class="card-action center-align">\
							<p class="blue-text text-darken-4">You have already signed up for this event.</p>\
						</div>\
							<p class="hide eventid">' + id + '</p>';
	} else if (signupsOpen) {
		div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4"><b>' + title + '</b></span>\
								<br>\
								<p><b>Event leader: </b> ' + leader + '</p>\
								<p><i class="material-icons">today</i> ' + date + '</p>\
								<p><i class="material-icons">access_time</i> ' + time + '</p>\
								<p><i class="material-icons">location_on</i> ' + location + '</p>\
								<p><i class="material-icons">people</i> ' + userCount + '/' + maxpeople + '</p>\
								<br>\
								<p>' + description + '</p>\
								<br>\
								<h6>Members Attending:</h6>' + userList + '\
							</div>\
							<div class="card-action center-align">\
								' + ((new Date(date) < new Date()) ? '<p class="blue-text text-darken-4">This event has already passed.</p>' : (userCount >= maxpeople ? '<p class="blue-text text-darken-4">This event is full.</p>' : '<a href="#" class="waves-effect waves-light btn blue darken-4 signup">Sign up!</a>')) + '\
							</div>\
								<p class="hide eventid">' + id + '</p>';
	} else {
		div.innerHTML = '<div class="card-content"> <span class="card-title blue-text text-darken-4"><b>' + title + '</b></span>\
								<br>\
								<p><b>Event leader: </b> ' + leader + '</p>\
								<p><i class="material-icons">today</i> ' + date + '</p>\
								<p><i class="material-icons">access_time</i> ' + time + '</p>\
								<p><i class="material-icons">location_on</i> ' + location + '</p>\
								<p><i class="material-icons">people</i> ' + userCount + '/' + maxpeople + '</p>\
								<br>\
								<p>' + description + '</p>\
								<br>\
								<h6>Members Attending:</h6>' + userList + '\
							</div>\
							<div class="card-action center-align">\
								<p class="blue-text text-darken-4">Signups are closed.</p>\
							</div>\
								<p class="hide eventid">' + id + '</p>';
	}
	//how many columns to have, depends on device size
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

var eventSelectedID = "";

$(document).on('click', '.signup', function () {
	if (firebase.auth().currentUser === null) {
		M.Modal.getInstance($("#login")).open();
	} else {
		eventSelectedID = $(this).closest(".card").find(".eventid").text();
		firebase.firestore().collection("events").doc(eventSelectedID).get().then(function (doc) {
			if (doc.exists) {
				if (!isNaN(doc.data().maxpeople) && doc.data().users.length >= doc.data().maxpeople) {
					eventSelectedID = "";
					M.Modal.getInstance($("#fullevent")).open();
				} else {
					var areyousuremodal = M.Modal.getInstance($("#areyousure"));
					areyousuremodal.open();
				}
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}
});

function acceptareyousureModal() {
	firebase.firestore().collection("events").doc(eventSelectedID).update({
		users: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid),
	}).then(function () {
		toggleLoader();
		location.reload();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
		location.reload();
	});
}

function cancelareyousureModal() {
	eventSelectedID = "";
}

