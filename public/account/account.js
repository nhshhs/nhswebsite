//public/account/account.js
'use strict';

firebase.auth().onAuthStateChanged(function (user) {
    firebase.firestore().collection("info").doc("hoursRequirements").get().then(function (doc) {
        if (doc.exists) {
            var reg = doc.data().regularHours + (doc.data().regularHours===1?" regular hour":" regular hours");
            var proj = doc.data().projectHours + (doc.data().projectHours===1?" project hour":" project hours");
            var soc = doc.data().socialHours + (doc.data().socialHours===1?" social hour":" social hours");
            $("#hoursReqs").text("Hours requirements: " + reg + ", " + proj + ", and " + soc);
        } else {
            console.log("Hours requirements document not found");
        }
    }).catch(function (error) {
        console.error("Error getting hours requirements:", error);
    });

    if (user) {
        console.log("Fetching user document for UID:", user.uid);
        
        firebase.firestore().collection("users").doc(user.uid).get().then(function (doc) {
            if (doc.exists) {
                const userData = doc.data();
                console.log("Full user data:", userData);
                console.log("Hours object:", userData.hours);

                // Basic user info
                try {
                    $("#name").text((userData.firstName || '') + " " + (userData.lastName || ''));
                    $("#grade").text(userData.grade || '');
                    $("#idNumber").text(userData.idNumber || '');
                } catch (e) {
                    console.error("Error setting basic user info:", e);
                }

                // Hours info
                try {
                    $("#regularhours").text("Regular Hours: " + (userData.regularHours || 0));
                    $("#projecthours").text("Project Hours: " + (userData.projectHours || 0));
                    $("#socialhours").text("Social Hours: " + (userData.socialHours || 0));
                } catch (e) {
                    console.error("Error setting hours info:", e);
                }

                // Seasonal hours
                try {
                    if (userData.hours) {
                        $("#fallHours").text(userData.hours.fall || 0);
                        $("#springHours").text(userData.hours.spring || 0);
                        $("#summerHours").text(userData.hours.summer || 0);
                        $("#totalHours").text(userData.hours.total || 0);
                    } else {
                        console.warn("Hours object is missing from user data");
                        $("#fallHours, #springHours, #summerHours, #totalHours").text("0");
                    }
                } catch (e) {
                    console.error("Error setting seasonal hours:", e);
                }

                toggleLoader();
            } else {
                console.error("User document does not exist for UID:", user.uid);
            }
        }).catch(function (error) {
            console.error("Error fetching user document:", error);
        });
    } else {
        console.log("No user logged in, redirecting to index");
        window.location.href = "/index.html";
    }
});