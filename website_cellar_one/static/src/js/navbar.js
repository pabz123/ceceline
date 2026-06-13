/** @odoo-module **/
// ─────────────────────────────────────────────────────────────
//  NAVBAR — Scroll-aware class, smooth parallax trigger
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.o_main_navbar, #top');
    const hero   = document.querySelector('.co-hero__bg');

    if (!navbar) return;

    // ── Scroll: add .scrolled class ─────────────────────────
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Toggle scrolled class for bg opacity
                navbar.classList.toggle('scrolled', scrollY > 60);

                // Parallax on hero bg
                if (hero) {
                    const offset = scrollY * 0.35;
                    hero.style.transform = `scale(1.08) translateY(${offset}px)`;
                }

                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Smooth anchor scrolling ──────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const navH = navbar.offsetHeight + 16;
            const top  = target.getBoundingClientRect().top + window.scrollY - navH;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // ── Lazy image loading ───────────────────────────────────
    if ('IntersectionObserver' in window) {
        const imgObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
                        imgObs.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '200px' });

        document.querySelectorAll('img[data-src]').forEach(img => imgObs.observe(img));
    }
});
