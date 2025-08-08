// public/admin/member/member.js
'use strict';

var uid, logs = [];

$(document).ready(function () {
	$(".modal").modal();
	$('.datepicker').datepicker();
	let params = new URLSearchParams(location.search);
	uid = params.get('uid');
	firebase.firestore().collection("users").doc(uid).get().then(function (doc) {
		if (doc.exists) {
			fillTextFields(doc.data());
		} else {
			// doc.data() will be undefined in this case
			console.log("No such document!");
			alert("Error: User does not exist.");
		}
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});

	firebase.firestore().collection('info').doc('logs').collection('userDataChanged').doc(uid).get().then(function (doc) {
		if (doc.exists) {
			var length = Object.keys(doc.data()).length;
			for (var key in doc.data()) {
				logs.push({
					time: new Date(key),
					changedBy: doc.data()[key].changedBy,
					newValue: doc.data()[key].newValue,
					previousValue: doc.data()[key].previousValue
				});
				if (logs.length === length) {
					logs.sort(function (a, b) { //sort by most recent
						return b.time - a.time;
					});
					doLogs();
				}
			}
		} else {
			$("#logs .collection").append('<li class="collection-header center"><p>No changes have been made to this user.</p></li>');
			
		}
	}).catch(function (error) {
		console.log("Error getting document:", error);
	});
});


var counter = -1;

function doLogs() {
	counter++;
	if (counter >= logs.length) {
		logs.forEach(function (log) {
			let difference = Object.keys(log.previousValue).filter(k => log.previousValue[k] !== log.newValue[k]);
			let changes = "";
			difference.forEach(function(key) {
				if(key === "deductions"){
					log.previousValue[key] = '"' + log.previousValue[key] + '"';
					log.newValue[key] = '"' + log.newValue[key] + '"';
				}
				if(key === "hours") {
					const seasons = ['fall', 'spring', 'summer', 'total'];
					seasons.forEach(season => {
						const prevHours = log.previousValue.hours?.[season] || 0;
						const newHours = log.newValue.hours?.[season] || 0;
						if(prevHours !== newHours) {
							changes += `<p>${season.charAt(0).toUpperCase() + season.slice(1)} Hours changed from ${prevHours} to ${newHours}</p>`;
						}
					});
					return; 
				}
				var printkey = key.replace(/([A-Z])/g, " $1");
				printkey = printkey.charAt(0).toUpperCase() + printkey.slice(1);
				changes += "<p>" + printkey + " changed from " + log.previousValue[key] + " to " + log.newValue[key] + "</p>";
			});
			$("#logs .collection").append('<li class="collection-item">'+changes+'<p>by: ' + log.changedBy + ' on ' + log.time.toLocaleDateString() + ' at ' + log.time.toLocaleTimeString() + '</p></li>');
		});
	} else {
		if (logs[counter].changedBy !== "firebase console/function") {
			var changedById = (logs[counter].changedBy.indexOf(' ')===-1)?logs[counter].changedBy:logs[counter].changedBy.substring(0, logs[counter].changedBy.indexOf(' '));
			firebase.firestore().collection("users").doc(changedById).get().then(function (doc) {
				if (doc.exists) {
					logs[counter].changedBy = logs[counter].changedBy.replace(changedById, doc.data().firstName + " " + doc.data().lastName);
				} else {
					// doc.data() will be undefined in this case
					console.log("No such document!");
				}
			}).then(function () {
				if(logs[counter].changedBy.includes("event")){
					var eventId = logs[counter].changedBy.substring(logs[counter].changedBy.indexOf('event: ')+7);
					if(logs[counter].changedBy.includes("project")){
						firebase.firestore().collection("project").doc("events").collection("events").doc(eventId).get().then(function (doc) {
							if (doc.exists) {
								logs[counter].changedBy = logs[counter].changedBy.replace(eventId, doc.data().title);
							} else {
								// doc.data() will be undefined in this case
								console.log("No such document!");
							}
						}).then(function() {
							doLogs();
						}).catch(function (error) {
							console.log("Error getting document:", error);
						});
					} else {
						firebase.firestore().collection("events").doc(eventId).get().then(function (doc) {
							if (doc.exists) {
								logs[counter].changedBy = logs[counter].changedBy.replace(eventId, doc.data().title);
							} else {
								// doc.data() will be undefined in this case
								console.log("No such document!");
							}
						}).then(function() {
							doLogs();
						}).catch(function (error) {
							console.log("Error getting document:", error);
						});
					}
				} else {
					doLogs();
				}
			}).catch(function (error) {
				console.log("Error getting document:", error);
			});
		} else {
			doLogs();
		}
	}

}

window.onresize = function () {
	M.textareaAutoResize($('#deductions'));
};

function fillTextFields(data) {
	$("#firstname").val(data.firstName);
	$("#lastname").val(data.lastName);
	$("#email").val(data.email);
	$("#" + data.grade).prop("checked", true);
	$("#idnumber").val(data.idNumber);
	$("#deductions").val(data.deductions);
	M.textareaAutoResize($('#deductions'));
	$("#regularhours").val(data.regularHours);
	$("#projecthours").val(data.projectHours);
	$("#socialhours").val(data.socialHours);
	M.updateTextFields();
	toggleLoader();
}

function update() {
	if ($("#firstname").val() === "" || $("#lastname").val() === "" || $("#email").val() === "" || $("#idnumber").val() === "" || $("#regularhours").val() === "" || $("#projecthours").val() === "" || $("#socialhours").val() === "") {
		alert("Please fill out everything first (leaving deductions blank is fine). You might also be getting this alert because one of the values you entered is in the incorrect format.");
	} else {
		toggleLoader();
		firebase.firestore().collection("users").doc(uid).update({
			firstName: $("#firstname").val(),
			lastName: $("#lastname").val(),
			email: $("#email").val(),
			grade: parseFloat($('input[name=grade]:checked').next().text()),
			idNumber: parseFloat($("#idnumber").val()),
			deductions: $("#deductions").val(),
			regularHours: parseFloat($("#regularhours").val()),
			projectHours: parseFloat($("#projecthours").val()),
			socialHours: parseFloat($("#socialhours").val()),
			justUpdatedBy: firebase.auth().currentUser.uid
		}).then(function () {
			toggleLoader();
			location.reload();
		}).catch(function (error) {
			toggleLoader();
			location.reload();
		});
	}
}

function goBack() {
	window.location.href = '/admin/members/index.html';
}

function toggleLogs() {
	if ($("#logs").hasClass("hide")) {
		$("#logs").removeClass("hide");
		$("#toggleLogsButton").text("Hide change logs");
		$('html,body').animate({
			scrollTop: $("#logs").offset().top
		}, 1000);
	} else {
		$('html,body').animate({
			scrollTop: $("#usereditpanel").offset().top + $("#usereditpanel").height() - $(window).height()
		}, 500, function () {
			$("#logs").addClass("hide");
		});
		$("#toggleLogsButton").text("View change logs");
	}
}
