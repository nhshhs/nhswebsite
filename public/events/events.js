//public/events/events.js

/*jshint multistr: true */
'use strict';

const db = firebase.firestore();
window.db = db;
const desktopWidth = 992,
    tabletWidth = 600;
var windowWidth = window.innerWidth;
var events = [];
var counter = -1;  
var colCounter = 0;

console.log("Events.js loading");

if (!firebase.apps.length) {
    console.error('Firebase is not initialized');
}

if (!window.db) {
    console.error('Firestore db not initialized');
}

$(document).ready(function () {
	$('.modal').modal();
	doEvents();
});

db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.error('The current browser does not support persistence.');
    }
  });

function eventcompare(a, b) {
    try {
        var date1 = new Date(a.data().date).getTime();
        var date2 = new Date(b.data().date).getTime();
        if (date1 > date2) return -1;
        else if (date1 < date2) return 1;
        else return 0;
    } catch (error) {
        console.error("Error comparing events:", error);
        return 0;
    }
}

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

function doEvents() {
    console.log("Starting to fetch events");
    showLoader();
    
    if (!window.db) {
        console.error('Firestore db not initialized');
        document.getElementById("messagearea").innerHTML = 
            '<h5 class="center">Error: Database not initialized</h5>';
        hideLoader();
        return;
    }

    counter = -1;
    colCounter = 0;
    events = [];

    const eventsRef = window.db.collection("events");
    console.log("Attempting to query events collection:", eventsRef.path);

    eventsRef
        .get()
        .then(snapshot => {
            console.log("Query executed. Empty?", snapshot.empty);
            console.log("Number of docs:", snapshot.size);
            
            if (snapshot.empty) {
                document.getElementById("messagearea").innerHTML = 
                    '<h5 class="center">There are no events right now.</h5>';
                hideLoader();
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                console.log("Event document:", {
                    id: doc.id,
                    title: data.title,
                    exists: doc.exists
                });
                events.push(doc);
            });

            if (events.length > 0) {
                try {
                    console.log("Sorting events");
                    events.sort(eventcompare);
                    doEventsHelper();
                } catch (error) {
                    console.error("Error sorting events:", error);
                    doEventsHelper();
                }
            } else {
                hideLoader();
            }
        })
        .catch(error => {
            console.error("Error fetching events:", error);
            document.getElementById("messagearea").innerHTML = 
                '<h5 class="center">Error loading events: ' + error.message + '</h5>';
            hideLoader();
        });
}

var counter = -1;
var limit = 7; //just to not go over the read limit on firebase

function doEventsHelper() {
    console.log("doEventsHelper called with counter:", counter);
    counter++;
    
    if (counter < events.length) {
        const event = events[counter];
        const data = event.data();
        
        console.log("Processing event", counter + 1, "of", events.length, {
            id: event.id,
            data: data
        });
        
        addEvent(
            data.title || 'No title',
            data.leader || 'No leader',
            data.date || 'No date',
            data.time || 'No time',
            data.maxpeople,
            data.location || 'No location',
            data.description || 'No description',
            data.users || [],
            event.id
        );
    } else {
        console.log("Finished processing all events");
        hideLoader();
    }
}


function loadPast(){
	toggleLoader();
	limit = events.length;
	document.getElementById("loadpast").classList.add("hide");
	doEventsHelper();
}

//formats the data nicer then calls the function that does the html
function addEvent(title, leader, date, time, maxpeople, location, description, users, id) {
    console.log('Adding event:', { id, title }); // Debug log
    
    if (users.length == 0) {
        addHTMLEvent(title, leader, date, time, 0, maxpeople, location, description, 
                    "<p>No members have signed up.</p>", false, true, id);
        doEventsHelper();
    } else {
        let userList = "";
        let alreadySignedUp = false;
        
        // Create a batch of promises to fetch all user data
        const userPromises = users.map(userId => 
            firebase.firestore().collection("users").doc(userId).get()
                .catch(error => {
                    console.warn(`Error fetching user ${userId}:`, error);
                    return null;
                })
        );

        Promise.all(userPromises)
            .then(userDocs => {
                userDocs.forEach(doc => {
                    if (doc && doc.exists) {
                        const userData = doc.data();
                        if (firebase.auth().currentUser && doc.id === firebase.auth().currentUser.uid) {
                            userList += `<p>${userData.firstName} ${userData.lastName} (you)</p>`;
                            alreadySignedUp = true;
                        } else {
                            userList += `<p>${userData.firstName} ${userData.lastName}</p>`;
                        }
                    }
                });

                addHTMLEvent(title, leader, date, time, users.length, maxpeople, location, 
                           description, userList, alreadySignedUp, true, id);
                doEventsHelper();
            })
            .catch(error => {
                console.error("Error processing users:", error);
                addHTMLEvent(title, leader, date, time, users.length, maxpeople, location,
                           description, "<p>Error loading member list</p>", false, true, id);
                doEventsHelper();
            });
    }
}
var colCounter = 0;

function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id) {
    console.log('Creating HTML for event:', { id, title }); // Debug log
    
    if (isNaN(maxpeople)) {
        maxpeople = "unlimited";
    }
    
    var div = document.createElement('div');
    div.className = 'card hoverable';
    div.setAttribute('data-event-id', id); // Store ID as data attribute
    
    if (alreadySignedUp) {
        div.innerHTML = `<div class="card-content"> 
            <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
            <br>
            <p><b>Event leader: </b> ${leader}</p>
            <p><i class="material-icons">today</i> ${date}</p>
            <p><i class="material-icons">access_time</i> ${time}</p>
            <p><i class="material-icons">location_on</i> ${location}</p>
            <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
            <br>
            <p>${description}</p>
            <br>
            <h6>Members Attending:</h6>${userList}
        </div>
        <div class="card-action center-align">
            <p class="blue-text text-darken-4">You have already signed up for this event.</p>
        </div>
        <input type="hidden" class="eventid" value="${id}">`;
    } else if (signupsOpen) {
        div.innerHTML = `<div class="card-content">
            <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
            <br>
            <p><b>Event leader: </b> ${leader}</p>
            <p><i class="material-icons">today</i> ${date}</p>
            <p><i class="material-icons">access_time</i> ${time}</p>
            <p><i class="material-icons">location_on</i> ${location}</p>
            <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
            <br>
            <p>${description}</p>
            <br>
            <h6>Members Attending:</h6>${userList}
        </div>
        <div class="card-action center-align">
            ${(new Date(date) < new Date()) 
              ? '<p class="blue-text text-darken-4">This event has already passed.</p>' 
              : (userCount >= maxpeople 
                 ? '<p class="blue-text text-darken-4">This event is full.</p>' 
                 : '<a href="#" class="waves-effect waves-light btn blue darken-4 signup">Sign up!</a>')}
        </div>
        <input type="hidden" class="eventid" value="${id}">`;
    } else {
        div.innerHTML = `<div class="card-content">
            <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
            <br>
            <p><b>Event leader: </b> ${leader}</p>
            <p><i class="material-icons">today</i> ${date}</p>
            <p><i class="material-icons">access_time</i> ${time}</p>
            <p><i class="material-icons">location_on</i> ${location}</p>
            <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
            <br>
            <p>${description}</p>
            <br>
            <h6>Members Attending:</h6>${userList}
        </div>
        <div class="card-action center-align">
            <p class="blue-text text-darken-4">Signups are closed.</p>
        </div>
        <input type="hidden" class="eventid" value="${id}">`;
    }

    // Column handling
    if (windowWidth > desktopWidth) {
        document.getElementById("col" + (colCounter + 1)).appendChild(div);
        colCounter++;
        if (colCounter >= 3) colCounter = 0;
    } else if (windowWidth > tabletWidth) {
        document.getElementById("col" + (colCounter + 1)).appendChild(div);
        colCounter++;
        if (colCounter >= 2) colCounter = 0;
    } else {
        document.getElementById("col" + (colCounter + 1)).appendChild(div);
    }
}

var eventSelectedID = "";

$(document).on('click', '.signup', function() {
    if (firebase.auth().currentUser === null) {
        console.log('User not authenticated, opening login modal');
        M.Modal.getInstance($("#login")).open();
    } else {
        const card = $(this).closest('.card');
        eventSelectedID = card.find('.eventid').val();
        console.log('Event ID found:', eventSelectedID);
        
        if (!eventSelectedID) {
            console.error('No event ID found in card');
            return;
        }

        firebase.firestore().collection("events").doc(eventSelectedID).get()
            .then(function(doc) {
                console.log('Fetched document:', doc.exists ? 'exists' : 'does not exist');
                
                if (doc.exists) {
                    const data = doc.data();
                    console.log('Event data:', data);
                    
                    if (!isNaN(data.maxpeople) && data.users && data.users.length >= data.maxpeople) {
                        eventSelectedID = "";
                        M.Modal.getInstance($("#fullevent")).open();
                    } else {
                        M.Modal.getInstance($("#areyousure")).open();
                    }
                } else {
                    console.error("No document found with ID:", eventSelectedID);
                }
            })
            .catch(function(error) {
                console.error("Error getting document:", error);
            });
    }
});

function acceptareyousureModal() {
    console.log('Accepting signup for event:', eventSelectedID);
    const currentUser = firebase.auth().currentUser;
    console.log('Current user:', currentUser ? currentUser.uid : 'no user');
    
    if (!eventSelectedID) {
        console.error('No event ID selected');
        return;
    }
    
    firebase.firestore().collection("events").doc(eventSelectedID)
        .update({
            users: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid),
        })
        .then(function () {
            console.log('Successfully updated event');
            // Add a small delay before reload to ensure update completes
            setTimeout(() => {
                location.reload();
            }, 1000);
        })
        .catch(function (error) {
            console.error("Error updating document:", error);
            window.alert("Could not update. Error: " + error);
        });
}

function cancelareyousureModal() {
	eventSelectedID = "";
}

