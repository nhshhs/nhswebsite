'use strict';

$(document).ready(function () {
	$('.datepicker').datepicker();
	$('.modal').modal();
});

//figures out which buttons to show
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		firebase.firestore().collection("info").doc("admins").get().then(function (doc) {
			if (doc.exists) {
				if (doc.data().execs.includes(user.uid)) {
					$(".exec").removeClass("hide");
					$(".project").removeClass("hide");
					$(".ad").removeClass("hide");
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
						$(".ad").removeClass("hide");
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
	firebase.firestore().collection("events").add({
		title: $("#title").val(),
		leader: $("#leader").val(),
		date: $("#date").val(),
		time: $("#time").val(),
		location: $("#location").val(),
		maxpeople: parseFloat($("#maxpeople").val()),
		description: $("#description").val(),
		signupsOpen: true,
		hoursGiven: {},
		users: []
	}).then(function (docRef) {
		toggleLoader();
		M.toast({
			html: 'Event successfully created!'
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
	var newlist = $("#allowemaillist").val().replace(/\s/g, '').split(',');

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
	var newlist = $("#removeemaillist").val().replace(/\s/g, '').split(',');
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
