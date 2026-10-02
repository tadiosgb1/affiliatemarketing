# Affiliate Marketplace Backend

Professional company-owned ecommerce API with native affiliate sharing and commission tracking.

## Stack
Node.js 20+, Express 5, MySQL, Sequelize, JWT, Zod, Helmet and rate limiting.

## Vertical module structure
Every business domain keeps its model, controller and routes together:

modules/product/model.js
modules/product/controller.js
modules/product/routes.js

Shared middleware/utilities are isolated under shared/, while database bootstrapping and associations are under database/.

## Main domains
- Users: one account can shop and participate in affiliate marketing
- Company-owned product catalog
- Categories
- Cart and transactional checkout
- Affiliate programs for the company or a specific product
- Unique affiliate sharing links and click attribution
- Order-level affiliate attribution
- Commission calculation and payout requests

## Affiliate flow
1. Every customer account is automatically eligible for affiliate marketing; there is no separate affiliate account or opt-in step.
2. Any authenticated user can generate a unique link for an active affiliate program.
3. The `/r/:code` endpoint records a privacy-conscious IP hash and redirects to the product or company destination.
4. Checkout accepts `affiliateCode`, storing the link on the order.
5. Once payment is confirmed, an authorized company staff/admin creates the commission from that order.
6. Approved commission balances can be requested as payouts.

## Setup
Create a MySQL database, copy `.env.example` to `.env`, install dependencies, then run:

npm install
npm run db:sync
npm run dev

API base: `/api/v1`.

## Production hardening
Use Sequelize migrations instead of alter-sync, connect a real payment provider webhook, add inventory reservation/expiry, shipping/tax services, object storage for media, email notifications, fraud/abuse controls and background jobs before launch.

## Payment redesign
The system is company-centric: one company owns the catalog and affiliate program. Shops are optional and not required for product management. Manual payment proof is the active flow: customers upload a screenshot, the payment enters verification_pending, and an admin verifies it. A Telebirr payment endpoint is present as an integration seam, but it stays inactive until the company confirms the Telebirr provider credentials/API flow. Production screenshot storage should use private object storage rather than the local uploads directory.
