/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  RATINGS — Renders SVG stars, loads rating breakdown,
//             handles star-picker interaction, submits reviews
// ─────────────────────────────────────────────────────────────

// ── Star SVG renderer ────────────────────────────────────────
/**
 * Render star icons into a container element.
 * @param {HTMLElement} el       - target element
 * @param {number}      average  - 0–5 (can be float e.g. 3.7)
 */
function renderStars(el, average) {
    if (!el) return;
    el.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'co-star';

        if (average >= i) {
            star.classList.add('filled');
            star.textContent = '★';
        } else if (average >= i - 0.5) {
            star.classList.add('half');
            star.textContent = '★'; // half via CSS clip-path if desired
        } else {
            star.textContent = '☆';
        }
        el.appendChild(star);
    }
}

// ── Load rating summary for a product ───────────────────────
async function loadRatingSummary(productTemplateId) {
    const summaryEl = document.getElementById('co-rating-summary');
    if (!summaryEl) return;

    try {
        const res = await fetch(`/cellar/rating/${productTemplateId}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
        });
        const json = await res.json();
        const data = json.result || { average: 0, count: 0, breakdown: {} };

        // Big score
        const scoreEl = summaryEl.querySelector('.co-big-score');
        if (scoreEl) scoreEl.textContent = data.count ? data.average.toFixed(1) : '—';

        // Stars
        const starsEl = summaryEl.querySelector('.co-stars-lg');
        if (starsEl) renderStars(starsEl, data.average);

        // Count
        const countEl = summaryEl.querySelector('.co-review-count');
        if (countEl) countEl.textContent = `${data.count} review${data.count !== 1 ? 's' : ''}`;

        // Breakdown bars
        for (let star = 5; star >= 1; star--) {
            const row = summaryEl.querySelector(`[data-star="${star}"]`);
            if (!row) continue;
            const pct  = data.breakdown[star]?.pct  ?? 0;
            const cnt  = data.breakdown[star]?.count ?? 0;
            const fill = row.querySelector('.co-bar-fill');
            const pctEl= row.querySelector('.co-bar-pct');
            if (fill)  fill.style.width = `${pct}%`;
            if (pctEl) pctEl.textContent = cnt ? `${pct}%` : '0%';
        }

        // Inline summary on product card (if present)
        document.querySelectorAll(`.co-card-rating[data-product-tmpl="${productTemplateId}"]`).forEach(el => {
            const stars  = el.querySelector('.co-stars');
            const countS = el.querySelector('.co-rating-count');
            if (stars)  renderStars(stars, data.average);
            if (countS) countS.textContent = data.count ? `(${data.count})` : '';
        });

    } catch (err) {
        console.warn('[CellarOne] Rating fetch failed', err);
    }
}

// ── Hydrate all card star containers ────────────────────────
async function hydrateCardRatings() {
    const cards = document.querySelectorAll('.co-card-rating[data-product-tmpl]');
    if (!cards.length) return;

    const ids = new Set([...cards].map(c => parseInt(c.dataset.productTmpl, 10)).filter(Boolean));

    let delay = 0;
    ids.forEach(id => {
        setTimeout(async () => {
            try {
                const res = await fetch(`/cellar/rating/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
                });
                const json = await res.json();
                const data = json.result || { average: 0, count: 0 };

                document.querySelectorAll(`.co-card-rating[data-product-tmpl="${id}"]`).forEach(el => {
                    const starsEl = el.querySelector('.co-stars');
                    const countEl = el.querySelector('.co-rating-count');
                    if (starsEl) renderStars(starsEl, data.average);
                    if (countEl) countEl.textContent = data.count ? `(${data.count})` : '';
                });
            } catch (_) {}
        }, delay);
        delay += 60;
    });
}

// ── Star picker (review form) ────────────────────────────────
function initStarPicker() {
    const picker = document.querySelector('.co-star-picker');
    if (!picker) return;

    const inputs = picker.querySelectorAll('input[type="radio"]');
    const labels = picker.querySelectorAll('label');

    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // Update hidden rating field used by Odoo's rating.rating model
            const hiddenField = document.getElementById('co-review-rating');
            if (hiddenField) hiddenField.value = input.value;
        });
    });
}

// ── Review form submission ───────────────────────────────────
function initReviewForm() {
    const form = document.getElementById('co-review-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('[type="submit"]');
        const productTmplId = parseInt(form.dataset.productTmplId, 10);
        const rating  = parseInt(form.querySelector('#co-review-rating')?.value || '0', 10);
        const title   = form.querySelector('#co-review-title')?.value.trim();
        const comment = form.querySelector('#co-review-comment')?.value.trim();

        if (!rating) {
            showFormError(form, 'Please select a star rating.');
            return;
        }
        if (!comment) {
            showFormError(form, 'Please write a review comment.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Submitting…';

        try {
            // Odoo's native website_sale rating endpoint
            const res = await fetch('/shop/product/rate', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method:  'call',
                    id: 1,
                    params: {
                        product_template_id: productTmplId,
                        rating:              rating,
                        title:               title || '',
                        description:         comment,
                    },
                }),
            });
            const json = await res.json();

            if (json.result?.success) {
                showFormSuccess(form, '✓ Thank you! Your review has been submitted.');
                form.reset();
                // Reload ratings after submission
                setTimeout(() => loadRatingSummary(productTmplId), 800);
            } else {
                showFormError(form, json.result?.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            showFormError(form, 'Network error. Please check your connection and try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Submit Review';
        }
    });
}

function showFormError(form, msg) {
    let el = form.querySelector('.co-form-feedback');
    if (!el) {
        el = document.createElement('p');
        el.className = 'co-form-feedback';
        form.prepend(el);
    }
    el.style.color   = '#C0392B';
    el.style.background = '#FDEDEC';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '16px';
    el.style.fontSize = '0.875rem';
    el.textContent = msg;
}

function showFormSuccess(form, msg) {
    const el = form.querySelector('.co-form-feedback') || document.createElement('p');
    el.className = 'co-form-feedback';
    el.style.color = '#1A7F4B';
    el.style.background = '#E8F5EE';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '16px';
    el.style.fontSize = '0.875rem';
    el.textContent = msg;
    if (!el.parentNode) form.prepend(el);
}

// ── Product detail tabs ──────────────────────────────────────
function initDetailTabs() {
    const tabs   = document.querySelectorAll('.co-tab');
    const panels = document.querySelectorAll('.co-tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t   => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panel = document.querySelector(`.co-tab-panel[data-tab="${target}"]`);
            if (panel) panel.classList.add('active');

            // Scroll to review section if that tab chosen
            if (target === 'reviews') {
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ── Lightbox ─────────────────────────────────────────────────
function initLightbox() {
    const mainImg  = document.querySelector('.co-gallery-main img');
    const lightbox = document.getElementById('co-lightbox');
    if (!mainImg || !lightbox) return;

    const lbImg   = lightbox.querySelector('.co-lightbox__img');
    const lbClose = lightbox.querySelector('.co-lightbox__close');

    mainImg.addEventListener('click', () => {
        lbImg.src = mainImg.src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    lbClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

    // Thumbnail switching
    document.querySelectorAll('.co-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.querySelectorAll('.co-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImg.src = thumb.querySelector('img')?.src || mainImg.src;
        });
    });
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    hydrateCardRatings();
    initStarPicker();
    initReviewForm();
    initDetailTabs();
    initLightbox();

    // Product detail page — load rating summary
    const summaryEl = document.getElementById('co-rating-summary');
    if (summaryEl) {
        const tmplId = parseInt(summaryEl.dataset.productTmplId, 10);
        if (tmplId) loadRatingSummary(tmplId);
    }
});
