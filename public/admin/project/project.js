/*jshint multistr: true */
'use strict';

$(document).ready(function () {
	$('.datepicker').datepicker();
	$('.modal').modal();

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


function createNewEvent() {
	toggleLoader();
	firebase.firestore().collection("project").doc("events").collection("events").add({
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
		M.toast({html: 'Event successfully created!'});
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not update. Error: " + error);
	});
}
