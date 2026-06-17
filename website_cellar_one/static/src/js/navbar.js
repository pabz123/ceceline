/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  NAVBAR — Scroll-aware class, smooth anchor scrolling
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

const FALLBACK_NAV_ITEMS = [
    ["Wines", "/shop/category/wines-7"],
    ["Spirits", "/shop/category/spirits-8"],
    ["Beer", "/shop/category/beer-9"],
    ["Cider", "/shop/category/cider-10"],
    ["Brands", "/shop"],
    ["Find Us", "/location"],
];

publicWidget.registry.CellarOneNavbar = publicWidget.Widget.extend({
    selector: '#wrapwrap',

    start() {
        this._ensureNavbarRendered();
        this.navbar = document.querySelector('.co-site-header, .o_main_navbar, #top');
        if (!this.navbar) return this._super(...arguments);

        this._ticking = false;
        this._onScroll = this._onScroll.bind(this);
        window.addEventListener('scroll', this._onScroll, { passive: true });

        // Smooth anchor scrolling
        this.el.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                
                try {
                    const target = document.querySelector(href);
                    if (!target) return;
                    e.preventDefault();
                    const navH = this.navbar.offsetHeight + 16;
                    const top  = target.getBoundingClientRect().top + window.scrollY - navH;
                    window.scrollTo({ top, behavior: 'smooth' });
                } catch (err) {
                    // Ignore invalid selectors like "#/"
                }
            });
        });

        return this._super(...arguments);
    },

    /**
     * Defensive client-side fallback for databases with customized website
     * layout views. The QWeb template is still the source of truth, but some
     * Odoo Website Editor customizations can keep rendering the stock header
     * after module upgrades. When that happens, replace the visible header in
     * the browser so customers still get the Cellar One navigation.
     */
    _ensureNavbarRendered() {
        if (document.querySelector('.co-site-header')) return;

        const header = document.querySelector('header#top');
        if (!header) return;

        header.className = 'co-site-header';
        header.removeAttribute('style');
        header.innerHTML = this._renderFallbackNavbar();
    },

    _renderFallbackNavbar() {
        const navItems = FALLBACK_NAV_ITEMS.map(([label, href]) => `
            <li class="nav-item mx-lg-1">
                <a class="nav-link fw-bold text-uppercase" href="${href}">${label}</a>
            </li>
        `).join('');

        return `
            <nav class="navbar navbar-expand-lg co-navbar" aria-label="Main navigation">
                <div id="o_main_nav" class="o_main_nav container d-flex align-items-center">
                    <a href="/" class="co-navbar-brand d-flex align-items-center text-decoration-none" aria-label="Cellar One home">
                        <img src="/website_cellar_one/static/src/img/logo/cecelin_footer.png" alt="" class="co-navbar-brand__mark" loading="lazy"/>
                        <img src="/website_cellar_one/static/src/img/logo/ce_logo.png" alt="Cellar One" class="co-navbar-brand__wordmark" loading="lazy"/>
                    </a>

                    <button class="navbar-toggler ms-auto" type="button" data-bs-toggle="collapse"
                            data-bs-target="#co_main_nav_collapse" aria-controls="co_main_nav_collapse"
                            aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div id="co_main_nav_collapse" class="collapse navbar-collapse co-navbar-collapse">
                        <div class="co-navbar-menu mx-lg-auto">
                            <ul class="navbar-nav align-items-lg-center">
                                ${navItems}
                            </ul>
                        </div>

                        <div class="co-navbar-actions d-flex align-items-center gap-3 ms-lg-4">
                            <a href="https://wa.me/256749057433" target="_blank" rel="noopener"
                               class="co-nav-icon-btn co-nav-whatsapp d-flex align-items-center gap-2 text-decoration-none"
                               aria-label="Order on WhatsApp">
                                <i class="fa fa-whatsapp"></i> <span class="d-none d-xl-inline">Order</span>
                            </a>
                            <a href="/shop/wishlist" class="co-nav-icon-btn position-relative text-decoration-none" aria-label="Wishlist">
                                <i class="fa fa-heart-o"></i>
                            </a>
                            <a href="/shop/cart" class="co-nav-icon-btn position-relative text-decoration-none" aria-label="Shopping cart">
                                <i class="fa fa-shopping-cart"></i>
                            </a>
                            <a href="/web/login" class="co-nav-account-link text-decoration-none">Sign In</a>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    _onScroll() {
        if (!this._ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                this.navbar.classList.toggle('scrolled', scrollY > 60);
                this._ticking = false;
            });
            this._ticking = true;
        }
    },

    destroy() {
        window.removeEventListener('scroll', this._onScroll);
        this._super(...arguments);
    },
});

export default publicWidget.registry.CellarOneNavbar;
