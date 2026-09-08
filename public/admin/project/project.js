/*jshint multistr: true */
'use strict';

var descriptionQuill;
var additionalStepDescriptionQuill;

$(document).ready(function () {
	$('.datepicker').datepicker();
	$('.modal').modal();

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
			$("#additionalStepFields").removeClass("hide");
			// Add first link if container is empty
			if ($("#additionalStepLinksContainer").children().length === 0) {
				addAdditionalStepLink();
			}
		} else {
			$("#additionalStepFields").addClass("hide");
		}
	});

	firebase.firestore().collection("project").doc("blog").collection("pending").get().then(snap => {
		if(snap.size>0){
			$("#pending").text("new_releases");
		}
		toggleLoader();
	 });
});

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
	}
});

var additionalStepLinkCounter = 0;

function addAdditionalStepLink() {
	var linkId = 'additionalStepLink_' + additionalStepLinkCounter;
	var linkHtml = '<div class="row" style="margin-bottom: 10px;" id="linkRow_' + additionalStepLinkCounter + '">' +
		'<div class="input-field inline" style="width: calc(100% - 50px); margin-right: 10px;">' +
		'<input id="' + linkId + '" type="url" class="additional-step-link-input">' +
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


function createNewEvent() {
	toggleLoader();
	// Get HTML content from Quill editor
	var descriptionHTML = descriptionQuill.root.innerHTML;
	
	// Build event data object
	var eventData = {
		title: $("#title").val(),
		leader: $("#leader").val(),
		date: $("#date").val(),
		time: $("#time").val(),
		location: $("#location").val(),
		maxpeople: parseFloat($("#maxpeople").val()),
		description: descriptionHTML,
		signupsOpen: true,
		hoursGiven: {},
		users: []
	};

	// Add additional step data if enabled
	if ($("#additionalStepEnabled").is(':checked')) {
		eventData.additionalStepRequired = true;
		// Get HTML content from Quill editor
		eventData.additionalStepDescription = additionalStepDescriptionQuill.root.innerHTML;
		
		// Collect all links from inputs
		var links = [];
		$(".additional-step-link-input").each(function() {
			var linkValue = $(this).val().trim();
			if (linkValue) {
				links.push(linkValue);
			}
		});
		eventData.additionalStepLinks = links;
	} else {
		eventData.additionalStepRequired = false;
	}

	firebase.firestore().collection("project").doc("events").collection("events").add(eventData).then(function (docRef) {
		toggleLoader();
		// Clear the editor
		descriptionQuill.root.innerHTML = '';
		// Clear other form fields
		$("#title").val('');
		$("#leader").val('');
		$("#date").val('');
		$("#time").val('');
		$("#location").val('');
		$("#maxpeople").val('');
		$("#additionalStepEnabled").prop('checked', false);
		$("#additionalStepFields").addClass("hide");
		// Clear the additional step description editor
		additionalStepDescriptionQuill.root.innerHTML = '';
		$("#additionalStepLinksContainer").empty();
		additionalStepLinkCounter = 0;
		M.updateTextFields();
		M.toast({html: 'Event successfully created!'});
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
	});
}
