/*jshint multistr: true */
'use strict';

var userList = [],//all the users
	showList = [];//only the users displayed to the users, based on the filters


//gets the 
$(document).ready(function () {
	$(".modal").modal();
	firebase.firestore().collection('users').get()
		.then(function (querySnapshot) {
			if (querySnapshot.length === 0) {
				//this should never happen, there has to be an account to get to the members page
			} else {
				querySnapshot.docs.forEach(function (doc) {

					userList.push({
						firstName: doc.data().firstName,
						lastName: doc.data().lastName,
						regularHours: doc.data().regularHours,
						projectHours: doc.data().projectHours,
						socialHours: doc.data().socialHours,
						grade: doc.data().grade,
						idNumber: doc.data().idNumber,
						id: doc.id,
						html: '<a href="/admin/member/index.html?uid='+doc.id+'" class="collection-item blue-text text-darken-4">\
									<p>\
										<span class="row"><span class="badge" >Regular: ' + doc.data().regularHours + '</span></span>\
										<span class="row"><span class="badge" >Project: ' + doc.data().projectHours + '</span>' + doc.data().firstName + ' ' + doc.data().lastName + '</span>\
										<span class="row"><span class="badge" >Social: ' + doc.data().socialHours + '</span></span>\
									</p>\
								</a>',
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
				newUser.html = '<a href="/admin/member/index.html?uid='+user.id+'" class="collection-item blue-text text-darken-4">\
									<p>\
										<span class="row"><span class="badge" >Regular: ' + user.regularHours + '</span></span>\
										<span class="row"><span class="badge" >Project: ' + user.projectHours + '</span>' + fullName + '</span>\
										<span class="row"><span class="badge" >Social: ' + user.socialHours + '</span></span>\
									</p>\
								</a>';
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