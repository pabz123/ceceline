/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  AGE GATE — Shows once per session using sessionStorage
//  Uses Odoo 17 publicWidget for reliable lifecycle binding.
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

const AGE_GATE_KEY = 'cellar_one_age_verified';

publicWidget.registry.CellarOneAgeGate = publicWidget.Widget.extend({
    selector: '#co-age-gate',

    start() {
        // Already verified this session → hide and skip
        if (sessionStorage.getItem(AGE_GATE_KEY)) {
            this.el.classList.add('hidden');
            return this._super(...arguments);
        }

        // Show the gate
        this.el.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        const btnYes   = this.el.querySelector('.co-age-yes');
        const btnNo    = this.el.querySelector('.co-age-no');
        const bodyEl   = this.el.querySelector('.co-age-gate__body');
        const deniedEl = this.el.querySelector('.co-age-gate__denied');

        if (btnYes) {
            btnYes.addEventListener('click', () => {
                sessionStorage.setItem(AGE_GATE_KEY, '1');
                this.el.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }

        if (btnNo) {
            btnNo.addEventListener('click', () => {
                if (bodyEl)   bodyEl.style.display   = 'none';
                if (deniedEl) deniedEl.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'https://www.drinkaware.co.ug/';
                }, 2000);
            });
        }

        return this._super(...arguments);
    },
});

export default publicWidget.registry.CellarOneAgeGate;
