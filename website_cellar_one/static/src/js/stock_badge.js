/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  STOCK BADGE — Fetches live qty from /cellar/stock/<id>
//  Updates badge text + colour + disables Add-to-Cart if OOS
// ─────────────────────────────────────────────────────────────

const STATUS_CLASSES = {
    in_stock:     'in-stock',
    low_stock:    'low-stock',
    out_of_stock: 'out-of-stock',
};

/**
 * Fetch stock for a single product and update its badge(s).
 * @param {number} productId  - product.product id
 */
async function fetchAndUpdateStock(productId) {
    const badges = document.querySelectorAll(
        `[data-stock-product-id="${productId}"]`
    );
    if (!badges.length) return;

    try {
        const res = await fetch(`/cellar/stock/${productId}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
        });
        const json = await res.json();
        const data = json.result || {};

        badges.forEach(badge => {
            // Remove previous status classes
            badge.classList.remove('in-stock', 'low-stock', 'out-of-stock', 'loading');

            const statusClass = STATUS_CLASSES[data.status] || 'out-of-stock';
            badge.classList.add(statusClass);

            // Update dot + label
            const dot = badge.querySelector('.co-stock-dot');
            const lbl = badge.querySelector('.co-stock-label');
            if (lbl) lbl.textContent = data.label || 'Unavailable';

            // Disable Add-to-Cart on OOS
            if (data.status === 'out_of_stock') {
                const addBtn = document.querySelector(
                    `#add_to_cart, .o_add_to_cart_btn, [data-product-id="${productId}"] .a-submit`
                );
                if (addBtn) {
                    addBtn.setAttribute('disabled', 'disabled');
                    addBtn.classList.add('oo-disabled');
                    addBtn.title = 'This product is currently out of stock';
                }
            }
        });

    } catch (err) {
        // Silently fail — don't break the page
        console.warn('[CellarOne] Stock fetch failed for product', productId, err);
        badges.forEach(b => {
            b.classList.remove('loading');
            b.classList.add('out-of-stock');
            const lbl = b.querySelector('.co-stock-label');
            if (lbl) lbl.textContent = 'Check availability';
        });
    }
}

/**
 * Find all stock badges on the current page and hydrate them.
 */
function initStockBadges() {
    const badges = document.querySelectorAll('[data-stock-product-id]');
    if (!badges.length) return;

    // Collect unique product IDs
    const productIds = new Set(
        [...badges].map(b => parseInt(b.dataset.stockProductId, 10)).filter(Boolean)
    );

    // Stagger requests so we don't flood the server
    let delay = 0;
    productIds.forEach(id => {
        setTimeout(() => fetchAndUpdateStock(id), delay);
        delay += 80; // 80ms between each
    });
}

document.addEventListener('DOMContentLoaded', initStockBadges);
