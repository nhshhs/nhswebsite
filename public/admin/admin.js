'use strict';

var descriptionQuill;
var additionalStepDescriptionQuill;
var socialDescriptionQuill;
var socialAdditionalStepDescriptionQuill;

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

	socialDescriptionQuill = new Quill('#social-description-editor', {
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

	socialAdditionalStepDescriptionQuill = new Quill('#social-additionalStepDescription-editor', {
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

	$("#social-additionalStepEnabled").on('change', function() {
		if ($(this).is(':checked')) {
			$("#social-additionalStepFields").removeClass("hide");
			if ($("#social-additionalStepLinksContainer").children().length === 0) {
				addSocialAdditionalStepLink();
			}
		} else {
			$("#social-additionalStepFields").addClass("hide");
		}
	});
});

var additionalStepLinkCounter = 0;
var socialAdditionalStepLinkCounter = 0;

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

function addSocialAdditionalStepLink() {
	var linkId = 'socialAdditionalStepLink_' + socialAdditionalStepLinkCounter;
	var linkHtml = '<div class="row" style="margin-bottom: 10px;" id="socialLinkRow_' + socialAdditionalStepLinkCounter + '">' +
		'<div class="input-field inline" style="width: calc(100% - 50px); margin-right: 10px;">' +
		'<input id="' + linkId + '" type="url" class="social-additional-step-link-input">' +
		'<label for="' + linkId + '">Link URL</label>' +
		'</div>' +
		'<a href="javascript: removeSocialAdditionalStepLink(' + socialAdditionalStepLinkCounter + ')" class="btn-small red waves-effect waves-light" style="margin-top: 20px;">' +
		'<i class="material-icons">delete</i>' +
		'</a>' +
		'</div>';

	$("#social-additionalStepLinksContainer").append(linkHtml);
	socialAdditionalStepLinkCounter++;
	M.updateTextFields();
}

function removeSocialAdditionalStepLink(counter) {
	$("#socialLinkRow_" + counter).remove();
}

//figures out which buttons to show
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		firebase.firestore().collection("info").doc("admins").get().then(function (doc) {
			if (doc.exists) {
				if (doc.data().execs.includes(user.uid)) {
					$(".exec").removeClass("hide");
					$(".project").removeClass("hide");
					$(".event-admin").removeClass("hide");
					firebase.firestore().collection("info").doc("allowedUsers").get().then(function (doc) {
						if (doc.exists) {
							$("#allowedUsersList").text(doc.data().emailList.join(', '));
							if (doc.data().emailList.length === 0) {
								$("#emailListHeader").text("No emails are authorized to make an account.");
							} else {
								$("#emailListHeader").text("All the emails that are authorized to make an account:");
							}
						}
					}).catch(function (error) {
						toggleLoader();
						window.alert("Error: " + error);
					});
				} else {
					if (doc.data().project.includes(user.uid)) {
						$(".project").removeClass("hide");
					}
					if (doc.data().ads.includes(user.uid)) {
						$(".event-admin").removeClass("hide");
					}
				}
				firebase.firestore().collection("info").doc("hoursRequirements").get().then(function (doc) {
					if(doc.exists) {
						$("#regularhours").val(doc.data().regularHours);
						$("#projecthours").val(doc.data().projectHours);
						$("#socialhours").val(doc.data().socialHours);
						M.updateTextFields();
					}
				});
				toggleLoader();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}
});

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

	firebase.firestore().collection("events").add(eventData).then(function (docRef) {
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
		M.toast({
			html: 'Event successfully created!'
		});
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
	});
}

function createNewSocial() {
	toggleLoader();
	var descriptionHTML = socialDescriptionQuill.root.innerHTML;

	var socialData = {
		title: $("#social-title").val(),
		leader: $("#social-leader").val(),
		date: $("#social-date").val(),
		time: $("#social-time").val(),
		location: $("#social-location").val(),
		maxpeople: parseFloat($("#social-maxpeople").val()),
		description: descriptionHTML,
		signupsOpen: true,
		hoursGiven: {},
		users: []
	};

	if ($("#social-additionalStepEnabled").is(':checked')) {
		socialData.additionalStepRequired = true;
		socialData.additionalStepDescription = socialAdditionalStepDescriptionQuill.root.innerHTML;

		var links = [];
		$(".social-additional-step-link-input").each(function() {
			var linkValue = $(this).val().trim();
			if (linkValue) {
				links.push(linkValue);
			}
		});
		socialData.additionalStepLinks = links;
	} else {
		socialData.additionalStepRequired = false;
	}

	firebase.firestore().collection("socials").add(socialData).then(function () {
		toggleLoader();
		socialDescriptionQuill.root.innerHTML = '';
		$("#social-title").val('');
		$("#social-leader").val('');
		$("#social-date").val('');
		$("#social-time").val('');
		$("#social-location").val('');
		$("#social-maxpeople").val('');
		$("#social-additionalStepEnabled").prop('checked', false);
		$("#social-additionalStepFields").addClass("hide");
		socialAdditionalStepDescriptionQuill.root.innerHTML = '';
		$("#social-additionalStepLinksContainer").empty();
		socialAdditionalStepLinkCounter = 0;
		M.updateTextFields();
		M.toast({
			html: 'Social successfully created!'
		});
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
	});
}

function changeReqs(){
	toggleLoader();
	firebase.firestore().collection("info").doc("hoursRequirements").update( {
		regularHours: parseFloat($("#regularhours").val()),
		projectHours: parseFloat($("#projecthours").val()),
		socialHours: parseFloat($("#socialhours").val()),
	}).then(function () {
		M.toast({html: 'Hours requirements succesfully updated!'});
		toggleLoader();
	}).catch(function (error) {
		window.alert("Could not update. Error: " + error);
	});
}

function toggleAllowedUsers() {
	if ($("#allowedUsers").hasClass("hide")) {
		$("#allowedUsers").removeClass("hide");
		$("#toggleAllowedUsers").text("Hide allowed users menu");
		$('html,body').animate({
			scrollTop: $("#allowedUsers").offset().top,
		}, 1000);
	} else {
		$('html,body').animate({
			scrollTop: 0,
		}, 500, function() {
			$("#allowedUsers").addClass("hide");
		});
		$("#toggleAllowedUsers").text("Manage who can create an account");
	}
}

function allowUsers() {
	toggleLoader();
	var newlist = $("#allowemaillist").val().split(/[\n,]+/).map(function (e) {
		return e.trim();
	}).filter(function (e) {
		return e.length > 0;
	});

	firebase.firestore().collection("info").doc("allowedUsers").get().then(function (doc) {
		if (doc.exists) {
			var oldlist = doc.data().emailList;
			firebase.firestore().collection("info").doc("allowedUsers").update({
				emailList: arrayUnique(oldlist.concat(newlist)),
			}).then(function () {
				M.toast({
					html: 'User(s) successfully added!'
				});
				$("#allowemaillist").val("");
				M.textareaAutoResize($("#allowemaillist"));
				updateEmailList();
			}).catch(function (error) {
				toggleLoader();
				window.alert("Error: " + error);
			});
		} else {
			toggleLoader();
			window.alert("An error occurred.");
		}
	}).catch(function (error) {
		toggleLoader();
		window.alert("Error: " + error);
	});

	$("#emaillist").val("");
}

function removeUsers() {
	toggleLoader();
	var newlist = $("#removeemaillist").val().split(/[\n,]+/).map(function (e) {
		return e.trim();
	}).filter(function (e) {
		return e.length > 0;
	});
	firebase.firestore().collection("info").doc("allowedUsers").get().then(function (doc) {
		if (doc.exists) {
			var oldlist = doc.data().emailList;
			var newarray = oldlist.concat(newlist);
			newarray = newarray.filter(function (el) {
				return !newlist.includes(el);
			});
			firebase.firestore().collection("info").doc("allowedUsers").update({
				emailList: newarray,
			}).then(function () {
				M.toast({
					html: 'User(s) successfully removed!'
				});
				$("#removeemaillist").val("");
				M.textareaAutoResize($("#removeemaillist"));
				updateEmailList();
			}).catch(function (error) {
				toggleLoader();
				window.alert("Error: " + error);
			});
		} else {
			toggleLoader();
			window.alert("Error: The user's email might be allowed already.");
		}
	}).catch(function (error) {
		toggleLoader();
		window.alert("Error: " + error);
	});

	$("#emaillist").val("");
}

function clearAllowedUsers() {
	if (!window.confirm("Clear the entire allowed users list? No one will be able to create a new account until emails are added again.")) {
		return;
	}
	toggleLoader();
	firebase.firestore().collection("info").doc("allowedUsers").update({
		emailList: [],
	}).then(function () {
		M.toast({
			html: 'Allowed users list cleared!'
		});
		$("#removeemaillist").val("");
		M.textareaAutoResize($("#removeemaillist"));
		updateEmailList();
	}).catch(function (error) {
		toggleLoader();
		window.alert("Error: " + error);
	});
}

function updateEmailList() {
	firebase.firestore().collection("info").doc("allowedUsers").get().then(function (doc) {
		if (doc.exists) {
			$("#allowedUsersList").text(doc.data().emailList.join(', '));
			if (doc.data().emailList.length === 0) {
				$("#emailListHeader").text("No emails are authorized to make an account.");
			} else {
				$("#emailListHeader").text("All the emails that are authorized to make an account:");
			}
			toggleLoader();
		}
	}).catch(function (error) {
		toggleLoader();
		window.alert("Error: " + error);
	});
}

function arrayUnique(array) {
	var a = array.concat();
	for (var i = 0; i < a.length; ++i) {
		for (var j = i + 1; j < a.length; ++j) {
			if (a[i] === a[j])
				a.splice(j--, 1);
		}
	}

	return a;
}
