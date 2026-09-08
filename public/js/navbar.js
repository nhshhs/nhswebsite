//navbar.js
/*jshint multistr: true */
'use strict';
console.log("Navbar.js loading...");

let storedFirstName = localStorage.getItem('firstName');

// Wait for navbar component to load before initializing
function waitForNavbarComponent() {
    if (window.navbarComponent && window.navbarComponent.navbarLoaded) {
        // Navbar component is loaded, initialize Materialize components
        initializeMaterializeComponents();
    } else {
        // Wait a bit more for the navbar component to load
        setTimeout(waitForNavbarComponent, 50);
    }
}

function initializeMaterializeComponents() {
    if (typeof $ !== 'undefined') {
        $('.sidenav').sidenav();
        $(".collapsible").collapsible();
        $(".dropdown-trigger").dropdown({
            coverTrigger: false,
        });
        $("[href='/about/index.html']").addClass("hide"); //remove when about page is made
    }
}

$(document).ready(function () {
    // Wait for navbar component to load before initializing
    waitForNavbarComponent();
});

//puts the name in the navbar if logged in
firebase.auth().onAuthStateChanged(function (user) {
    console.log("Auth state changed. User:", user ? user.uid : "not signed in");
    
    // Wait for navbar component to be loaded before updating auth state
    function updateAuthStateWhenReady() {
        if (window.navbarComponent && window.navbarComponent.navbarLoaded) {
            if (user) {
                let storedFirstName = localStorage.getItem('firstName');
                console.log("Stored firstName:", storedFirstName);
                console.log("User is signed in. UID:", user.uid);
                
                firebase.firestore().collection("users").doc(user.uid).get().then(function (doc) {
                    console.log("Attempting to fetch user document");
                    let userData = {};
                    
                    if (doc.exists) {
                        console.log("User document exists:", doc.data());
                        if (doc.data().deleted) {
                            firebase.auth().signOut();
                            doneLoading();
                            return null;
                        }
                        userData = doc.data();
                        userData.firstName = userData.firstName || storedFirstName || "New User";
                        localStorage.removeItem('firstName');
                        
                        // Check admin status
                        return checkAdminStatus(doc).then((isAdmin) => {
                            userData.isAdmin = isAdmin;
                            return userData;
                        });
                    } else {
                        console.log("No user document! Creating one now...");
                        return createUserDocument(user).then(() => {
                            return firebase.firestore().collection("users").doc(user.uid).get();
                        }).then((newDoc) => {
                            userData = newDoc.data();
                            userData.firstName = userData.firstName || storedFirstName || "New User";
                            localStorage.removeItem('firstName');
                            
                            return checkAdminStatus(newDoc).then((isAdmin) => {
                                userData.isAdmin = isAdmin;
                                return userData;
                            });
                        });
                    }
                }).then((userData) => {
                    if (!userData) {
                        return;
                    }
                    // Update navbar component with user data
                    window.navbarComponent.updateAuthState(user, userData);
                    checkAnnouncements(userData);
                    doneLoading();
                }).catch(function (error) {
                    console.error("Error getting or creating user document:", error);
                    doneLoading();
                });
            } else {
                console.log("User is not signed in");
                // Update navbar component for logged out state
                window.navbarComponent.updateAuthState(null);
                doneLoading();
            }
        } else {
            // Wait for navbar component to load
            setTimeout(updateAuthStateWhenReady, 50);
        }
    }
    
    updateAuthStateWhenReady();
});

function createUserDocument(user) {
    console.log('Creating user document for:', user.uid);
    let storedFirstName = localStorage.getItem('firstName');
    let storedLastName = localStorage.getItem('lastName');
    return firebase.firestore().collection("users").doc(user.uid).set({
        firstName: storedFirstName || "New",
        lastName: storedLastName || "User",
        email: user.email,
        grade: parseFloat(localStorage.getItem('grade')) || null,
        idNumber: parseFloat(localStorage.getItem('idNumber')) || null,
        deductions: "",
        projectHours: 0,
        regularHours: 0,
        socialHours: 0,
        hours: {
            fall: 0,
            spring: 0,
            summer: 0,
            total: 0
        },
        //justUpdatedBy: user.uid
    }).then(() => {
        console.log('User document created in Firestore');
        console.log('First Name:', storedFirstName);
        console.log('Last Name:', storedLastName);
        return user;
    }).catch(error => {
        console.error('Error creating user document in Firestore:', error);
        throw error;
    });
}

function checkAdminStatus(doc) {
    return firebase.firestore().collection("info").doc("admins").get().then(function (adminDoc) {
        console.log("Fetching admin document");
        if (adminDoc.exists) {
            console.log("Admin document exists:", adminDoc.data());
            if (adminDoc.data().execs.includes(doc.id) || adminDoc.data().project.includes(doc.id) || adminDoc.data().ads.includes(doc.id)) {
                console.log("User is an admin");
                return true;
            } else {
                console.log("User is not an admin");
                return false;
            }
        } else {
            console.log("Admin document does not exist");
            return false;
        }
    }).catch(function(error) {
        console.error("Error fetching admin document:", error);
        return false;
    });
}

function logout() {
    localStorage.removeItem('firstName');
    firebase.auth().signOut();
    location.reload();
}
//some pages only load the navbar, so this toggles the loader for them
function doneLoading() {
	if (window.location.pathname === "/" && !new URLSearchParams(location.search).has('sohiljoke3') || window.location.pathname === "/project" || window.location.pathname === "/about") {
		toggleLoader();
	}
}

//this is a fun easter egg lol, pls don't remove
function doSohiljokes() {
	var params = new URLSearchParams(location.search);
	if (params.has('sohiljoke1')) {
		sohiljoke1();
	} else if (params.has('sohiljoke2')) {
		sohiljoke2();
	} else if (params.has('sohiljoke3')) {
		sohiljoke3();
	}
}

function sohiljoke1() {
	$(".account").html("♡ Snookie ♡");
	$(".account").removeClass("hide");
	$(".brand-logo").html("<b>Supra Club</b>");
	$("#mobile-menu h1").html("<b>Supra Club</b>");
	$("#mobile-menu p").addClass("hide");
	$("#maintext").addClass("hide");
}

function sohiljoke2() {
	$(".brand-logo").html("<b>Supra Club</b>");
	$("#mobile-menu h1").html("<b>Supra Club</b>");
	$("#mobile-menu p").addClass("hide");
	$("#maintext").addClass("hide");
	$(".blue-text").removeClass("blue-text text-darken-4").addClass("white-text");
	document.getElementById("homepage").style = "background: url('/img/sohiljoke/sohiljoke.png');\
												background-repeat: no-repeat;\
												background-size: cover;\
												-webkit-background-size: cover;\
												-moz-background-size: cover;\
												-o-background-size: cover;\
												background-position: center;\
												height: 820px;";
}

function sohiljoke3() {
	const desktopWidth = 992,
	tabletWidth = 600;
	var windowWidth = window.innerWidth;

	window.onresize = function () {
		if (window.innerWidth > windowWidth) { //window width got bigger
			if (window.innerWidth > tabletWidth && windowWidth <= tabletWidth) {
				location.reload();
			} else if (window.innerWidth > desktopWidth && windowWidth <= desktopWidth) {
				location.reload();
			}
		} else { //window width got smaller
			if (window.innerWidth <= tabletWidth && windowWidth > tabletWidth) {
				location.reload();
			} else if (window.innerWidth <= desktopWidth && windowWidth > desktopWidth) {
				location.reload();
			}
		}
	};
	
	$(".brand-logo").html("<b>Supra Club</b>");
	$("#mobile-menu h1").html("<b>Supra Club</b>");
	$("#mobile-menu p").addClass("hide");
	$("#maintext").addClass("hide");
	
	var totalPicsNum = 0;
	if(window.innerWidth<=tabletWidth){
		totalPicsNum = 141;
		$(".brand-logo").removeClass("blue-text text-darken-4").addClass("white-text");
	} else {
		totalPicsNum = 547;
		$(".blue-text").removeClass("blue-text text-darken-4").addClass("black-text");
	}
	
	for(var i = 0;i<totalPicsNum;i++){
		if(window.innerWidth<=tabletWidth){
			$("#sohiljoke3").append('<img src="/img/sohiljoke/sohiljoke3phone/'+i+'.jpg"/>');
		} else {
			$("#sohiljoke3").append('<img src="/img/sohiljoke/sohiljoke3/'+i+'.jpg"/>');	
		}
		if(i===totalPicsNum-1){
			
			
			const pictures = $('#sohiljoke3 img');
			const pictureCount = pictures.length;
			var numpics = pictures.length;
			 
			pictures.on('load', function(){
			  --numpics;
			  if (!numpics) {
				toggleLoader();
			  }
			});
			
			var scrollResolution = 10;
			
			var setHeight = document.getElementById("homepage");
			
			if(window.innerWidth<=tabletWidth){
				setHeight.style.height  = i*scrollResolution + window.innerHeight + "px";
			} else {
				setHeight.style.height  = i*scrollResolution + window.innerHeight + "px";
			}
						

			function animateScroll() {
				var currentScrollPosition = window.pageYOffset;
				var imageIndex = Math.round(currentScrollPosition / scrollResolution);
								
				if (imageIndex >= pictureCount) {
					imageIndex = pictureCount - 1;
				}

				pictures.hide();
				pictures.eq(imageIndex).show();
			}

			animateScroll();

			$(window).bind('scroll', function() {
				animateScroll();
			});
		}
	}
}

function checkAnnouncements(userData) {
	if (!userData) return;
	firebase.firestore().collection("announcements").where("active", "==", true).orderBy("timestamp", "desc").limit(1).get().then(function (querySnapshot) {
		querySnapshot.forEach(function (doc) {
			var data = doc.data();
			if (data.type === "all" || (data.type === "admin" && userData.isAdmin)) {
				$("#announcement-message").text(data.message);
				$("#announcement-banner").removeClass("hide");
			}
		});
	}).catch(function (error) {
		console.error("Error getting announcements:", error);
	});
}

$(document).on('click', '#dismiss-announcement', function() {
	$("#announcement-banner").addClass("hide");
});
