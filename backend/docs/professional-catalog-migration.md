# Professional catalog schema migration

The application currently runs Sequelize on MySQL. The supplied PostgreSQL DDL is used as the design reference, not executed directly.

## Safe rollout

1. Back up the existing database.
2. Deploy this branch's backend code.
3. From the backend directory, run `npm run db:migrate:catalog`.
4. Restart the backend and frontend.
5. Verify product/category listings, variant prices, vehicle catalog endpoints, and warehouse inventory before normal use.

The migration is additive. It adds catalog metadata columns, creates normalized catalog tables, backfills existing product-category links and variant prices, and does not drop tables or remove warehouse, supplier, purchase-order, inventory, order, payment, company, or affiliate records.

## Added catalog capabilities

- Product types: physical, digital, service, vehicle.
- Multiple categories per product while retaining the legacy primary `category_id` field for compatibility.
- Typed, filterable, required product attributes.
- Reusable media assets and product/variant media relationships.
- Currency-aware, time-bounded variant price history.
- Variant package dimensions and units.
- Vehicle makes, models, generations, and product fitments.
- New vehicle catalog endpoints under `/api/v1/vehicle-catalog`.

## Compatibility notes

Existing company scoping and UUID primary keys are intentionally retained because other parts of the application depend on them. Existing `warehouses` remain the stock locations and existing `inventory` / `inventory_movements` remain the operational stock ledger; they are not replaced by the reference schema's `inventory_locations` table. The old product price and single category columns remain available during the transition so current storefront, checkout, and affiliate flows continue to function while the catalog is normalized.

The migration is intended for the repository's MySQL dialect. Do not run the PostgreSQL reference script against this MySQL database.
