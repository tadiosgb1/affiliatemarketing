# MarketFlow Backend

Company-owned ecommerce and affiliate API. There is no seller marketplace, shop marketplace, or shop-member concept.

## Core catalog
- Company -> categories -> products -> variants
- Brands are first-class records
- Attributes and attribute values are reusable
- Category attributes define which attributes apply to a category and which ones can create variants
- A product stores selected attributes
- A variant stores a concrete combination such as Black + M
- Each variant has its own SKU, price, barcode and cost

## Inventory
- Warehouse is the physical stock location
- Inventory is tracked per variant per warehouse
- Available stock = on-hand minus reserved
- Inventory movements provide an auditable receive/adjust/transfer/sale/return history
- Suppliers and supplier-product pricing are first-class records
- Products are never assigned to sellers or shops

## Example
Men's Cotton T-Shirt
- Category: Men's Clothing
- Attributes: Color, Size
- Variants: Black/S, Black/M, White/S, etc.
- Inventory: each variant can exist in Warehouse A, Warehouse B, etc.

## API
Base path: /api/v1.
Management endpoints: /categories, /attributes, /brands, /products, /product-variants, /warehouses, /suppliers, /supplier-products, /inventory

Run npm run db:sync for development schema synchronization. Production should use migrations rather than alter-sync.

Affiliate marketing remains automatic for every customer account. Manual screenshot payment is the active payment flow; Telebirr remains an integration seam until provider credentials/API behavior are confirmed.
