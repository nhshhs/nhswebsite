/*jshint multistr: true */
'use strict';

var userList = [],//all the users
	showList = [];//only the users displayed to the users, based on the filters

function buildMemberHtml(user, displayName) {
	displayName = displayName || (user.firstName + " " + user.lastName);
	return '<div class="collection-item">' +
		'<a href="/admin/member/index.html?uid=' + user.id + '" class="blue-text text-darken-4">' +
		'<p>' +
		'<span class="row"><span class="badge">Regular: ' + user.regularHours + '</span></span>' +
		'<span class="row"><span class="badge">Project: ' + user.projectHours + '</span>' + displayName + '</span>' +
		'<span class="row"><span class="badge">Social: ' + user.socialHours + '</span></span>' +
		'</p>' +
		'</a>' +
		'<a href="javascript:void(0)" class="secondary-content red-text delete-member-btn" data-uid="' + user.id + '" data-name="' + (user.firstName + " " + user.lastName).replace(/"/g, "&quot;") + '">' +
		'<i class="material-icons">delete</i>' +
		'</a>' +
		'</div>';
}

//gets the 
$(document).ready(function () {
	$(".modal").modal();
	$(document).on("click", ".delete-member-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		var uid = $(this).data("uid");
		var name = $(this).data("name");
		if (e.shiftKey) {
			deleteMemberUid = uid;
			confirmDeleteMember();
		} else {
			promptDeleteMember(uid, name);
		}
	});
	firebase.firestore().collection('users').get()
		.then(function (querySnapshot) {
			if (querySnapshot.length === 0) {
				//this should never happen, there has to be an account to get to the members page
			} else {
				querySnapshot.docs.forEach(function (doc) {
					if (doc.data().deleted) {
						return;
					}

					userList.push({
						firstName: doc.data().firstName,
						lastName: doc.data().lastName,
						regularHours: doc.data().regularHours,
						projectHours: doc.data().projectHours,
						socialHours: doc.data().socialHours,
						grade: doc.data().grade,
						idNumber: doc.data().idNumber,
						id: doc.id,
						html: buildMemberHtml({
							firstName: doc.data().firstName,
							lastName: doc.data().lastName,
							regularHours: doc.data().regularHours,
							projectHours: doc.data().projectHours,
							socialHours: doc.data().socialHours,
							id: doc.id
						}),
					});
				});
			}
			userList.sort(function (a, b) {
				return a.firstName.localeCompare(b.firstName);
			});
			updateShownList();
			toggleLoader();
		});

	$('input[type=radio][name=grade]').change(function () {
		updateShownList();
	});

	$("#membersearch").on("input", function () {
		updateShownList();
	});
});

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
	}
});

function filterByGrade() {
	var grade = $('input[type=radio][name="grade"]:checked').val();
	showList = [];
	if (Number.isInteger(parseInt(grade))) {
		userList.forEach(function (user) {
			if (user.grade === parseInt(grade)) {
				showList.push(user);
			}
		});
	} else {
		showList = userList;
	}
}

function filterBySearch() {
	var search = $("#membersearch").val().toUpperCase();
	if (search === "") {
		showList.sort(function (a, b) {
			return a.firstName.localeCompare(b.firstName);
		});
		$("#searchhelper").text("");
	} else {
		var newList = [];
		showList.forEach(function (user) {
			var fullName = user.firstName + " " + user.lastName;
			if (fullName.toUpperCase().indexOf(search) > -1) {
				let startLocation = fullName.toUpperCase().indexOf(search);
				let newUser = Object.assign({}, user);;
				fullName = fullName.substring(0, startLocation) + "<b>" + fullName.substring(startLocation, startLocation + search.length) + "</b>" + fullName.substring(startLocation + search.length);
				newUser.html = buildMemberHtml(user, fullName);
				newList.push(newUser);
			}
		});
		newList.sort(function (a, b) {
			return (a.firstName + " " + a.lastName).toUpperCase().indexOf(search) - (b.firstName + " " + b.lastName).toUpperCase().indexOf(search);
		});
		showList = newList;
		$("#searchhelper").text(showList.length + (showList.length === 1 ? " match found." : " matches found."));
	}
}

function updateShownList() {
	filterByGrade();
	filterBySearch();
	$("#userList").empty();
	showList.forEach(function (user) {
		$("#userList").append(user.html);
	});
}

//get data in spreadsheet
function downloadXlsx() {
	toggleLoader();
	let all = [], soph = [], junior = [], senior = [];
	userList.forEach(function(user) {
		let temp = {
				"Name": user.firstName + ' ' + user.lastName,
				"Grade": user.grade,
				"ID Number": user.idNumber,
				"Regular Hours": user.regularHours,
				"Project Hours": user.projectHours,
				"Social Hours": user.socialHours,
			};
		all.push(temp);
		if(user.grade===10){
			soph.push(temp);
		} else if(user.grade===11) {
			junior.push(temp);
		} else if(user.grade===12) {
			senior.push(temp);
		}
	});
	let allws = XLSX.utils.json_to_sheet(all, {header:["Name","Grade","ID Number","Regular Hours","Project Hours","Social Hours"]});
	let sophws = XLSX.utils.json_to_sheet(soph, {header:["Name","Grade","ID Number","Regular Hours","Project Hours","Social Hours"]});
	let juniorws = XLSX.utils.json_to_sheet(junior, {header:["Name","Grade","ID Number","Regular Hours","Project Hours","Social Hours"]});
	let seniorws = XLSX.utils.json_to_sheet(senior, {header:["Name","Grade","ID Number","Regular Hours","Project Hours","Social Hours"]});
	let workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, allws, "All Grades");
	XLSX.utils.book_append_sheet(workbook, sophws, "Sophomores");
	XLSX.utils.book_append_sheet(workbook, juniorws, "Juniors");
	XLSX.utils.book_append_sheet(workbook, seniorws, "Seniors");
	XLSX.writeFile(workbook, 'NHS_MemberData('+ (new Date().toLocaleDateString().replace(/\//g, "-")) +').xlsx');
	toggleLoader();
}

function promoteAllGrades() {
	var toPromote = userList.filter(function (user) {
		var grade = parseInt(user.grade, 10);
		return grade === 10 || grade === 11;
	});
	if (toPromote.length === 0) {
		window.alert("No grade 10 or 11 members to promote.");
		return;
	}

	var currentUser = firebase.auth().currentUser;
	if (!currentUser) {
		window.alert("You must be signed in to promote grades.");
		return;
	}

	toggleLoader();
	var db = firebase.firestore();
	var commits = [];
	var batch = db.batch();
	var opsInBatch = 0;

	toPromote.forEach(function (user) {
		if (opsInBatch === 500) {
			commits.push(batch.commit());
			batch = db.batch();
			opsInBatch = 0;
		}
		var newGrade = parseInt(user.grade, 10) + 1;
		batch.update(db.collection("users").doc(user.id), {
			grade: newGrade,
			justUpdatedBy: currentUser.uid
		});
		user._newGrade = newGrade;
		opsInBatch++;
	});
	if (opsInBatch > 0) {
		commits.push(batch.commit());
	}

	Promise.all(commits).then(function () {
		toPromote.forEach(function (user) {
			user.grade = user._newGrade;
			delete user._newGrade;
			user.html = buildMemberHtml(user);
		});
		updateShownList();
		toggleLoader();
		window.alert("Promoted " + toPromote.length + " member" + (toPromote.length === 1 ? "" : "s") + ".");
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not promote grades. Error: " + (error.message || error));
	});
}

function resetAllHours() {
	if (userList.length === 0) {
		window.alert("No members to reset.");
		return;
	}

	var currentUser = firebase.auth().currentUser;
	if (!currentUser) {
		window.alert("You must be signed in to reset hours.");
		return;
	}

	toggleLoader();
	var db = firebase.firestore();
	var commits = [];
	var batch = db.batch();
	var opsInBatch = 0;

	userList.forEach(function (user) {
		if (opsInBatch === 500) {
			commits.push(batch.commit());
			batch = db.batch();
			opsInBatch = 0;
		}
		batch.update(db.collection("users").doc(user.id), {
			regularHours: 0,
			projectHours: 0,
			socialHours: 0,
			justUpdatedBy: currentUser.uid + " (reset all hours)"
		});
		opsInBatch++;
	});
	if (opsInBatch > 0) {
		commits.push(batch.commit());
	}

	Promise.all(commits).then(function () {
		return db.collection("info").doc("hoursRequirements").set({
			hoursLastResetAt: new Date().toISOString()
		}, { merge: true });
	}).then(function () {
		userList.forEach(function (user) {
			user.regularHours = 0;
			user.projectHours = 0;
			user.socialHours = 0;
			user.html = buildMemberHtml(user);
		});
		updateShownList();
		toggleLoader();
		window.alert("Reset hours to zero for " + userList.length + " member" + (userList.length === 1 ? "" : "s") + ".");
	}).catch(function (error) {
		toggleLoader();
		window.alert("Could not reset hours. Error: " + (error.message || error));
	});
}