//public/js/preloader.js
'use strict';

console.log("Preloader.js loading...");

var loaderOn = true;

function hideLoader() {
    console.log("hideLoader called");
    $('.preloader-background').hide();
    $('.preloader-wrapper').hide();
    loaderOn = false;
}

function showLoader() {
    console.log("showLoader called");
    $('.preloader-background').show();
    $('.preloader-wrapper').show();
    loaderOn = true;
}

function toggleLoader() {
    console.log("toggleLoader called, current state:", loaderOn);
    if (loaderOn) {
        hideLoader();
    } else {
        showLoader();
    }
}

window.hideLoader = hideLoader;
window.showLoader = showLoader;
window.toggleLoader = toggleLoader;

$(document).ready(function() {
    console.log("Preloader document ready");
    showLoader();
    
    setTimeout(function() {
        console.log("5 second timeout reached");
        hideLoader();
    }, 5000);
});