/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  AUTH MODAL — AJAX login/signup to stay inside the modal
// ─────────────────────────────────────────────────────────────

import publicWidget from "@web/legacy/js/public/public_widget";
import { _t } from "@web/core/l10n/translation";

publicWidget.registry.CellarOneAuthModal = publicWidget.Widget.extend({
    selector: '#coAuthModal',

    start() {
        this._bindForms();
        return this._super(...arguments);
    },

    _bindForms() {
        const loginForm = this.el.querySelector('.oe_login_form');
        const signupForm = this.el.querySelector('.oe_signup_form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this._handleLogin(e));
        }
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this._handleSignup(e));
        }
    },

    _showError(form, message) {
        const existing = form.querySelector('.co-auth-error');
        if (existing) existing.remove();
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger py-2 small co-auth-error';
        alert.textContent = message;
        form.prepend(alert);
    },

    _clearErrors(form) {
        form.querySelectorAll('.co-auth-error').forEach(el => el.remove());
    },

    _setLoading(form, loading) {
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;
        if (loading) {
            if (!btn.dataset.originalText) {
                btn.dataset.originalText = btn.innerHTML;
            }
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Signing in…';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || btn.textContent;
        }
    },

    async _handleLogin(e) {
        e.preventDefault();
        const form = e.currentTarget;
        this._clearErrors(form);
        this._setLoading(form, true);

        try {
            const formData = new FormData(form);
            const res = await fetch('/web/login', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                body: new URLSearchParams(formData),
            });

            if (res.redirected) {
                window.location.href = res.url;
                return;
            }

            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const errorEl = doc.querySelector('.alert-danger');
            this._showError(form, errorEl
                ? errorEl.textContent.trim()
                : _t('Login failed. Please check your credentials.'));
        } catch (err) {
            this._showError(form, _t('Network error. Please try again.'));
        } finally {
            this._setLoading(form, false);
        }
    },

    async _handleSignup(e) {
        e.preventDefault();
        const form = e.currentTarget;
        this._clearErrors(form);

        const password = form.querySelector('input[name="password"]');
        const confirm = form.querySelector('input[name="confirm_password"]');
        if (password && confirm && password.value !== confirm.value) {
            this._showError(form, _t('Passwords do not match.'));
            return;
        }

        this._setLoading(form, true);

        try {
            const formData = new FormData(form);
            const res = await fetch('/web/signup', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                body: new URLSearchParams(formData),
            });

            if (res.redirected) {
                window.location.href = res.url;
                return;
            }

            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const errorEl = doc.querySelector('.alert-danger');
            this._showError(form, errorEl
                ? errorEl.textContent.trim()
                : _t('Signup failed. Please try again.'));
        } catch (err) {
            this._showError(form, _t('Network error. Please try again.'));
        } finally {
            this._setLoading(form, false);
        }
    },
});
