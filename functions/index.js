/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable no-trailing-spaces */
/* eslint-disable linebreak-style */
/* eslint-disable arrow-parens */
/* eslint-disable max-len */
/* eslint-disable comma-dangle */
/* eslint-disable linebreak-style */
// nhswebsite/functions/index.js
"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const firestore = admin.firestore();

// The values put into a user when the user is created
const defaultUserVal = {
  deductions: "",
  email: "",
  firstName: "",
  lastName: "",
  grade: 0,
  idNumber: 1234567,
  projectHours: 0,
  regularHours: 0,
  socialHours: 0,
};

// Creates a doc for the new user with the default values
// exports.createUser = functions.auth.user().onCreate(async (user) => {
//   const documentRef = firestore.collection("users").doc(user.uid);
//   console.log("Creating user:", JSON.stringify(user));
//   const userData = {
//     ...defaultUserVal,
//     email: user.email || ""
//   };
//   return await documentRef.set(userData);
// });
exports.createUser = functions.auth.user().onCreate(async (user) => {
  console.log("User created in Authentication:", JSON.stringify(user));
  return null;
});


// Removes the doc made for the user
exports.deleteUser = functions.auth.user().onDelete(async (user) => {
  console.log("Deleting user:", JSON.stringify(user));
  return await firestore.collection("users").doc(user.uid).delete();
});

// Creates a log anytime a user's data is changed
exports.userDataChanged = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
      const previousValue = change.before.data();
      if (previousValue.idNumber === defaultUserVal.idNumber) {
        return null;
      }

      const newValue = change.after.data();
      const changedBy = newValue.justUpdatedBy;
      delete newValue.justUpdatedBy;

      const difference = Object.keys(previousValue)
          .filter(k => previousValue[k] !== newValue[k]);

      if (difference.length === 0) {
        return null;
      }

      if (typeof changedBy !== "undefined") {
        delete previousValue.justUpdatedBy;
        console.log(`User ${context.params.userId} changed from ${JSON.stringify(previousValue)} to ${JSON.stringify(newValue)} at ${new Date()} by ${changedBy}`);

        await firestore.collection("info")
            .doc("logs")
            .collection("userDataChanged")
            .doc(context.params.userId)
            .set({
              [new Date().toISOString()]: {
                changedBy,
                previousValue,
                newValue,
              }
            }, { merge: true });

        return await firestore.collection("users")
            .doc(context.params.userId)
            .update({
              justUpdatedBy: admin.firestore.FieldValue.delete()
            });
      } 
      
      if (typeof previousValue.justUpdatedBy !== "undefined") {
        return null;
      }

      delete previousValue.justUpdatedBy;
      console.log(`User ${context.params.userId} changed from ${JSON.stringify(previousValue)} to ${JSON.stringify(newValue)} at ${new Date()} by firebase console/function`);

      return await firestore.collection("info")
          .doc("logs")
          .collection("userDataChanged")
          .doc(context.params.userId)
          .set({
            [new Date().toISOString()]: {
              changedBy: "firebase console/function",
              previousValue,
              newValue,
            }
          }, { merge: true });
    });