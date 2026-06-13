/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  AGE GATE — Shows once per session using sessionStorage
// ─────────────────────────────────────────────────────────────

import { ready } from "@web/core/utils/concurrency";

const AGE_GATE_KEY = 'cellar_one_age_verified';

function initAgeGate() {
    // Already verified this session → skip
    if (sessionStorage.getItem(AGE_GATE_KEY)) return;

    const gate = document.getElementById('co-age-gate');
    if (!gate) return;

    gate.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // prevent scroll behind modal

    const btnYes   = gate.querySelector('.co-age-yes');
    const btnNo    = gate.querySelector('.co-age-no');
    const bodyEl   = gate.querySelector('.co-age-gate__body');
    const deniedEl = gate.querySelector('.co-age-gate__denied');

    if (btnYes) {
        btnYes.addEventListener('click', () => {
            sessionStorage.setItem(AGE_GATE_KEY, '1');
            gate.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    if (btnNo) {
        btnNo.addEventListener('click', () => {
            if (bodyEl)   bodyEl.style.display   = 'none';
            if (deniedEl) deniedEl.style.display = 'block';
            // Redirect away after 2s
            setTimeout(() => {
                window.location.href = 'https://www.drinkaware.co.ug/';
            }, 2000);
        });
    }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initAgeGate);
