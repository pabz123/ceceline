/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  IMAGE FALLBACK — Replace broken product images
//  Uses event delegation so it works even with dynamic content
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

const PLACEHOLDER = '/website_cellar_one/static/src/img/placeholder.svg';

publicWidget.registry.CellarOneImageFallback = publicWidget.Widget.extend({
    selector: '#wrapwrap',

    start() {
        document.addEventListener('error', (e) => {
            const img = e.target;
            if (!img || img.tagName !== 'IMG') return;
            if (!img.closest('.oe_product_image, .co-product-card')) return;
            if (img.dataset.coFallbackSet) return;
            img.dataset.coFallbackSet = '1';
            img.src = PLACEHOLDER;
            img.srcset = '';
        }, true);

        return this._super(...arguments);
    },
});
