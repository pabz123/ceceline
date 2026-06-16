# -*- coding: utf-8 -*-
{
    'name': 'Cellar One — Premium Wines & Spirits Theme',
    'version': '17.0.1.0.0',
    'category': 'Theme/eCommerce',
    'summary': 'Custom theme for Cellar One Wines & Spirits eCommerce website',
    'description': """
        A premium, fully-responsive theme for Cellar One Wines & Spirits.

        Features:
        - Luxury e-commerce design system (deep burgundy, gold, off-white)
        - Redesigned product cards with real stock badges
        - Real product ratings and reviews
        - Email verification on signup
        - Custom footer with social links and WhatsApp CTAs
        - Age verification gate
        - Optimised for mobile (375px → 1440px)
    """,
    'author': 'Mulungi Precious Pabire',
    'website': 'https://cecelinewines.com',
    'license': 'LGPL-3',

    'depends': [
        'website',
        'website_sale',
        'mail',
        'stock',
        'auth_signup',
    ],

    'data': [
        'security/ir.model.access.csv',
        'views/website_templates.xml',
        'views/product_templates.xml',
        'views/footer_template.xml',
        'views/homepage.xml',
        'views/auth_templates.xml',
        'views/shop_filters.xml',
        'views/cart_checkout_templates.xml',
        'data/website_data.xml',
        'data/mail_templates.xml',
    ],

    'assets': {
        'web.assets_frontend': [
            # Google Fonts (loaded before everything)
            ('prepend', 'website_cellar_one/static/src/scss/fonts.scss'),
            # Design tokens / CSS variables
            'website_cellar_one/static/src/scss/variables.scss',
            # Base resets and typography
            'website_cellar_one/static/src/scss/base.scss',
            # Component styles
            'website_cellar_one/static/src/scss/navbar.scss',
            'website_cellar_one/static/src/scss/hero.scss',
            'website_cellar_one/static/src/scss/product_cards.scss',
            'website_cellar_one/static/src/scss/product_detail.scss',
            'website_cellar_one/static/src/scss/shop_filters.scss',
            'website_cellar_one/static/src/scss/cart_checkout.scss',
            'website_cellar_one/static/src/scss/ratings.scss',
            'website_cellar_one/static/src/scss/stock_badges.scss',
            'website_cellar_one/static/src/scss/footer.scss',
            'website_cellar_one/static/src/scss/age_gate.scss',
            'website_cellar_one/static/src/scss/auth.scss',
            'website_cellar_one/static/src/scss/responsive.scss',
            # JavaScript
            'website_cellar_one/static/src/js/age_gate.js',
            'website_cellar_one/static/src/js/stock_badge.js',
            'website_cellar_one/static/src/js/ratings.js',
            'website_cellar_one/static/src/js/navbar.js',
        ],
    },

    'installable': True,
    'auto_install': False,
    'application': False,
}
