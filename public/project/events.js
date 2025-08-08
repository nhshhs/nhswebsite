//public/project/events.js
/*jshint multistr: true */
'use strict';

console.log("Project Events.js loading");

const desktopWidth = 992,
    tabletWidth = 600;
var windowWidth = window.innerWidth;
var events = [];
var counter = -1;
var limit = 7;

$(document).ready(function () {
    $('.modal').modal();
    doEvents();
});

//for number of columns, which deepens on device size
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

//gets events, sorts them by date
function doEvents() {
    console.log("Starting to fetch project events");
    showLoader();
    
    if (!window.db) {
        console.error('Firestore db not initialized');
        document.getElementById("messagearea").innerHTML = 
            '<h5 class="center">Error: Database not initialized</h5>';
        hideLoader();
        return;
    }

    const projectEventsRef = window.db.collection("project").doc("events").collection("events");
    console.log("Attempting to query project events collection:", projectEventsRef.path);

    projectEventsRef.get()
        .then(function (query) {
            console.log("Query executed. Empty?", query.empty);
            console.log("Number of docs:", query.size);

            if (query.empty) {
                document.getElementById("messagearea").innerHTML = 
                    '<h5 class="center">There are no events right now.</h5>';
                hideLoader();
                return;
            }

            events = [];
            query.forEach(function (doc) {
                const data = doc.data();
                console.log("Processing document:", doc.id, data);
                
                // Only add the document if it has valid data
                if (data) {
                    events.push({
                        id: doc.id,
                        data: data
                    });
                }
            });
            
            if (events.length == 0) {
                document.getElementById("messagearea").innerHTML = 
                    '<h5 class="center">There are no valid events right now.</h5>';
                hideLoader();
            } else {
                try {
                    events.sort((a, b) => eventcompare(a.data, b.data));
                    
                    if (events.length > limit) {
                        document.getElementById("loadpast").classList.remove("hide");    
                    }
                    
                    counter = -1;
                    doEventsHelper();
                } catch (error) {
                    console.error("Error sorting events:", error);
                    document.getElementById("messagearea").innerHTML = 
                        '<h5 class="center">Error processing events: ' + error.message + '</h5>';
                    hideLoader();
                }
            }
        })
        .catch(function (error) {
            console.error("Error fetching project events:", error);
            document.getElementById("messagearea").innerHTML = 
                '<h5 class="center">Error loading events: ' + error.message + '</h5>';
            hideLoader();
        });
}

function eventcompare(a, b) {
    try {
        const date1 = new Date(a.date).getTime();
        const date2 = new Date(b.date).getTime();
        return date2 - date1; // Sort in descending order
    } catch (error) {
        console.error("Error comparing events:", error);
        return 0;
    }
}

var counter = -1;
var limit = 7;//just to not go over the firebase read limit

function doEventsHelper() {
    counter++;
    console.log("Processing event", counter + 1, "of", events.length);
    
    if (counter < events.length && (counter < limit || new Date() < new Date(events[counter].data.date))) {
        const event = events[counter];
        try {
            addEvent(
                event.data.title || 'Untitled Event',
                event.data.leader || 'No Leader Assigned',
                event.data.date || 'No Date Set',
                event.data.time || 'No Time Set',
                event.data.maxpeople,
                event.data.location || 'No Location Set',
                event.data.description || 'No Description Available',
                event.data.users || [],
                event.data.signupsOpen || false,
                event.id
            );
        } catch (error) {
            console.error("Error processing event:", error);
            hideLoader();
        }
    } else {
        hideLoader();
    }
}


function loadPast(){
	toggleLoader();
	limit = events.length;
	document.getElementById("loadpast").classList.add("hide");
	doEventsHelper();
}

//formats data and calls the html maker
function addEvent(title, leader, date, time, maxpeople, location, description, users, signupsOpen, id) {
    console.log("Adding event:", {title, leader, date, users});
    
    if (!users || users.length == 0) {
        addHTMLEvent(title, leader, date, time, 0, maxpeople, location, description, 
            "<p>No members have signed up.</p>", false, signupsOpen, id);
        doEventsHelper();
        return;
    }

    let userPromises = users.map(userId => 
        firebase.firestore().collection("users").doc(userId).get()
    );

    Promise.all(userPromises)
        .then(userDocs => {
            let userList = "";
            let alreadySignedUp = false;
            
            userDocs.forEach(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (firebase.auth().currentUser && doc.id === firebase.auth().currentUser.uid) {
                        userList += `<p>${userData.firstName} ${userData.lastName} (you)</p>`;
                        alreadySignedUp = true;
                    } else {
                        userList += `<p>${userData.firstName} ${userData.lastName}</p>`;
                    }
                }
            });

            // If we couldn't get any user data, show a message
            if (!userList) {
                userList = "<p>Error loading member list</p>";
            }

            addHTMLEvent(
                title, leader, date, time, users.length, maxpeople, 
                location, description, userList, alreadySignedUp, signupsOpen, id
            );
            doEventsHelper();
        })
        .catch(error => {
            console.error("Error getting user data:", error);
            addHTMLEvent(
                title, leader, date, time, users.length, maxpeople,
                location, description, "<p>Error loading member list</p>", 
                false, signupsOpen, id
            );
            doEventsHelper();
        });
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
								<a href="#" class="waves-effect waves-light btn blue darken-4 signup">Sign up!</a>\
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

var eventSelectedID = "";

$(document).on('click', '.signup', function () {
	if (firebase.auth().currentUser === null) {
		M.Modal.getInstance($("#login")).open();
	} else {
		eventSelectedID = $(this).closest(".card").find(".eventid").text();
		firebase.firestore().collection("project").doc("events").collection("events").doc(eventSelectedID).get().then(function (doc) {
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
	firebase.firestore().collection("project").doc("events").collection("events").doc(eventSelectedID).update({
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