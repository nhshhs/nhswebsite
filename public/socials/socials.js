//public/socials/socials.js

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

    const eventsRef = window.db.collection("socials");
    console.log("Attempting to query events collection:", eventsRef.path);

    eventsRef
        .get()
        .then(snapshot => {
            console.log("Query executed. Empty?", snapshot.empty);
            console.log("Number of docs:", snapshot.size);
            
            if (snapshot.empty) {
                document.getElementById("messagearea").innerHTML = 
                    '<h5 class="center">There are no socials right now.</h5>';
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
                '<h5 class="center">Error loading socials: ' + error.message + '</h5>';
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
            event.id,
            data.additionalStepRequired,
            data.additionalStepDescription,
            data.additionalStepLinks || (data.additionalStepLink ? [data.additionalStepLink] : []),
            data.signupsOpen
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
function addEvent(title, leader, date, time, maxpeople, location, description, users, id, additionalStepRequired, additionalStepDescription, additionalStepLinks, signupsOpen) {
    console.log('Adding event:', { id, title }); // Debug log
    
    if (users.length == 0) {
        addHTMLEvent(title, leader, date, time, 0, maxpeople, location, description, 
                    "<p>No members have signed up.</p>", false, signupsOpen !== false, id, 
                    additionalStepRequired, additionalStepDescription, additionalStepLinks, []);
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
                           description, userList, alreadySignedUp, signupsOpen !== false, id,
                           additionalStepRequired, additionalStepDescription, additionalStepLinks, users);
                doEventsHelper();
            })
            .catch(error => {
                console.error("Error processing users:", error);
                addHTMLEvent(title, leader, date, time, users.length, maxpeople, location,
                           description, "<p>Error loading member list</p>", false, signupsOpen !== false, id,
                           additionalStepRequired, additionalStepDescription, additionalStepLinks, users);
                doEventsHelper();
            });
    }
}
// var colCounter = 0;

// function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id) {
//     console.log('Creating HTML for event:', { id, title }); // Debug log
    
//     if (isNaN(maxpeople)) {
//         maxpeople = "unlimited";
//     }
    
//     var div = document.createElement('div');
//     div.className = 'card hoverable';
//     div.setAttribute('data-event-id', id); // Store ID as data attribute
    
//     if (alreadySignedUp) {
//         div.innerHTML = `<div class="card-content"> 
//             <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
//             <br>
//             <p><b>Event leader: </b> ${leader}</p>
//             <p><i class="material-icons">today</i> ${date}</p>
//             <p><i class="material-icons">access_time</i> ${time}</p>
//             <p><i class="material-icons">location_on</i> ${location}</p>
//             <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
//             <br>
//             <p>${description}</p>
//             <br>
//             <h6>Members Attending:</h6>${userList}
//         </div>
//         <div class="card-action center-align">
//             <p class="blue-text text-darken-4">You have already signed up for this event.</p>
//         </div>
//         <input type="hidden" class="eventid" value="${id}">`;
//     } else if (signupsOpen) {
//         div.innerHTML = `<div class="card-content">
//             <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
//             <br>
//             <p><b>Event leader: </b> ${leader}</p>
//             <p><i class="material-icons">today</i> ${date}</p>
//             <p><i class="material-icons">access_time</i> ${time}</p>
//             <p><i class="material-icons">location_on</i> ${location}</p>
//             <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
//             <br>
//             <p>${description}</p>
//             <br>
//             <h6>Members Attending:</h6>${userList}
//         </div>
//         <div class="card-action center-align">
//             ${(new Date(date) < new Date()) 
//               ? '<p class="blue-text text-darken-4">This event has already passed.</p>' 
//               : (userCount >= maxpeople 
//                  ? '<p class="blue-text text-darken-4">This event is full.</p>' 
//                  : '<a href="#" class="waves-effect waves-light btn blue darken-4 signup">Sign up!</a>')}
//         </div>
//         <input type="hidden" class="eventid" value="${id}">`;
//     } else {
//         div.innerHTML = `<div class="card-content">
//             <span class="card-title blue-text text-darken-4"><b>${title}</b></span>
//             <br>
//             <p><b>Event leader: </b> ${leader}</p>
//             <p><i class="material-icons">today</i> ${date}</p>
//             <p><i class="material-icons">access_time</i> ${time}</p>
//             <p><i class="material-icons">location_on</i> ${location}</p>
//             <p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
//             <br>
//             <p>${description}</p>
//             <br>
//             <h6>Members Attending:</h6>${userList}
//         </div>
//         <div class="card-action center-align">
//             <p class="blue-text text-darken-4">Signups are closed.</p>
//         </div>
//         <input type="hidden" class="eventid" value="${id}">`;
//     }

//     // Column handling
//     if (windowWidth > desktopWidth) {
//         document.getElementById("col" + (colCounter + 1)).appendChild(div);
//         colCounter++;
//         if (colCounter >= 3) colCounter = 0;
//     } else if (windowWidth > tabletWidth) {
//         document.getElementById("col" + (colCounter + 1)).appendChild(div);
//         colCounter++;
//         if (colCounter >= 2) colCounter = 0;
//     } else {
//         document.getElementById("col" + (colCounter + 1)).appendChild(div);
//     }
// }

function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id, additionalStepRequired, additionalStepDescription, additionalStepLinks, users) {
    console.log('Creating HTML for event:', { id, title }); // Debug log
    
    if (isNaN(maxpeople)) {
        maxpeople = "unlimited";
    }
    
    var div = document.createElement('div');
    // Make this element the panel itself to avoid nested .card elements which caused corner artifacts
    div.className = 'panel panel--event card hoverable';
    div.setAttribute('data-event-id', id); // Store ID as data attribute
    
    // Check if event has additional step
    var hasAdditionalStep = additionalStepRequired && additionalStepDescription && additionalStepLinks && additionalStepLinks.length > 0;
    
    // Determine button/message to show
    var buttonHtml = '';
    var eventPassed = new Date(date) < new Date();
    var eventFull = !isNaN(maxpeople) && userCount >= maxpeople;
    
    if (hasAdditionalStep) {
        // Always show View button when there's an additional step
        buttonHtml = '<a href="#" class="waves-effect waves-light btn blue darken-4 view-additional-step">View</a>';
    } else {
        // Regular flow without additional step
        if (alreadySignedUp) {
            buttonHtml = '<p class="blue-text text-darken-4">You have already signed up for this social.</p>';
        } else if (!signupsOpen) {
            buttonHtml = '<p class="blue-text text-darken-4">Signups are closed.</p>';
        } else if (eventPassed) {
            buttonHtml = '<p class="blue-text text-darken-4">This social has already passed.</p>';
        } else if (eventFull) {
            buttonHtml = '<p class="blue-text text-darken-4">This social is full.</p>';
        } else {
            buttonHtml = '<a href="#" class="waves-effect waves-light btn blue darken-4 signup">Sign up!</a>';
        }
    }
    
    if (alreadySignedUp && !hasAdditionalStep) {
        div.innerHTML = `
            <div class="card-content panel-content--event">
				<div class="container event-header-container">
					<div class="row event-header-row" style="margin: 0">
						<div class="col s8 event-header-left">
							<span class="card-title blue-text text-darken-4"><b>${title}</b></span>
						</div>
						<div class="col s4 event-header-right">
							<p class="event-text"><b>Event Leader:</b> ${leader}</p>
						</div>
					</div>
				</div>
				<div class="container event-body-container">
					<!-- Collapsible inner wrapper: when collapsed it hides overflow and applies the fade/blur -->
					<div class="event-body-inner collapsed">
						<div class="row" style="margin: 0;">
							<div class="col s8">
							<p><i class="material-icons">today</i> ${date}</p>
							<p><i class="material-icons">access_time</i> ${time}</p>
							<p><i class="material-icons">location_on</i> ${location}</p>
							<div class="event-description">${description}</div>
							</div>
							<div class="col s4 event-members-list">
							<p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
							<p><b>Members Attending:</b></p>
							${userList}
							</div>
						</div>
                    </div>
                    </div>
                <div class="container event-footer-container">
					<div class="row event-footer-row">
						<div class="col s12 event-footer-col">
                            <a href="#" class="show-more">Show More</a>
                            ${buttonHtml}
						</div>
					</div>
                </div>
            </div>
        <input type="hidden" class="eventid" value="${id}">
        <input type="hidden" class="hasAdditionalStep" value="${hasAdditionalStep}">
        <input type="hidden" class="alreadySignedUp" value="${alreadySignedUp}">
        <input type="hidden" class="eventDate" value="${date}">
        <input type="hidden" class="eventMaxPeople" value="${maxpeople}">
        <input type="hidden" class="eventUserCount" value="${userCount}">
        <input type="hidden" class="signupsOpen" value="${signupsOpen}">`;
    } else {
        div.innerHTML = `
            <div class="card-content panel-content--event">
				<div class="container event-header-container">
					<div class="row event-header-row" style="margin: 0">
						<div class="col s8 event-header-left">
							<span class="card-title blue-text text-darken-4"><b>${title}</b></span>
						</div>
						<div class="col s4 event-header-right">
							<p class="event-text"><b>Event Leader:</b> ${leader}</p>
						</div>
					</div>
				</div>
				<div class="container event-body-container">
					<!-- Collapsible inner wrapper: when collapsed it hides overflow and applies the fade/blur -->
					<div class="event-body-inner collapsed">
						<div class="row" style="margin: 0;">
							<div class="col s8">
							<p><i class="material-icons">today</i> ${date}</p>
							<p><i class="material-icons">access_time</i> ${time}</p>
							<p><i class="material-icons">location_on</i> ${location}</p>
							<div class="event-description">${description}</div>
							</div>
							<div class="col s4 event-members-list">
							<p><i class="material-icons">people</i> ${userCount}/${maxpeople}</p>
							<p><b>Members Attending:</b></p>
							${userList}
							</div>
						</div>
                    </div>
                    </div>
                <div class="container event-footer-container">
					<div class="row event-footer-row">
						<div class="col s12 event-footer-col">
                            <a href="#" class="show-more">Show More</a>
                            ${buttonHtml}
						</div>
					</div>
                </div>
            </div>
        <input type="hidden" class="eventid" value="${id}">
        <input type="hidden" class="hasAdditionalStep" value="${hasAdditionalStep}">
        <input type="hidden" class="alreadySignedUp" value="${alreadySignedUp}">
        <input type="hidden" class="eventDate" value="${date}">
        <input type="hidden" class="eventMaxPeople" value="${maxpeople}">
        <input type="hidden" class="eventUserCount" value="${userCount}">
        <input type="hidden" class="signupsOpen" value="${signupsOpen}">`;
    }

    document.getElementById("eventCol").appendChild(div);
}

var eventSelectedID = "";

// Handle View button for additional step events
$(document).on('click', '.view-additional-step', function(e) {
    e.preventDefault();
    const card = $(this).closest('.card');
    eventSelectedID = card.find('.eventid').val() || card.find('.eventid').text();
    
    if (!eventSelectedID) {
        console.error('No event ID found in card');
        return;
    }

    firebase.firestore().collection("socials").doc(eventSelectedID).get()
        .then(function(doc) {
            if (doc.exists) {
                const data = doc.data();
                const alreadySignedUp = card.find('.alreadySignedUp').val() === 'true';
                const eventDate = card.find('.eventDate').val();
                const eventMaxPeople = parseFloat(card.find('.eventMaxPeople').val());
                const eventUserCount = parseInt(card.find('.eventUserCount').val());
                const signupsOpen = card.find('.signupsOpen').val() !== 'false';
                
                // Support both old single link and new array of links
                var links = [];
                if (data.additionalStepLinks && Array.isArray(data.additionalStepLinks) && data.additionalStepLinks.length > 0) {
                    links = data.additionalStepLinks;
                } else if (data.additionalStepLink) {
                    // Backwards compatibility with single link
                    links = [data.additionalStepLink];
                }
                
                if (links.length > 0 && data.additionalStepDescription) {
                    // Show additional step modal
                    $("#additionalStepModalDescription").html(data.additionalStepDescription);
                    
                    // Clear previous links
                    $("#additionalStepLinksList").empty();
                    
                    // Create preview cards for each link
                    links.forEach(function(linkUrl, index) {
                        var linkId = 'additionalStepLink_' + index;
                        var titleId = 'additionalStepLinkTitle_' + index;
                        var linkHtml = '<div style="margin-bottom: 15px;">' +
                            '<a id="' + linkId + '" href="' + linkUrl + '" target="_blank" class="waves-effect additional-step-link" data-link-index="' + index + '" style="display: block; text-decoration: none;">' +
                            '<div class="card hoverable" style="border: 1px solid #e0e0e0; cursor: pointer;">' +
                            '<div class="card-content" style="padding: 20px;">' +
                            '<div style="display: flex; align-items: center;">' +
                            '<i class="material-icons" style="color: #2196F3; margin-right: 15px; font-size: 36px;">link</i>' +
                            '<div style="flex: 1; overflow: hidden;">' +
                            '<span id="' + titleId + '" class="blue-text text-darken-4" style="font-weight: 500; font-size: 16px; word-break: break-all;">Loading...</span>' +
                            '</div>' +
                            '<i class="material-icons" style="color: #757575; margin-left: 10px;">open_in_new</i>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</a>' +
                            '</div>';
                        
                        $("#additionalStepLinksList").append(linkHtml);
                        
                        // Fetch page title
                        fetchLinkTitle(linkUrl, titleId);
                    });
                    
                    // Determine what to show in the modal footer
                    var eventPassed = new Date(eventDate) < new Date();
                    var eventFull = !isNaN(eventMaxPeople) && eventUserCount >= eventMaxPeople;
                    
                    var modalFooter = $("#additionalStepModal").find('.modal-footer');
                    modalFooter.empty();
                    
                    if (alreadySignedUp) {
                        modalFooter.html('<p class="blue-text text-darken-4">You have already signed up for this social.</p>');
                    } else if (!signupsOpen) {
                        modalFooter.html('<p class="blue-text text-darken-4">Signups are closed.</p>');
                    } else if (eventPassed) {
                        modalFooter.html('<p class="blue-text text-darken-4">This social has already passed.</p>');
                    } else if (eventFull) {
                        modalFooter.html('<p class="blue-text text-darken-4">This social is full.</p>');
                    } else {
                        // Show signup button and track link clicks
                        var clickedLinks = new Set();
                        var signUpBtn = $('<a id="additionalStepSignUpBtn" href="javascript: acceptAdditionalStepModal()" class="waves-effect waves-blue btn-flat blue-text text-darken-4 disabled">Sign Up</a>');
                        modalFooter.html(signUpBtn);
                        
                        // Add click handlers for links
                        links.forEach(function(linkUrl, index) {
                            var linkId = 'additionalStepLink_' + index;
                            $("#" + linkId).off('click.additionalStep').on('click.additionalStep', function() {
                                clickedLinks.add(index);
                                // Check if all links have been clicked
                                if (clickedLinks.size === links.length) {
                                    $("#additionalStepSignUpBtn").removeClass("disabled");
                                }
                            });
                        });
                    }
                    
                    M.Modal.getInstance($("#additionalStepModal")).open();
                }
            }
        })
        .catch(function(error) {
            console.error("Error getting document:", error);
        });
});

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

        firebase.firestore().collection("socials").doc(eventSelectedID).get()
            .then(function(doc) {
                console.log('Fetched document:', doc.exists ? 'exists' : 'does not exist');
                
                if (doc.exists) {
                    const data = doc.data();
                    console.log('Event data:', data);
                    
                    // Show regular signup modal
                    M.Modal.getInstance($("#areyousure")).open();
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
    
    firebase.firestore().collection("socials").doc(eventSelectedID)
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

function acceptAdditionalStepModal() {
    // Reuse the same signup logic
    acceptareyousureModal();
}

function cancelAdditionalStepModal() {
    eventSelectedID = "";
    $("#additionalStepSignUpBtn").addClass("disabled");
    $("#additionalStepLinksList").empty();
    // Remove all click handlers
    $(".additional-step-link").off('click.additionalStep');
}

function fetchLinkTitle(url, titleElementId) {
    // Extract domain name as fallback
    function getDomainFromUrl(url) {
        try {
            var urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }
    
    // Try to fetch title using CORS proxy
    var corsProxy = 'https://api.allorigins.win/get?url=';
    var encodedUrl = encodeURIComponent(url);
    
    fetch(corsProxy + encodedUrl)
        .then(function(response) {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(function(data) {
            try {
                // Parse the HTML content
                var parser = new DOMParser();
                var doc = parser.parseFromString(data.contents, 'text/html');
                var title = doc.querySelector('title');
                
                if (title && title.textContent.trim()) {
                    $("#" + titleElementId).text(title.textContent.trim());
                } else {
                    // Try Open Graph title
                    var ogTitle = doc.querySelector('meta[property="og:title"]');
                    if (ogTitle && ogTitle.content) {
                        $("#" + titleElementId).text(ogTitle.content);
                    } else {
                        $("#" + titleElementId).text(getDomainFromUrl(url));
                    }
                }
            } catch (e) {
                $("#" + titleElementId).text(getDomainFromUrl(url));
            }
        })
        .catch(function(error) {
            // Fallback to domain name
            $("#" + titleElementId).text(getDomainFromUrl(url));
        });
}

