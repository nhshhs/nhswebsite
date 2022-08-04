'use strict';

var loaderOn = true;

$(document).ready(function () {
});

//used by other pages to show the loader when needed
function toggleLoader() {
	if (loaderOn) {
		$('.preloader-background').delay(50).fadeOut('slow');

		$('.preloader-wrapper')
			.delay(50)
			.fadeOut();
	} else {
		$('.preloader-background').delay(50).fadeIn('slow');

		$('.preloader-wrapper')
			.delay(50)
			.fadeIn();
	}
	loaderOn = !loaderOn;
}