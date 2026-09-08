// navbar-component.js
'use strict';

// Navbar component loader and manager
class NavbarComponent {
    constructor() {
        this.navbarLoaded = false;
        this.currentPage = this.getCurrentPage();
        this.navbarStyle = this.getNavbarStyle();
        // Debug: show which navbar style object the running JS is using
        try {
            console.debug('NavbarComponent constructed - navbarStyle:', this.navbarStyle);
        } catch (e) {
            // ignore
        }
    }

    // Determine current page from URL
    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/about/')) return 'about';
        if (path.includes('/events/')) return 'events';
        if (path.includes('/project/')) return 'project';
        if (path.includes('/admin/')) return 'admin';
        if (path.includes('/account/')) return 'account';
        if (path.includes('/login/')) return 'login';
        return 'home';
    }

    // Determine navbar style - now consistent across all pages
    getNavbarStyle() {
        // Use consistent blue accent-1 style for all pages
        return {
            navClass: 'indigo darken-4',
            textClass: 'white-text',
            subtitleClass: 'white-text'
        };
    }

    // Load navbar component from external file
    async loadNavbar(containerId = 'navbar-container') {
        try {
            const response = await fetch('/components/navbar.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const navbarHTML = await response.text();
            
            // Insert navbar into container
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = navbarHTML;
                this.applyNavbarStyles();
                this.setActiveStates();
                this.navbarLoaded = true;
                
                // Initialize Materialize components after navbar is loaded
                this.initializeMaterialize();
                
                console.log('Navbar component loaded successfully');
            } else {
                console.error(`Container with ID '${containerId}' not found`);
            }
        } catch (error) {
            console.error('Error loading navbar component:', error);
        }
    }

    // Apply appropriate styles to navbar based on current page
    applyNavbarStyles() {
        const nav = document.querySelector('.navbar-nav');
        const textElements = document.querySelectorAll('.navbar-text');
        const subtitleElements = document.querySelectorAll('.navbar-subtitle');
        
        if (nav) {
            nav.className = `navbar-nav ${this.navbarStyle.navClass}`;
            // Debug: confirm the class applied to the <nav>
            console.debug('applyNavbarStyles set nav.className ->', nav.className);
        }
        
        // Apply text styles
        textElements.forEach(element => {
            element.className = element.className.replace(/\b(blue-text text-darken-4|white-text)\b/g, '');
            element.classList.add(...this.navbarStyle.textClass.split(' '));
        });
        
        // Apply subtitle styles
        subtitleElements.forEach(element => {
            element.className = element.className.replace(/\b(blue-text text-accent-1|white-text)\b/g, '');
            element.classList.add(...this.navbarStyle.subtitleClass.split(' '));
        });

        // Final debug summary: log first few elements to verify classes
        try {
            const brand = document.querySelector('.brand-logo');
            console.debug('Navbar debug - brand-logo classes:', brand ? brand.className : '<none>');
            console.debug('Navbar debug - sample navbar-text classes:', textElements.length ? textElements[0].className : '<none>');
        } catch (e) {
            // ignore
        }
    }

    // Set active states for current page
    setActiveStates() {
        // Remove all existing active classes
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

        // Add active class to current page links
        const currentPageLinks = document.querySelectorAll(`[data-page="${this.currentPage}"]`);
        currentPageLinks.forEach(link => {
            link.parentElement.classList.add('active');
        });

        // No need for special handling for events/project dropdowns,
        // since all links are always visible (except admin).
    }

    // Initialize Materialize components
    initializeMaterialize() {
        if (typeof $ !== 'undefined' && $.fn.sidenav) {
            $('.sidenav').sidenav();
            $('.collapsible').collapsible();
            $('.dropdown-trigger').dropdown({
                coverTrigger: false,
            });
            // Remove about page hiding for consistency
            // $("[href='/about/index.html']").addClass("hide");
        } else {
            setTimeout(() => this.initializeMaterialize(), 100);
        }
    }

    // Update navbar when authentication state changes
    updateAuthState(user, userData = null) {
        if (!this.navbarLoaded) return;

        const loginLink = document.querySelector('.login');
        const accountLink = document.querySelector('.account');
        const adminLinks = document.querySelectorAll('.admin');

        if (user && loginLink && accountLink) {
            // User is logged in
            loginLink.textContent = 'Logout';
            loginLink.setAttribute('href', 'javascript:logout();');

            if (userData && userData.firstName) {
                accountLink.textContent = userData.firstName;
            } else {
                accountLink.textContent = 'Account';
            }
            accountLink.classList.remove('hide');

            // Show admin links if user is admin
            if (userData && userData.isAdmin) {
                adminLinks.forEach(link => link.classList.remove('hide'));
            } else {
                adminLinks.forEach(link => link.classList.add('hide'));
            }
        } else {
            // User is not logged in
            if (loginLink) {
                loginLink.textContent = 'Login';
                loginLink.setAttribute('href', '/login/index.html');
            }
            if (accountLink) {
                accountLink.classList.add('hide');
            }
            adminLinks.forEach(link => link.classList.add('hide'));
        }
    }
}

// Global navbar instance
window.navbarComponent = new NavbarComponent();

// Auto-load navbar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.navbarComponent.loadNavbar();
});

