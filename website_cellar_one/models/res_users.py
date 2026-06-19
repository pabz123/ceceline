# -*- coding: utf-8 -*-
from odoo import models, fields


class ResPartner(models.Model):
    _inherit = 'res.partner'

    cellar_otp_code = fields.Char(string='Cellar One OTP Code', copy=False)
    cellar_otp_expiration = fields.Datetime(string='OTP Expiration', copy=False)
