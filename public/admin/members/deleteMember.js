'use strict';

var deleteMemberUid = null;

function promptDeleteMember(uid, name) {
	deleteMemberUid = uid;
	$("#deleteMemberName").text(name);
	M.Modal.getInstance($("#areyousuredeletemember")).open();
}

function confirmDeleteMember(redirectUrl) {
	if (!deleteMemberUid) {
		return;
	}

	var uidToDelete = deleteMemberUid;
	var currentUser = firebase.auth().currentUser;
	if (currentUser && currentUser.uid === uidToDelete) {
		window.alert("You cannot delete your own account.");
		deleteMemberUid = null;
		return;
	}

	toggleLoader();
	firebase.firestore().collection("users").doc(uidToDelete).delete().then(function () {
		return firebase.firestore().collection("info")
			.doc("logs")
			.collection("userDataChanged")
			.doc(uidToDelete)
			.delete()
			.catch(function () {
				// Logs may not exist; ignore
			});
	}).then(function () {
		deleteMemberUid = null;
		if (redirectUrl) {
			window.location.href = redirectUrl;
			return;
		}
		if (typeof userList !== "undefined") {
			userList = userList.filter(function (user) {
				return user.id !== uidToDelete;
			});
			updateShownList();
		}
		toggleLoader();
	}).catch(function (error) {
		toggleLoader();
		deleteMemberUid = null;
		window.alert("Could not delete member. Error: " + (error.message || error));
	});
}
