//public/account/account.js
'use strict';

firebase.auth().onAuthStateChanged(function (user) {
    firebase.firestore().collection("info").doc("hoursRequirements").get().then(function (doc) {
        if (doc.exists) {
            var reg = doc.data().regularHours + (doc.data().regularHours===1?" hour":" hours");
            var proj = doc.data().projectHours + (doc.data().projectHours===1?" hour":" hours");
            var soc = doc.data().socialHours + (doc.data().socialHours===1?" hour":" hours");
            $("#hoursReqs").text("Hours requirements: " + reg + ", " + proj + ", and " + soc);
            $("#regularReq").text("Required: " + reg);
            $("#projectReq").text("Required: " + proj);
            $("#socialReq").text("Required: " + soc);
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

                // Basic user info - populate editable name inputs and other fields
                try {
                    // First & last name inputs
                    $("#firstName").val(userData.firstName || '');
                    $("#lastName").val(userData.lastName || '');

                    // Populate grade radio buttons
                    if (userData.grade) {
                        $("input[name=gradeAccount][value='" + userData.grade + "']").prop('checked', true);
                    } else {
                        $("input[name=gradeAccount]").prop('checked', false);
                    }
                    // ID number input
                    $("#idNumber").val(userData.idNumber || '');

                    // update labels (Materialize style) AFTER populating all inputs
                    if (M && M.updateTextFields) {
                        M.updateTextFields();
                    }
                } catch (e) {
                    console.error("Error setting basic user info:", e);
                }

                // Hours info
                try {
                    $("#regularhours").text((userData.regularHours || 0));
                    $("#projecthours").text((userData.projectHours || 0));
                    $("#socialhours").text((userData.socialHours || 0));
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

// Save name function and event handlers
function saveNameToFirestore(uid) {
    var first = $("#firstName").val().trim();
    var last = $("#lastName").val().trim();
    var grade = $("input[name=gradeAccount]:checked").val();
    var idNumberVal = $("#idNumber").val();

    if (!first && !last) {
        M.toast({html: 'Please enter a first or last name to save.'});
        return;
    }

    var updateObj = {};
    if (first) updateObj.firstName = first;
    if (last) updateObj.lastName = last;
    if (grade !== undefined) updateObj.grade = grade;
    if (idNumberVal !== undefined && idNumberVal !== '') updateObj.idNumber = Number(idNumberVal);

    // show a saving toast
    M.toast({html: 'Saving name...', displayLength: 1000});

    firebase.firestore().collection('users').doc(uid).update(updateObj).then(function () {
        M.toast({html: 'Name saved.'});
    }).catch(function (err) {
        console.error('Error saving name:', err);
        M.toast({html: 'Failed to save name.'});
    });
}

function getHourValue(value) {
    return (value === undefined || value === null || value === "") ? 0 : value;
}

function formatHourDelta(previousValue, newValue) {
    var prev = Number(getHourValue(previousValue));
    var next = Number(getHourValue(newValue));
    var delta = next - prev;
    var deltaText = (delta > 0 ? "+" : "") + delta;
    return {
        prev: prev,
        next: next,
        delta: delta,
        deltaText: deltaText
    };
}

function lookupUserName(uid) {
    return firebase.firestore().collection("users").doc(uid).get().then(function (doc) {
        if (doc.exists) {
            return ((doc.data().firstName || "") + " " + (doc.data().lastName || "")).trim() || uid;
        }
        return uid;
    }).catch(function () {
        return uid;
    });
}

function lookupEventTitle(eventType, eventId) {
    var ref;
    if (eventType === "project") {
        ref = firebase.firestore().collection("project").doc("events").collection("events").doc(eventId);
    } else if (eventType === "social") {
        ref = firebase.firestore().collection("socials").doc(eventId);
    } else {
        ref = firebase.firestore().collection("events").doc(eventId);
    }

    return ref.get().then(function (doc) {
        if (doc.exists && doc.data().title) {
            return doc.data().title;
        }
        return eventId;
    }).catch(function () {
        return eventId;
    });
}

function resolveChangedByLabel(changedBy) {
    if (!changedBy || changedBy === "firebase console/function") {
        return Promise.resolve("System / admin");
    }

    var uid = changedBy.indexOf(" ") === -1 ? changedBy : changedBy.substring(0, changedBy.indexOf(" "));
    var remainder = changedBy.indexOf(" ") === -1 ? "" : changedBy.substring(changedBy.indexOf(" "));

    return lookupUserName(uid).then(function (name) {
        var label = name + remainder;
        var eventMarker = "event: ";
        var eventIndex = label.indexOf(eventMarker);
        if (eventIndex === -1) {
            return label;
        }

        var eventId = label.substring(eventIndex + eventMarker.length);
        var eventType = "regular";
        if (label.indexOf("project event:") !== -1) {
            eventType = "project";
        } else if (label.indexOf("social event:") !== -1) {
            eventType = "social";
        }

        return lookupEventTitle(eventType, eventId).then(function (title) {
            return label.replace(eventId, title);
        });
    });
}

function renderHourHistory(entries, hourLabel, resetAt) {
    var $list = $("#hourHistoryList");
    $list.empty();
    $("#hourLogsSection").removeClass("hide");

    $("#hourHistoryTitle").text(hourLabel + " Logs");
    if (resetAt) {
        $("#hourHistorySubtitle").text("Showing updates since hours were last reset on " + resetAt.toLocaleString() + ".");
    } else {
        $("#hourHistorySubtitle").text("Showing all recorded updates for this hour type.");
    }

    if (!entries.length) {
        $list.append('<li class="collection-item center-align">No updates found for this hour type since the last reset.</li>');
        return;
    }

    entries.forEach(function (entry) {
        var change = formatHourDelta(entry.previousValue, entry.newValue);
        $list.append(
            '<li class="collection-item">' +
                '<p><b>' + change.deltaText + '</b> hours (' + change.prev + ' → ' + change.next + ')</p>' +
                '<p>' + entry.changedByLabel + '</p>' +
                '<p class="grey-text">' + entry.time.toLocaleDateString() + ' at ' + entry.time.toLocaleTimeString() + '</p>' +
            '</li>'
        );
    });
}

function openHourHistory(hourField, hourLabel) {
    var user = firebase.auth().currentUser;
    if (!user) {
        return;
    }

    var $list = $("#hourHistoryList");
    $("#hourLogsSection").removeClass("hide");
    $("#hourHistoryTitle").text(hourLabel + " Logs");
    $("#hourHistorySubtitle").text("Loading updates...");
    $list.empty().append('<li class="collection-item center-align">Loading...</li>');

    $('html, body').animate({
        scrollTop: $("#hourLogsSection").offset().top - 20
    }, 400);

    var resetAt = null;

    firebase.firestore().collection("info").doc("hoursRequirements").get().then(function (reqDoc) {
        if (reqDoc.exists && reqDoc.data().hoursLastResetAt) {
            resetAt = new Date(reqDoc.data().hoursLastResetAt);
            if (isNaN(resetAt.getTime())) {
                resetAt = null;
            }
        }

        return firebase.firestore().collection("info").doc("logs").collection("userDataChanged").doc(user.uid).get();
    }).then(function (logDoc) {
        var matching = [];
        if (logDoc && logDoc.exists) {
            var data = logDoc.data();
            Object.keys(data).forEach(function (key) {
                var entry = data[key];
                var time = new Date(key);
                if (isNaN(time.getTime()) || !entry || !entry.previousValue || !entry.newValue) {
                    return;
                }
                if (resetAt && time.getTime() <= resetAt.getTime()) {
                    return;
                }

                var changedBy = entry.changedBy || "firebase console/function";
                if (String(changedBy).indexOf("reset all hours") !== -1) {
                    return;
                }

                var prevHours = Number(getHourValue(entry.previousValue[hourField]));
                var newHours = Number(getHourValue(entry.newValue[hourField]));
                if (prevHours === newHours) {
                    return;
                }

                matching.push({
                    time: time,
                    previousValue: prevHours,
                    newValue: newHours,
                    changedBy: changedBy
                });
            });
        }

        matching.sort(function (a, b) {
            return b.time - a.time;
        });

        return Promise.all(matching.map(function (entry) {
            return resolveChangedByLabel(entry.changedBy).then(function (label) {
                entry.changedByLabel = label;
                return entry;
            });
        })).then(function (resolved) {
            renderHourHistory(resolved, hourLabel, resetAt);
        });
    }).catch(function (error) {
        console.error("Error loading hour history:", error);
        $list.empty().append('<li class="collection-item center-align red-text">Could not load hour updates.</li>');
        $("#hourHistorySubtitle").text("");
    });
}

// Attach event listeners once DOM is ready
$(document).ready(function () {
    // Save button click
    // $(document).on('click', '#saveNameBtn', function () {
    //     var user = firebase.auth().currentUser;
    //     if (user) saveNameToFirestore(user.uid);
    // });

    // Enter key on inputs saves
    $(document).on('keydown', '#firstName, #lastName', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            var user = firebase.auth().currentUser;
            if (user) saveNameToFirestore(user.uid);
        }
    });

    // Optional: blur to save
    $(document).on('blur', '#firstName, #lastName', function () {
        var user = firebase.auth().currentUser;
        if (user) saveNameToFirestore(user.uid);
    });

    // Grade radio change -> save
    $(document).on('change', 'input[name=gradeAccount]', function () {
        var user = firebase.auth().currentUser;
        if (user) saveNameToFirestore(user.uid);
    });

    // ID number save: Enter or blur
    $(document).on('keydown', '#idNumber', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            var user = firebase.auth().currentUser;
            if (user) saveNameToFirestore(user.uid);
        }
    });
    $(document).on('blur', '#idNumber', function () {
        var user = firebase.auth().currentUser;
        if (user) saveNameToFirestore(user.uid);
    });

    $(document).on('click', '.hour-card', function () {
        openHourHistory($(this).data('hour-field'), $(this).data('hour-label'));
    });

    $(document).on('keydown', '.hour-card', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openHourHistory($(this).data('hour-field'), $(this).data('hour-label'));
        }
    });
});
