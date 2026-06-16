/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  STOCK BADGE — Fetches live qty from /cellar/stock/<id>
//  Updates badge text + colour + disables Add-to-Cart if OOS
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

const STATUS_CLASSES = {
    in_stock:     'in-stock',
    low_stock:    'low-stock',
    out_of_stock: 'out-of-stock',
};

publicWidget.registry.CellarOneStockBadge = publicWidget.Widget.extend({
    selector: '.co-stock-badge[data-stock-product-id]',

    start() {
        const productId = parseInt(this.el.dataset.stockProductId, 10);
        if (productId) {
            this._fetchStock(productId);
        }
        return this._super(...arguments);
    },

    async _fetchStock(productId) {
        try {
            const res = await fetch(`/cellar/stock/${productId}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
            });
            const json = await res.json();
            const data = json.result || {};

            // Remove loading + previous status
            this.el.classList.remove('in-stock', 'low-stock', 'out-of-stock', 'loading');
            const statusClass = STATUS_CLASSES[data.status] || 'out-of-stock';
            this.el.classList.add(statusClass);

            // Update label
            const lbl = this.el.querySelector('.co-stock-label');
            if (lbl) lbl.textContent = data.label || 'Unavailable';

            // Disable Add-to-Cart if OOS
            if (data.status === 'out_of_stock') {
                const form = this.el.closest('form');
                const addBtn = form?.querySelector('.a-submit, .o_add_to_cart_btn, #add_to_cart');
                if (addBtn) {
                    addBtn.setAttribute('disabled', 'disabled');
                    addBtn.classList.add('oo-disabled');
                    addBtn.title = 'This product is currently out of stock';
                }
            }
        } catch (err) {
            console.warn('[CellarOne] Stock fetch failed for product', productId, err);
            this.el.classList.remove('loading');
            this.el.classList.add('out-of-stock');
            const lbl = this.el.querySelector('.co-stock-label');
            if (lbl) lbl.textContent = 'Check availability';
        }
    },
});

export default publicWidget.registry.CellarOneStockBadge;
