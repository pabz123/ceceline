/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  RATINGS — Star rendering, rating breakdown, review form
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";

// ── Star SVG renderer ────────────────────────────────────────
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
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
        el.appendChild(star);
    }
}

// ── Card rating widget (shop page) ──────────────────────────
publicWidget.registry.CellarOneCardRating = publicWidget.Widget.extend({
    selector: '.co-card-rating',

    start() {
        // Render stars from the data attribute set in QWeb
        const starsEl = this.el.querySelector('.co-stars');
        if (starsEl) {
            const avg = parseFloat(starsEl.dataset.rating || '0');
            renderStars(starsEl, avg);
        }
        return this._super(...arguments);
    },
});

// ── Rating summary widget (product detail page) ─────────────
publicWidget.registry.CellarOneRatingSummary = publicWidget.Widget.extend({
    selector: '#co-rating-summary',

    start() {
        const tmplId = parseInt(this.el.dataset.productTmplId, 10);
        if (tmplId) {
            this._loadSummary(tmplId);
        }
        this._initStarPicker();
        this._initReviewForm();
        return this._super(...arguments);
    },

    async _loadSummary(productTemplateId) {
        try {
            const res = await fetch(`/cellar/rating/${productTemplateId}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: {} }),
            });
            const json = await res.json();
            const data = json.result || { average: 0, count: 0, breakdown: {} };

            const scoreEl = this.el.querySelector('.co-big-score');
            if (scoreEl) scoreEl.textContent = data.count ? data.average.toFixed(1) : '—';

            const starsEl = this.el.querySelector('.co-stars-lg');
            if (starsEl) renderStars(starsEl, data.average);

            const countEl = this.el.querySelector('.co-review-count');
            if (countEl) countEl.textContent = `${data.count} review${data.count !== 1 ? 's' : ''}`;

            for (let star = 5; star >= 1; star--) {
                const row = this.el.querySelector(`[data-star="${star}"]`);
                if (!row) continue;
                const pct  = data.breakdown[star]?.pct  ?? 0;
                const cnt  = data.breakdown[star]?.count ?? 0;
                const fill = row.querySelector('.co-bar-fill');
                const pctEl= row.querySelector('.co-bar-pct');
                if (fill)  fill.style.width = `${pct}%`;
                if (pctEl) pctEl.textContent = cnt ? `${pct}%` : '0%';
            }
        } catch (err) {
            console.warn('[CellarOne] Rating fetch failed', err);
        }
    },

    _initStarPicker() {
        const picker = this.el.querySelector('.co-star-picker');
        if (!picker) return;
        picker.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', () => {
                const hidden = document.getElementById('co-review-rating');
                if (hidden) hidden.value = input.value;
            });
        });
    },

    _initReviewForm() {
        const form = this.el.querySelector('#co-review-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('[type="submit"]');
            const productTmplId = parseInt(form.dataset.productTmplId, 10);
            const rating  = parseInt(form.querySelector('#co-review-rating')?.value || '0', 10);
            const comment = form.querySelector('#co-review-comment')?.value.trim();

            if (!rating) { this._showFeedback(form, 'Please select a star rating.', true); return; }
            if (!comment) { this._showFeedback(form, 'Please write a review.', true); return; }

            btn.disabled = true;
            btn.textContent = 'Submitting…';

            try {
                const res = await fetch('/shop/product/rate', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0', method: 'call', id: 1,
                        params: { product_template_id: productTmplId, rating, description: comment },
                    }),
                });
                const json = await res.json();
                if (json.result?.success) {
                    this._showFeedback(form, '✓ Thank you! Your review has been submitted. Refreshing...', false);
                    form.reset();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    this._showFeedback(form, json.result?.error || 'Something went wrong.', true);
                }
            } catch (_) {
                this._showFeedback(form, 'Network error. Please try again.', true);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Submit Review';
            }
        });
    },

    _showFeedback(form, msg, isError) {
        let el = form.querySelector('.co-form-feedback');
        if (!el) { el = document.createElement('p'); el.className = 'co-form-feedback'; form.prepend(el); }
        el.style.cssText = `padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:0.875rem;color:${isError ? '#C0392B' : '#1A7F4B'};background:${isError ? '#FDEDEC' : '#E8F5EE'}`;
        el.textContent = msg;
    },
});

// ── Lightbox widget ──────────────────────────────────────────
publicWidget.registry.CellarOneLightbox = publicWidget.Widget.extend({
    selector: '#co-lightbox',

    start() {
        this.lbImg   = this.el.querySelector('.co-lightbox__img');
        this.lbClose = this.el.querySelector('.co-lightbox__close');

        const mainImg = document.querySelector('.co-gallery-main img');
        if (mainImg) {
            mainImg.addEventListener('click', () => {
                this.lbImg.src = mainImg.src;
                this.el.classList.add('open');
                document.body.style.overflow = 'hidden';
            });
        }

        this._closeLightbox = this._closeLightbox.bind(this);
        this.lbClose?.addEventListener('click', this._closeLightbox);
        this.el.addEventListener('click', (e) => { if (e.target === this.el) this._closeLightbox(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this._closeLightbox(); });

        // Thumbnail switching
        document.querySelectorAll('.co-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                document.querySelectorAll('.co-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                if (mainImg) mainImg.src = thumb.querySelector('img')?.src || mainImg.src;
            });
        });

        return this._super(...arguments);
    },

    _closeLightbox() {
        this.el.classList.remove('open');
        document.body.style.overflow = '';
    },
});
