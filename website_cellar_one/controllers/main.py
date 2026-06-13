# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json


class CellarOneController(http.Controller):

    # ─────────────────────────────────────────────
    # Stock availability JSON endpoint
    # Called by stock_badge.js to get live qty
    # GET /cellar/stock/<int:product_id>
    # ─────────────────────────────────────────────
    @http.route('/cellar/stock/<int:product_id>', type='json', auth='public', website=True)
    def get_stock(self, product_id, **kwargs):
        product = request.env['product.product'].sudo().search(
            [('id', '=', product_id), ('website_published', '=', True)],
            limit=1
        )
        if not product:
            return {'status': 'unavailable', 'qty': 0}

        qty = product.qty_available

        if qty <= 0:
            status = 'out_of_stock'
            label = 'Out of Stock'
        elif qty <= 10:
            status = 'low_stock'
            label = f'Only {int(qty)} left'
        else:
            status = 'in_stock'
            label = 'In Stock'

        return {
            'status': status,
            'label': label,
            'qty': qty,
        }

    # ─────────────────────────────────────────────
    # Product rating summary endpoint
    # GET /cellar/rating/<int:product_template_id>
    # ─────────────────────────────────────────────
    @http.route('/cellar/rating/<int:product_template_id>', type='json', auth='public', website=True)
    def get_rating_summary(self, product_template_id, **kwargs):
        Rating = request.env['rating.rating'].sudo()
        ratings = Rating.search([
            ('res_model', '=', 'product.template'),
            ('res_id', '=', product_template_id),
            ('consumed', '=', True),
            ('is_internal', '=', False),
        ])

        if not ratings:
            return {'average': 0, 'count': 0, 'breakdown': {}}

        total = sum(r.rating for r in ratings)
        count = len(ratings)
        average = round(total / count, 1) if count else 0

        # breakdown per star (5 down to 1)
        breakdown = {}
        for star in range(5, 0, -1):
            n = sum(1 for r in ratings if int(r.rating) == star)
            breakdown[star] = {
                'count': n,
                'pct': round((n / count) * 100) if count else 0,
            }

        return {
            'average': average,
            'count': count,
            'breakdown': breakdown,
        }
