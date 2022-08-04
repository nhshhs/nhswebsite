'use strict';

var project, eventid;

//gets data and puts it in
$(document).ready(function () {
	$(".modal").modal();
	$('.datepicker').datepicker();
	let params = new URLSearchParams(location.search);
	project = params.get('type') === 'project';
	eventid = params.get('eventid');
	var emaillist = "";
	if (project) {
		firebase.firestore().collection("project").doc("events").collection("events").doc(eventid).get().then(function (doc) {
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
					var alreadySignedUp = false;
					for (var i = 0; i < data.users.length; i++) {
						firebase.firestore().collection("users").doc(data.users[i]).get().then(function (doc) {
							if (doc.exists) {
								if (doc.id in data.hoursGiven) {
									userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content black-text">Hours Given: ' + data.hoursGiven[doc.id] + '</div></div></li>';
								} else {
									userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content"><a href="#" class="left givehours"><i class="material-icons" style="color: blue;">add</i></a><a href="#" class="right removeuser"><i class="material-icons" style="color: red;">remove</i></a><p class="uid hide">' + doc.id + '</p></div></div></li>';
								}
								emaillist += doc.data().email + ", ";
								numberDone++;
								if (numberDone >= data.users.length) {
									document.getElementById("userlist").innerHTML = document.getElementById("userlist").innerHTML + userList;
									document.getElementById("emaillist").innerHTML = emaillist.substring(0, emaillist.length - 2);
									fillTextFields(data);
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
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	} else {
		firebase.firestore().collection("events").doc(eventid).get().then(function (doc) {
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
					var alreadySignedUp = false;
					for (var i = 0; i < data.users.length; i++) {
						firebase.firestore().collection("users").doc(data.users[i]).get().then(function (doc) {
							if (doc.exists) {
								if (doc.id in data.hoursGiven) {
									userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content black-text">Hours Given: ' + data.hoursGiven[doc.id] + '</div></div></li>';
								} else {
									userList += '<li class="collection-item"><div><span class="name">' + doc.data().firstName + " " + doc.data().lastName + '</span><div class="secondary-content"><a href="#" class="left givehours"><i class="material-icons" style="color: blue;">add</i></a><a href="#" class="right removeuser"><i class="material-icons" style="color: red;">remove</i></a><p class="uid hide">' + doc.id + '</p></div></div></li>';
								}
								emaillist += doc.data().email + ", ";
								numberDone++;
								if (numberDone >= data.users.length) {
									document.getElementById("userlist").innerHTML = document.getElementById("userlist").innerHTML + userList;
									document.getElementById("emaillist").innerHTML = emaillist.substring(0, emaillist.length - 2);
									fillTextFields(data);
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
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	}
});

window.onresize = function () {
	M.textareaAutoResize($('#title'));
	M.textareaAutoResize($('#leader'));
	M.textareaAutoResize($('#date'));
	M.textareaAutoResize($('#time'));
	M.textareaAutoResize($('#location'));
	M.textareaAutoResize($('#maxpeople'));
	M.textareaAutoResize($('#description'));
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
	$("#description").val(data.description);
	M.textareaAutoResize($('#description'));
	$('#signupsOpenswitch').prop('checked', data.signupsOpen);
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

function removeUser() {
	if (project) {
		firebase.firestore().collection("project").doc("events").collection("events").doc(eventid).update({
			users: firebase.firestore.FieldValue.arrayRemove(uid),
		}).then(function () {
			toggleLoader();
			location.reload();
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	} else {
		firebase.firestore().collection("events").doc(eventid).update({
			users: firebase.firestore.FieldValue.arrayRemove(uid),
		}).then(function () {
			toggleLoader();
			location.reload();
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	}
	uid = "";
}


function update() {
	toggleLoader();
	if (project) {
		firebase.firestore().collection("project").doc("events").collection("events").doc(eventid).update({
			title: $("#title").val(),
			leader: $("#leader").val(),
			date: $("#date").val(),
			time: $("#time").val(),
			location: $("#location").val(),
			maxpeople: parseFloat($("#maxpeople").val()),
			description: $("#description").val(),
			signupsOpen: $('#signupsOpenswitch').prop('checked')
		}).then(function () {
			toggleLoader();
			location.reload();
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	} else {
		firebase.firestore().collection("events").doc(eventid).update({
			title: $("#title").val(),
			leader: $("#leader").val(),
			date: $("#date").val(),
			time: $("#time").val(),
			location: $("#location").val(),
			maxpeople: parseFloat($("#maxpeople").val()),
			description: $("#description").val(),
			signupsOpen: $('#signupsOpenswitch').prop('checked')
		}).then(function () {
			toggleLoader();
			location.reload();
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	}

}

function deleteEvent() {
	toggleLoader();
	if (project) {
		firebase.firestore().collection("project").doc("events").collection("events").doc(eventid).delete().then(function () {
			window.location.href = '/admin/project/events.html';
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	} else {
		firebase.firestore().collection("events").doc(eventid).delete().then(function () {
			window.location.href = '/admin/events/index.html';
		}).catch(function (error) {
			toggleLoader();
			window.alert("Could not update. Error: " + error);
			location.reload();
		});
	}
}

function goBack() {
	if (project) {
		window.location.href = '/admin/project/events.html';
	} else {
		window.location.href = '/admin/events/index.html';
	}
}

function giveHours() {
	toggleLoader();
	var hours = parseFloat($("#hours").val());
	var hoursGivenUpdate = {};
	hoursGivenUpdate['hoursGiven.' + uid] = hours;
	if (project) {
		firebase.firestore().collection("users").doc(uid).update({
			projectHours: firebase.firestore.FieldValue.increment(hours),
			justUpdatedBy: firebase.auth().currentUser.uid + " for project event: " + eventid,
		}).then(function () {
			firebase.firestore().collection("project").doc("events").collection("events").doc(eventid).update(hoursGivenUpdate).then(function () {
				toggleLoader();
				location.reload();
			}).catch(function (error) {
				console.log("Could not update. Error: " + error);
			});
		}).catch(function (error) {
			console.log("Could not update. Error: " + error);
		});
	} else {
		firebase.firestore().collection("users").doc(uid).update({
			regularHours: firebase.firestore.FieldValue.increment(hours),
			justUpdatedBy: firebase.auth().currentUser.uid + " for regular event: " + eventid,
		}).then(function () {
			firebase.firestore().collection("events").doc(eventid).update(hoursGivenUpdate).then(function () {
				toggleLoader();
				location.reload();
			}).catch(function (error) {
				console.log("Could not update. Error: " + error);
			});
		}).catch(function (error) {
			console.log("Could not update. Error: " + error);
		});
	}
	uid = "";
}
