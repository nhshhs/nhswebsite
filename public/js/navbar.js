/*jshint multistr: true */
'use strict';

$(document).ready(function () {
	$('.sidenav').sidenav();
	$(".collapsible").collapsible();
	$(".dropdown-trigger").dropdown({
		coverTrigger: false,
	});
	$("[href='/about/index.html']").addClass("hide"); //remove when about page is made
});

//puts the name in the navbar if logged in
firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		// User is signed in.
		$(".login").text("Logout");
		$(".login").attr("href", "javascript:logout();");
		firebase.firestore().collection("users").doc(user.uid).get().then(function (doc) {
			if (doc.exists) {
				$(".account").text(doc.data().firstName);

				firebase.firestore().collection("info").doc("admins").get().then(function (adminDoc) {
					if (adminDoc.data().execs.includes(doc.id) || adminDoc.data().project.includes(doc.id) || adminDoc.data().ads.includes(doc.id)) {
						$(".admin").removeClass("hide");
					}
					doneLoading();
				});

			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
		$(".account").removeClass("hide");
	} else {
		doneLoading();
	}
});

//some pages only load the navbar, so this toggles the loader for them
function doneLoading() {
	if (window.location.pathname === "/" && !new URLSearchParams(location.search).has('sohiljoke3') || window.location.pathname === "/project" || window.location.pathname === "/about") {
		toggleLoader();
	}
}

function logout() {
	firebase.auth().signOut();
	location.reload();
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
