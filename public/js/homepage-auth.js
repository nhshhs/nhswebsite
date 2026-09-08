console.log("homepage-auth.js loading...");

(function () {
    const selector = '.homepage-btn.homepage-btn--outline';

    function updateLoginLink(user) {
        const el = document.querySelector(selector);
        if (!el) return;
        if (user) {
            // User signed in -> go to account page
            el.setAttribute('href', '/account/index.html');
            el.textContent = 'My Account';
        } else {
            // Not signed in -> go to login page
            el.setAttribute('href', '/login/index.html');
            el.textContent = 'Login';
        }
    }

    function init() {
        if (window.firebase && firebase.auth) {
            // Set initial state and listen for changes
            updateLoginLink(firebase.auth().currentUser);
            firebase.auth().onAuthStateChanged(function (user) {
                updateLoginLink(user);
            });
        } else {
            // Firebase not ready yet - poll briefly
            let attempts = 0;
            const t = setInterval(function () {
                attempts++;
                if (window.firebase && firebase.auth) {
                    clearInterval(t);
                    updateLoginLink(firebase.auth().currentUser);
                    firebase.auth().onAuthStateChanged(function (user) {
                        updateLoginLink(user);
                    });
                } else if (attempts > 50) {
                    clearInterval(t);
                    console.warn('homepage-auth: firebase not available');
                }
            }, 50);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
