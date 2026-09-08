'use strict';

var eventType, eventid;
var descriptionQuill;
var additionalStepDescriptionQuill;
var additionalStepLinkCounter = 0;

function getEventDocRef() {
	if (eventType === 'project') {
		return firebase.firestore().collection("project").doc("events").collection("events").doc(eventid);
	}
	if (eventType === 'social') {
		return firebase.firestore().collection("socials").doc(eventid);
	}
	return firebase.firestore().collection("events").doc(eventid);
}

function getManageListUrl() {
	if (eventType === 'project') {
		return '/admin/project/events.html';
	}
	if (eventType === 'social') {
		return '/admin/socials/index.html';
	}
	return '/admin/events/index.html';
}

function getHoursFieldName() {
	if (eventType === 'project') {
		return 'projectHours';
	}
	if (eventType === 'social') {
		return 'socialHours';
	}
	return 'regularHours';
}

function getEventTypeLabel() {
	if (eventType === 'project') {
		return 'project';
	}
	if (eventType === 'social') {
		return 'social';
	}
	return 'regular';
}

//gets data and puts it in
$(document).ready(function () {
	$(".modal").modal();
	$('.datepicker').datepicker();

	// Initialize Quill editor for description
	descriptionQuill = new Quill('#description-editor', {
		theme: 'snow',
		modules: {
			toolbar: [
				[{ 'header': [1, 2, 3, false] }],
				['bold', 'italic', 'underline', 'strike'],
				[{ 'color': [] }, { 'background': [] }],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				['link'],
				['clean']
			]
		}
	});

	// Initialize Quill editor for additional step description
	additionalStepDescriptionQuill = new Quill('#additionalStepDescription-editor', {
		theme: 'snow',
		modules: {
			toolbar: [
				[{ 'header': [1, 2, 3, false] }],
				['bold', 'italic', 'underline', 'strike'],
				[{ 'color': [] }, { 'background': [] }],
				[{ 'list': 'ordered'}, { 'list': 'bullet' }],
				['link'],
				['clean']
			]
		}
	});

	// Handle additional step toggle
	$("#additionalStepEnabled").on('change', function() {
		if ($(this).is(':checked')) {
			$("#additionalStepFields").removeClass("hide").show();
			// Add first link if container is empty
			if ($("#additionalStepLinksContainer").children().length === 0) {
				addAdditionalStepLink();
			}
		} else {
			$("#additionalStepFields").addClass("hide").hide();
		}
	});
	let params = new URLSearchParams(location.search);
	eventType = params.get('type') || 'regular';
	eventid = params.get('eventid');
	var emaillist = "";
	getEventDocRef().get().then(function (doc) {
		if (doc.exists) {
			var data = doc.data();
			var userList = "";
			if (data.users.length === 0) {
				userList = '<p class="center">No members have signed up.</p>';
				document.getElementById("userlist").innerHTML = document.getElementById("userlist").innerHTML + userList;
				document.getElementById("emaillist").classList.add("center");
				document.getElementById("emaillist").innerHTML = "No members have signed up.";
				fillTextFields(data);
			} else {
				var numberDone = 0;
				for (var i = 0; i < data.users.length; i++) {
					firebase.firestore().collection("users").doc(data.users[i]).get().then(function (doc) {
						if (doc.exists) {
							if (doc.id in data.hoursGiven) {
								userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content" style="display: flex; align-items: center;"><p class="hours-text black-text" style="margin: 0; margin-right: 10px;">Hours Given: ' + data.hoursGiven[doc.id] + '</p><a href="#" class="edithours" data-hours="' + data.hoursGiven[doc.id] + '" style="margin-right: 10px;"><i class="material-icons" style="color: green;">edit</i></a><a href="#" class="removeuser"><i class="material-icons" style="color: red;">person_remove</i></a><p class="uid hide">' + doc.id + '</p></div></div></li>';
							} else {
								userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content" style="display: flex; justify-content: space-between; align-items: center;"><a href="#" class="givehours"><i class="material-icons" style="color: blue;">access_time</i></a><a href="#" class="removeuser"><i class="material-icons" style="color: red;">person_remove</i></a><p class="uid hide">' + doc.id + '</p></div></div></li>';
							}
							emaillist += doc.data().email + ", ";
							numberDone++;
							if (numberDone >= data.users.length) {
								document.getElementById("userlist").innerHTML = document.getElementById("userlist").innerHTML + userList;
								document.getElementById("emaillist").innerHTML = emaillist.substring(0, emaillist.length - 2);
								fillTextFields(data);
							}
						} else {
							console.log("No such document!");
						}
					}).catch(function (error) {
						console.log("Error getting document:", error);
					});
				}
			}
		} else {
			console.log("No such document!");
		}
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});
});

window.onresize = function () {
	M.textareaAutoResize($('#title'));
	M.textareaAutoResize($('#leader'));
	M.textareaAutoResize($('#date'));
	M.textareaAutoResize($('#time'));
	M.textareaAutoResize($('#location'));
	M.textareaAutoResize($('#maxpeople'));
	// Quill editor doesn't need textarea auto-resize
};

function fillTextFields(data) {
	if (data.hoursGiven > 0) {
		$("#givehoursbutton").addClass("disabled");
		$("#givehoursbutton").text("Users have already been given " + data.hoursGiven + " hours");
	}
	$("#eventname").text(data.title);
	$("#title").val(data.title);
	M.textareaAutoResize($('#title'));
	$("#leader").val(data.leader);
	M.textareaAutoResize($('#leader'));
	$("#date").val(data.date);
	M.textareaAutoResize($('#date'));
	$("#time").val(data.time);
	M.textareaAutoResize($('#time'));
	$("#location").val(data.location);
	M.textareaAutoResize($('#location'));
	$("#maxpeople").val(data.maxpeople);
	M.textareaAutoResize($('#maxpeople'));
	// Set Quill content (handles both HTML and plain text for backward compatibility)
	if (data.description) {
		descriptionQuill.root.innerHTML = data.description;
	} else {
		descriptionQuill.root.innerHTML = '';
	}
	$('#signupsOpenswitch').prop('checked', data.signupsOpen);
	
	// Load additional step data
	// Check if additional step is required (handle both boolean true and truthy values, or if data exists)
	var hasAdditionalStep = data.additionalStepRequired === true || 
	                       data.additionalStepRequired === "true" ||
	                       (data.additionalStepDescription || (data.additionalStepLinks && data.additionalStepLinks.length > 0) || data.additionalStepLink);
	
	if (hasAdditionalStep) {
		// Set checkbox state first - use attr and prop to ensure it's set
		$("#additionalStepEnabled").attr('checked', 'checked').prop('checked', true);
		// Show fields - do this immediately
		$("#additionalStepFields").removeClass("hide").show();
		
		// Load additional step description
		if (data.additionalStepDescription) {
			additionalStepDescriptionQuill.root.innerHTML = data.additionalStepDescription;
		} else {
			additionalStepDescriptionQuill.root.innerHTML = '';
		}
		
		// Load additional step links
		$("#additionalStepLinksContainer").empty();
		additionalStepLinkCounter = 0;
		var links = [];
		if (data.additionalStepLinks && Array.isArray(data.additionalStepLinks) && data.additionalStepLinks.length > 0) {
			links = data.additionalStepLinks;
		} else if (data.additionalStepLink) {
			// Backwards compatibility with single link
			links = [data.additionalStepLink];
		}
		
		links.forEach(function(linkUrl) {
			addAdditionalStepLink(linkUrl);
		});
		
		// Add first link if no links exist
		if (links.length === 0) {
			addAdditionalStepLink();
		}
	} else {
		$("#additionalStepEnabled").removeAttr('checked').prop('checked', false);
		$("#additionalStepFields").addClass("hide").hide();
		additionalStepDescriptionQuill.root.innerHTML = '';
		$("#additionalStepLinksContainer").empty();
		additionalStepLinkCounter = 0;
	}
	
	// Update Materialize text fields after content is loaded
	M.updateTextFields();
	
	M.updateTextFields();
	toggleLoader();
}

var uid;

$(document).on('click', '.removeuser', function () {
	$("#removeUserName").text($(this).closest("li").find(".name").text());
	M.Modal.getInstance($("#areyousureremoveuser")).open();
	uid = $(this).closest("div").find(".uid").text();
});

$(document).on('click', '.givehours', function () {
	$("#giveHoursName").text($(this).closest("li").find(".name").text());
	M.Modal.getInstance($("#givehours")).open();
	uid = $(this).closest("div").find(".uid").text();
});

$(document).on('click', '.edithours', function () {
	$("#giveHoursName").text($(this).closest("li").find(".name").text());
	var currentHours = $(this).attr("data-hours");
	$("#hours").val(currentHours);
	M.Modal.getInstance($("#givehours")).open();
	uid = $(this).closest("div").find(".uid").text();
});

function removeUser() {
	getEventDocRef().update({
		users: firebase.firestore.FieldValue.arrayRemove(uid),
	}).then(function () {
		toggleLoader();
		location.reload();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
		location.reload();
	});
	uid = "";
}


function update() {
	toggleLoader();
	// Get HTML content from Quill editor
	var descriptionHTML = descriptionQuill.root.innerHTML;
	
	// Build update data object
	var updateData = {
		title: $("#title").val(),
		leader: $("#leader").val(),
		date: $("#date").val(),
		time: $("#time").val(),
		location: $("#location").val(),
		maxpeople: parseFloat($("#maxpeople").val()),
		description: descriptionHTML,
		signupsOpen: $('#signupsOpenswitch').prop('checked')
	};
	
	// Add additional step data if enabled
	if ($("#additionalStepEnabled").is(':checked')) {
		updateData.additionalStepRequired = true;
		// Get HTML content from Quill editor
		updateData.additionalStepDescription = additionalStepDescriptionQuill.root.innerHTML;
		
		// Collect all links from inputs
		var links = [];
		$(".additional-step-link-input").each(function() {
			var linkValue = $(this).val().trim();
			if (linkValue) {
				links.push(linkValue);
			}
		});
		updateData.additionalStepLinks = links;
	} else {
		updateData.additionalStepRequired = false;
		// Remove additional step fields if disabled
		updateData.additionalStepDescription = firebase.firestore.FieldValue.delete();
		updateData.additionalStepLinks = firebase.firestore.FieldValue.delete();
		// Also remove old single link field if it exists
		updateData.additionalStepLink = firebase.firestore.FieldValue.delete();
	}
	
	getEventDocRef().update(updateData).then(function () {
		toggleLoader();
		location.reload();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
		location.reload();
	});

}

function deleteEvent() {
	toggleLoader();
	getEventDocRef().delete().then(function () {
		window.location.href = getManageListUrl();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
		location.reload();
	});
}

function goBack() {
	window.location.href = getManageListUrl();
}

function giveHours() {
	toggleLoader();
	var hours = parseFloat($("#hours").val());
	var hoursGivenUpdate = {};
	hoursGivenUpdate['hoursGiven.' + uid] = hours;
	
	// Get current event data to check existing hours
	var eventRef = getEventDocRef();
	
	eventRef.get().then(function(doc) {
		var data = doc.data();
		var currentHours = data.hoursGiven && data.hoursGiven[uid] ? data.hoursGiven[uid] : 0;
		var hoursDifference = hours - currentHours;
		
		var userUpdate = {
			justUpdatedBy: firebase.auth().currentUser.uid + " for " + getEventTypeLabel() + " event: " + eventid,
		};
		userUpdate[getHoursFieldName()] = firebase.firestore.FieldValue.increment(hoursDifference);
		
		firebase.firestore().collection("users").doc(uid).update(userUpdate).then(function () {
			eventRef.update(hoursGivenUpdate).then(function () {
				toggleLoader();
				location.reload();
			}).catch(function (error) {
				console.log("Could not update event. Error: " + error);
				toggleLoader();
			});
		}).catch(function (error) {
			console.log("Could not update user. Error: " + error);
			toggleLoader();
		});
	}).catch(function (error) {
		console.log("Could not get event data. Error: " + error);
		toggleLoader();
	});
}

function addAdditionalStepLink(linkUrl) {
	var linkId = 'additionalStepLink_' + additionalStepLinkCounter;
	var linkValue = (linkUrl || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	var linkHtml = '<div class="row" style="margin-bottom: 10px;" id="linkRow_' + additionalStepLinkCounter + '">' +
		'<div class="input-field inline" style="width: calc(100% - 50px); margin-right: 10px;">' +
		'<input id="' + linkId + '" type="url" class="additional-step-link-input" value="' + linkValue + '">' +
		'<label for="' + linkId + '">Link URL</label>' +
		'</div>' +
		'<a href="javascript: removeAdditionalStepLink(' + additionalStepLinkCounter + ')" class="btn-small red waves-effect waves-light" style="margin-top: 20px;">' +
		'<i class="material-icons">delete</i>' +
		'</a>' +
		'</div>';
	
	$("#additionalStepLinksContainer").append(linkHtml);
	additionalStepLinkCounter++;
	M.updateTextFields();
}

function removeAdditionalStepLink(counter) {
	$("#linkRow_" + counter).remove();
}
