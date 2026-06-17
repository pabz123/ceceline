/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  NAVBAR — Scroll-aware class, smooth anchor scrolling
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.CellarOneNavbar = publicWidget.Widget.extend({
    selector: '#wrapwrap',

    start() {
        this.navbar = document.querySelector('.o_main_navbar, #top');
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
