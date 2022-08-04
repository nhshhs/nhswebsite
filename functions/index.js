'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const firestore = admin.firestore();

//the values put into a user when the user is created
var defaultUserVal = {
	deductions: "",
	email: "",
	firstName: "",
	lastName: "",
	grade: 0,
	idNumber: 1234567,
	projectHours: 0,
	regularHours: 0,
	socialHours: 0
};

//creates a doc for the new user with the default values
exports.createUser = functions.auth.user().onCreate((user, context) => {
	let documentRef = firestore.collection('users').doc(user.uid);
	console.log("creating user: " + JSON.stringify(user));
	return documentRef.create(defaultUserVal);
});

//removes the doc made for the user
exports.deleteUser = functions.auth.user().onDelete((user, context) => {
	console.log("deleting user: " + JSON.stringify(user));
	return firestore.collection('users').doc(user.uid).delete();
});

//creates a log anytime a user's data is changed
exports.userDataChanged = functions.firestore.document('users/{userId}').onUpdate((change, context) => {
	const previousValue = change.before.data();
	if(previousValue.idNumber===defaultUserVal.idNumber) {//just made account, so no need to log
		return null;
	} else {
		const newValue = change.after.data();
		const changedBy = newValue.justUpdatedBy;
		delete newValue.justUpdatedBy;
		let difference = Object.keys(previousValue).filter(k => previousValue[k] !== newValue[k]);
		if (difference.length !== 0) { //makes sure something has changed
			if (typeof changedBy !== "undefined") {//something has changed
				delete previousValue.justUpdatedBy; //just in case of timing, if it hasn't been deleted yet
				console.log("User " + context.params.userId + " changed from " + JSON.stringify(previousValue) + " to " + JSON.stringify(newValue) + " at " + (new Date()) + " by " + changedBy);
				return firestore.collection('info').doc('logs').collection('userDataChanged').doc(context.params.userId).set({
					[new Date()]: {
						changedBy: changedBy,
						previousValue: previousValue,
						newValue: newValue
					}
				}, {
					merge: true
				}).then(() => {
					return firestore.collection('users').doc(context.params.userId).update({
						justUpdatedBy: admin.firestore.FieldValue.delete()
					});
				});
			} else if (typeof previousValue.justUpdatedBy !== "undefined") {
				//the justUpdatedBy field got removed by this function last time, so log nothing
				return null;
			} else { //something was changed prob by firebase console
				delete previousValue.justUpdatedBy;
				console.log("User " + context.params.userId + " changed from " + JSON.stringify(previousValue) + " to " + JSON.stringify(newValue) + " at " + (new Date()) + " by firebase console/function");
				return firestore.collection('info').doc('logs').collection('userDataChanged').doc(context.params.userId).set({
					[new Date()]: {
						changedBy: "firebase console/function",
						previousValue: previousValue,
						newValue: newValue,
					}
				}, {
					merge: true
				});
			}
		} else {
			return null;
		}
	}
});

//I dont know how useful the following two functions are, so I'm not using them right now

//saves the info of deleted regular events
// exports.regularEventDeleted = functions.firestore.document('events/{eventId}').onDelete((event, context) => {
// 	console.log("Regular event "+event.id+" was deleted. Event details: "+JSON.stringify(event.data()));
// 	return firestore.collection('info').doc('logs').collection('regularEventDeleted').doc(event.id).set(event.data());
// });

//saves the info of deleted project events
// exports.projectEventDeleted = functions.firestore.document('project/events/events/{eventId}').onDelete((event, context) => {
// 	console.log("Project event "+event.id+" was deleted. Event details: "+JSON.stringify(event.data()));
// 	return firestore.collection('info').doc('logs').collection('projectEventDeleted').doc(event.id).set(event.data());
// });
