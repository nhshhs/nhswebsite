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
                event.id,
                event.data.additionalStepRequired,
                event.data.additionalStepDescription,
                event.data.additionalStepLinks || (event.data.additionalStepLink ? [event.data.additionalStepLink] : [])
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
function addEvent(title, leader, date, time, maxpeople, location, description, users, signupsOpen, id, additionalStepRequired, additionalStepDescription, additionalStepLinks) {
    console.log("Adding event:", {title, leader, date, users});
    
    if (!users || users.length == 0) {
        addHTMLEvent(title, leader, date, time, 0, maxpeople, location, description, 
            "<p>No members have signed up.</p>", false, signupsOpen, id,
            additionalStepRequired, additionalStepDescription, additionalStepLinks, []);
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
                location, description, userList, alreadySignedUp, signupsOpen, id,
                additionalStepRequired, additionalStepDescription, additionalStepLinks, users
            );
            doEventsHelper();
        })
        .catch(error => {
            console.error("Error getting user data:", error);
            addHTMLEvent(
                title, leader, date, time, users.length, maxpeople,
                location, description, "<p>Error loading member list</p>", 
                false, signupsOpen, id,
                additionalStepRequired, additionalStepDescription, additionalStepLinks, users
            );
            doEventsHelper();
        });
}

function addHTMLEvent(title, leader, date, time, userCount, maxpeople, location, description, userList, alreadySignedUp, signupsOpen, id, additionalStepRequired, additionalStepDescription, additionalStepLinks, users) {
	if (isNaN(maxpeople)) {
		maxpeople = "unlimited";
	}
    // Build a panel that matches the site-wide event panels (collapsible body + footer show-more)
    var div = document.createElement('div');
    div.className = 'panel panel--event card hoverable';
    var footerControl = '<a href="#" class="show-more">Show More</a>';
    
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
            buttonHtml = '<p class="blue-text text-darken-4">You have already signed up for this event.</p>';
        } else if (!signupsOpen) {
            buttonHtml = '<p class="blue-text text-darken-4">Signups are closed.</p>';
        } else if (eventPassed) {
            buttonHtml = '<p class="blue-text text-darken-4">This event has already passed.</p>';
        } else if (eventFull) {
            buttonHtml = '<p class="blue-text text-darken-4">This event is full.</p>';
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
                                <h6>Members Attending:</h6>
                                ${userList}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container event-footer-container">
                    <div class="row event-footer-row">
                        <div class="col s12 event-footer-col">
                            ${footerControl}
                            ${buttonHtml}
                        </div>
                    </div>
                </div>
            </div>
            <p class="hide eventid">${id}</p>`;
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
                                <h6>Members Attending:</h6>
                                ${userList}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container event-footer-container">
                    <div class="row event-footer-row">
                        <div class="col s12 event-footer-col">
                            ${footerControl}
                            ${buttonHtml}
                        </div>
                    </div>
                </div>
            </div>
            <p class="hide eventid">${id}</p>
            <input type="hidden" class="hasAdditionalStep" value="${hasAdditionalStep}">
            <input type="hidden" class="alreadySignedUp" value="${alreadySignedUp}">
            <input type="hidden" class="eventDate" value="${date}">
            <input type="hidden" class="eventMaxPeople" value="${maxpeople}">
            <input type="hidden" class="eventUserCount" value="${userCount}">
            <input type="hidden" class="signupsOpen" value="${signupsOpen}">`;
    }

    document.getElementById('projectEventCol').appendChild(div);
}

var eventSelectedID = "";

// Handle View button for additional step events
$(document).on('click', '.view-additional-step', function(e) {
	e.preventDefault();
	const card = $(this).closest('.card');
	eventSelectedID = card.find('.eventid').text() || card.find('.eventid').val();
	
	if (!eventSelectedID) {
		console.error('No event ID found in card');
		return;
	}

	firebase.firestore().collection("project").doc("events").collection("events").doc(eventSelectedID).get()
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
						modalFooter.html('<p class="blue-text text-darken-4">You have already signed up for this event.</p>');
					} else if (!signupsOpen) {
						modalFooter.html('<p class="blue-text text-darken-4">Signups are closed.</p>');
					} else if (eventPassed) {
						modalFooter.html('<p class="blue-text text-darken-4">This event has already passed.</p>');
					} else if (eventFull) {
						modalFooter.html('<p class="blue-text text-darken-4">This event is full.</p>');
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

$(document).on('click', '.signup', function () {
	if (firebase.auth().currentUser === null) {
		M.Modal.getInstance($("#login")).open();
	} else {
		eventSelectedID = $(this).closest(".card").find(".eventid").text();
		// Show regular signup modal
		var areyousuremodal = M.Modal.getInstance($("#areyousure"));
		areyousuremodal.open();
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