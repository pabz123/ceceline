# -*- coding: utf-8 -*-
from odoo import http, _
from odoo.http import request
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.exceptions import UserError
import werkzeug
import json
import logging


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

    # ─────────────────────────────────────────────
    # Submit review and rating endpoint
    # POST /shop/product/rate (JSON-RPC)
    # ─────────────────────────────────────────────
    @http.route('/shop/product/rate', type='json', auth='public', website=True)
    def rate_product(self, product_template_id, rating, description, **kwargs):
        product_tmpl = request.env['product.template'].sudo().browse(product_template_id)
        if not product_tmpl.exists():
            return {'error': 'Product not found.'}

        rating_val = int(rating)
        if rating_val < 1 or rating_val > 5:
            return {'error': 'Invalid rating. Must be between 1 and 5.'}

        partner = request.env.user.partner_id

        # Create rating.rating record
        model_id = request.env['ir.model'].sudo()._get('product.template').id
        rating_record = request.env['rating.rating'].sudo().create({
            'res_model_id': model_id,
            'res_model': 'product.template',
            'res_id': product_tmpl.id,
            'partner_id': partner.id,
            'rating': rating_val,
            'feedback': description,
            'consumed': True,
        })

        # Post message to chatter associated with the template to store the comment text
        product_tmpl.sudo().message_post(
            author_id=partner.id,
            body=description,
            message_type='comment',
            subtype_xmlid='mail.mt_comment',
            rating_id=rating_record.id,
        )

        return {'success': True}


_logger = logging.getLogger(__name__)

class CellarOneAuthSignupHome(AuthSignupHome):

    @http.route('/web/signup', type='http', auth='public', website=True, sitemap=False)
    def web_auth_signup(self, *args, **kw):
        qcontext = self.get_auth_signup_qcontext()

        if not qcontext.get('token') and not qcontext.get('signup_enabled'):
            raise werkzeug.exceptions.NotFound()

        if 'error' not in qcontext and request.httprequest.method == 'POST':
            try:
                if not request.env['ir.http']._verify_request_recaptcha_token('signup'):
                    raise UserError(_("Suspicious activity detected by Google reCaptcha."))

                self.do_signup(qcontext)

                # Fetch the created user
                User = request.env['res.users']
                user_sudo = User.sudo().search(
                    User._get_login_domain(qcontext.get('login')), order=User._get_login_order(), limit=1
                )
                
                if user_sudo:
                    # Deactivate user until verified
                    user_sudo.write({'active': False})
                    
                    # Log them out from the auto-authenticated session
                    request.session.logout()
                    
                    # Generate signup token
                    user_sudo.partner_id.sudo().signup_prepare(signup_type="signup")
                    
                    # Send verification mail
                    template = request.env.ref('website_cellar_one.mail_template_email_verification', raise_if_not_found=False)
                    if template:
                        # Construct verification URL
                        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
                        verify_url = f"{base_url}/web/signup/verify?token={user_sudo.partner_id.signup_token}"
                        template.sudo().with_context(token_url=verify_url).send_mail(user_sudo.id, force_send=True)
                    
                    # Redirect to email pending confirmation page
                    return request.redirect('/email_confirm_pending')
                
            except UserError as e:
                qcontext['error'] = e.args[0]
            except Exception as e:
                if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
                    qcontext["error"] = _("Another user is already registered using this email address.")
                else:
                    _logger.warning("%s", e)
                    qcontext['error'] = _("Could not create a new account.") + "\n" + str(e)
                    
        response = request.render('auth_signup.signup', qcontext)
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'self'"
        return response

    @http.route('/email_confirm_pending', type='http', auth='public', website=True)
    def email_confirm_pending(self, **kwargs):
        return request.render('website_cellar_one.email_confirm_pending')

    @http.route('/web/signup/verify', type='http', auth='public', website=True)
    def web_signup_verify(self, token, **kwargs):
        partner = request.env['res.partner'].sudo().search([('signup_token', '=', token)], limit=1)
        if not partner or not partner.signup_valid:
            return request.render('website.layout', {
                'wrapwrap': True,
                'error': _("The verification link is invalid or has expired.")
            })
            
        user = request.env['res.users'].sudo().search([('partner_id', '=', partner.id)], limit=1)
        if not user:
            return request.render('website.layout', {
                'wrapwrap': True,
                'error': _("User not found.")
            })
            
        # Activate user
        user.write({'active': True})
        
        # Clear token
        partner.write({
            'signup_token': False,
            'signup_type': False,
            'signup_expiration': False
        })
        
        # Log user in
        request.session.uid = user.id
        request.session.login = user.login
        request.session.modified = True
        request.update_env(user=user)
        
        # Redirect to email verified success page
        return request.redirect('/email_verified_success')

    @http.route('/email_verified_success', type='http', auth='public', website=True)
    def email_verified_success(self, **kwargs):
        return request.render('website_cellar_one.email_verified_success')

