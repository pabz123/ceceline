# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # ─────────────────────────────────────────────
    # Beverage-specific fields
    # ─────────────────────────────────────────────
    cellar_volume = fields.Char(
        string='Volume',
        help='e.g. 750ml, 1.5L, 5L'
    )
    cellar_alcohol_pct = fields.Float(
        string='Alcohol %',
        digits=(5, 1),
    )
    cellar_country_of_origin = fields.Char(
        string='Country of Origin',
    )
    cellar_grape_variety = fields.Char(
        string='Grape / Grain Variety',
        help='e.g. Cabernet Sauvignon, Blend, Malt'
    )
    cellar_serving_suggestion = fields.Text(
        string='Serving Suggestion',
    )
    cellar_food_pairing = fields.Text(
        string='Food Pairing',
    )
    cellar_is_best_seller = fields.Boolean(
        string='Best Seller',
        default=False,
    )
    cellar_is_new_arrival = fields.Boolean(
        string='New Arrival',
        default=False,
    )

    # ─────────────────────────────────────────────
    # Computed stock status (used in QWeb templates)
    # ─────────────────────────────────────────────
    cellar_stock_status = fields.Selection(
        selection=[
            ('in_stock', 'In Stock'),
            ('low_stock', 'Low Stock'),
            ('out_of_stock', 'Out of Stock'),
        ],
        string='Stock Status',
        compute='_compute_cellar_stock_status',
        store=False,
    )

    cellar_stock_label = fields.Char(
        string='Stock Label',
        compute='_compute_cellar_stock_status',
        store=False,
    )

    @api.depends('qty_available')
    def _compute_cellar_stock_status(self):
        for product in self:
            qty = product.qty_available
            if qty <= 0:
                product.cellar_stock_status = 'out_of_stock'
                product.cellar_stock_label = 'Out of Stock'
            elif qty <= 10:
                product.cellar_stock_status = 'low_stock'
                product.cellar_stock_label = f'Only {int(qty)} left'
            else:
                product.cellar_stock_status = 'in_stock'
                product.cellar_stock_label = 'In Stock'
