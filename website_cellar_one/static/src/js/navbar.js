/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

const GOOGLE_SVG = `<svg viewBox="0 0 48 48" style="height:18px;width:18px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.88 7.35 2.56 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

const FALLBACK_NAV_ITEMS = [
    { label: "Wines",   href: "/shop/category/wines-27",   children: [
        { label: "Red Wines",       href: "/shop/category/wines-red-wines-31" },
        { label: "White Wines",     href: "/shop/category/wines-white-wines-32" },
        { label: "Sparkling Wines", href: "/shop/category/wines-sparkling-wines-33" },
        { label: "Rosé Wines",      href: "/shop/category/wines-rose-wines-48" },
    ]},
    { label: "Spirits", href: "/shop/category/spirits-28", children: [
        { label: "Whisky", href: "/shop/category/spirits-whisky-49" },
        { label: "Gin",    href: "/shop/category/spirits-gin-50" },
        { label: "Vodka",  href: "/shop/category/spirits-vodka-51" },
        { label: "Rum",    href: "/shop/category/spirits-rum-52" },
    ]},
    { label: "Beer",    href: "/shop/category/beer-34" },
    { label: "Cider",   href: "/shop/category/cider-35" },
    { label: "Find Us", href: "/location" },
    { label: "Shop", href: "/shop" },
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

        this._initDropdownHover();
        this._syncBadges();
        this._loadOAuthProviders();

        return this._super(...arguments);
    },

    async _loadOAuthProviders() {
        const loginContainer = document.querySelector('.co-oauth-container');
        const signupContainer = document.querySelector('.co-oauth-container-signup');

        if (!loginContainer && !signupContainer) return;

        try {
            const res = await fetch(`/cellar/oauth_providers`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
            });
            const json = await res.json();
            const providers = json.result?.providers || [];

            let html = '';
            providers.forEach(p => {
                let icon = '';
                if (p.name.includes('Google')) {
                    icon = GOOGLE_SVG;
                } else if (p.name.includes('Facebook')) {
                    icon = `<i class="fa fa-facebook-official" style="color: #1877F2;"></i>`;
                } else {
                    icon = `<i class="${p.css_class}"></i>`;
                }
                html += `
                    <a href="${p.auth_link}" class="btn btn-outline-dark w-100 py-2 fw-bold d-flex justify-content-center align-items-center gap-2" style="border-radius: 8px;">
                        ${icon}
                        <span>Continue with ${p.name}</span>
                    </a>
                `;
            });

            if (html) {
                if (loginContainer) loginContainer.innerHTML = html;
                if (signupContainer) signupContainer.innerHTML = html;
            } else {
                if (loginContainer) loginContainer.style.display = 'none';
                if (signupContainer) signupContainer.style.display = 'none';
            }
        } catch (err) {
            console.warn('[CellarOne] Failed to load OAuth providers', err);
            if (loginContainer) loginContainer.style.display = 'none';
            if (signupContainer) signupContainer.style.display = 'none';
        }
    },

    _syncBadges() {
        $(document).on('update_wishlist_count', (ev, count) => {
            const $badge = $('.o_wsale_wishlist_number');
            $badge.text(count).toggleClass('d-none', !count);
        });

        $(document).on('update_cart_count', (ev, count) => {
            const $badge = $('.o_cart_quantity');
            $badge.text(count).toggleClass('d-none', !count);
        });
    },

    _initDropdownHover() {
        const HIDE_DELAY = 5000;
        const selectors = '.co-mega-nav-item, .nav-item.dropdown';
        const $items = $(selectors);
        const timers = new WeakMap();

        const hideAllOthers = ($active) => {
            $items.not($active).each(function () {
                const t = timers.get(this);
                if (t) clearTimeout(t);
                $(this).removeClass('show');
                $(this).find('.dropdown-menu').removeClass('show');
                $(this).find('.dropdown-toggle').attr('aria-expanded', 'false');
            });
        };

        const showDropdown = ($item) => {
            const t = timers.get($item[0]);
            if (t) clearTimeout(t);
            hideAllOthers($item);
            $item.addClass('show');
            $item.find('.dropdown-menu').addClass('show');
            $item.find('.dropdown-toggle').attr('aria-expanded', 'true');
        };

        const scheduleHide = ($item) => {
            const timer = setTimeout(() => {
                $item.removeClass('show');
                $item.find('.dropdown-menu').removeClass('show');
                $item.find('.dropdown-toggle').attr('aria-expanded', 'false');
            }, HIDE_DELAY);
            timers.set($item[0], timer);
        };

        $items.each(function () {
            const $item = $(this);
            const $menu = $item.find('.dropdown-menu');

            $item.on('mouseenter', () => showDropdown($item));
            $item.on('mouseleave', () => scheduleHide($item));

            if ($menu.length) {
                $menu.on('mouseenter', () => {
                    const t = timers.get($item[0]);
                    if (t) clearTimeout(t);
                });
                $menu.on('mouseleave', () => scheduleHide($item));
            }
        });
    },

    _ensureNavbarRendered() {
        if (document.querySelector('.co-site-header')) return;

        const header = document.querySelector('header#top');
        if (!header) return;

        header.className = 'co-site-header';
        header.removeAttribute('style');
        header.innerHTML = this._renderFallbackNavbar();
    },

    _renderFallbackNavbar() {
        const navItems = FALLBACK_NAV_ITEMS.map(item => {
            if (item.children && item.children.length) {
                const half = Math.ceil(item.children.length / 2);
                const col1 = item.children.slice(0, half);
                const col2 = item.children.slice(half);
                return `
                    <li class="nav-item dropdown mx-lg-1 co-mega-nav-item">
                        <a class="nav-link fw-bold text-uppercase dropdown-toggle" href="${item.href}" aria-expanded="false">${item.label}</a>
                        <div class="dropdown-menu co-megadropdown shadow-sm border-0 p-0">
                            <div class="co-megadropdown-inner">
                                <div class="co-megadropdown-col">
                                    ${col1.map(c => `<a class="co-mega-link" href="${c.href}">${c.label}</a>`).join('')}
                                </div>
                                ${col2.length ? `<div class="co-megadropdown-col">${col2.map(c => `<a class="co-mega-link" href="${c.href}">${c.label}</a>`).join('')}</div>` : ''}
                            </div>
                        </div>
                    </li>
                `;
            }
            return `
                <li class="nav-item mx-lg-1">
                    <a class="nav-link fw-bold text-uppercase" href="${item.href}">${item.label}</a>
                </li>
            `;
        }).join('');

        return `
            <div class="co-topbar d-none d-lg-flex align-items-center">
                <div class="container d-flex align-items-center justify-content-between">
                    <div class="co-topbar-left d-flex align-items-center gap-3">
                        <span class="co-topbar-tagline"><i class="fa fa-star" style="font-size:8px;vertical-align:middle;color:var(--co-gold);"></i> Uganda's Premier Wines &amp; Spirits Boutique</span>
                        <a href="/location" class="co-topbar-link"><i class="fa fa-map-marker"></i> Find Us</a>
                    </div>
                    <div class="co-topbar-right d-flex align-items-center gap-3">
                        <a href="https://wa.me/256749057433" target="_blank" class="co-topbar-link"><i class="fa fa-whatsapp"></i> Order on WhatsApp</a>
                        <span class="co-topbar-divider">|</span>
                        <a href="/web/login" class="co-topbar-link">Sign In</a>
                    </div>
                </div>
            </div>

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
                            <a href="/shop/wishlist" class="co-nav-icon-btn position-relative text-decoration-none o_wsale_wishlist" aria-label="Wishlist">
                                <i class="fa fa-heart-o"></i>
                                <span class="co-nav-badge o_wsale_wishlist_number d-none">0</span>
                            </a>
                            <a href="/shop/cart" class="co-nav-icon-btn position-relative text-decoration-none" aria-label="Shopping cart">
                                <i class="fa fa-shopping-cart"></i>
                                <span class="co-nav-badge o_cart_quantity d-none">0</span>
                            </a>
                            <a href="/web/login" class="co-nav-account-link text-decoration-none d-none d-lg-inline-block">Sign In</a>
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
