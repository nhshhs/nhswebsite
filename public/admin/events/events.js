//public/admin/events/events.js

/*jshint multistr: true */
'use strict';

const desktopWidth = 992,
    tabletWidth = 600;
var windowWidth = window.innerWidth;
var events = [];
var counter = -1;  
var colCounter = 0;

$(document).ready(function () {
	doEvents();
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
        return 0; // Return 0 if comparison fails
    }
}

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

function doEvents() {
    console.log("Starting to fetch events");
    showLoader();
    
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
                    date: data.date,
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

function doEventsHelper() {
    console.log("Running doEventsHelper, counter:", counter);
    counter++;
    
    if (counter < events.length) {
        const event = events[counter];
        const data = event.data();
        console.log("Processing event", counter + 1, "of", events.length, ":", event.id);
        
        try {
            addEvent(
                data.title || 'Untitled',
                data.leader || 'No leader specified',
                data.date || 'No date specified',
                data.time || 'No time specified',
                data.maxpeople,
                data.location || 'No location specified',
                data.description || 'No description available',
                data.users || [],
                event.id
            );
        } catch (error) {
            console.error("Error processing event:", error);
        }
    } else {
        console.log("All events processed");
        hideLoader();
    }
}

function addEvent(title, leader, date, time, maxpeople, location, description, users, id) {
    console.log("Adding event to DOM:", {
        id: id,
        title: title,
        users: users
    });
    
    addHTMLEvent(
        title, 
        leader, 
        date, 
        time, 
        users.length, 
        maxpeople, 
        location, 
        description, 
        id
    );
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
	//description = linkifyStr(description);
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
