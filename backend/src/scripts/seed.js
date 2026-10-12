require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Company, Category, Product, Brand, Attribute, AttributeValue,
  CategoryAttribute, ProductAttributeValue, ProductVariant, ProductVariantOption,
  Warehouse, Supplier, SupplierProduct, Inventory, InventoryMovement,
  PurchaseOrder, PurchaseOrderItem, AffiliateProgram, AffiliateLink, AffiliateClick,
  Cart, CartItem, Order, OrderItem, Payment, Commission, Payout,
} = require('../database/models');
const { slugify } = require('../shared/utils/slug');

async function one(Model, where, defaults) {
  const [record] = await Model.findOrCreate({ where, defaults });
  return record;
}

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
  const passwordHash = await bcrypt.hash(process.env.DEMO_SEED_PASSWORD || '1234', 12);

  // Demo accounts: change the shared demo password before exposing this database publicly.
  const admin = await one(User, { email: 'admin@marketflow.local' }, {
    name: 'MarketFlow Admin', email: 'admin@marketflow.local', phone: '+251911000001',
    passwordHash, role: 'admin', isAffiliate: false, isActive: true,
  });
  const customer = await one(User, { email: 'customer@marketflow.local' }, {
    name: 'Demo Customer', email: 'customer@marketflow.local', phone: '+251911000003',
    passwordHash, role: 'customer', isAffiliate: true, isActive: true,
  });

  // A buyer/customer can also be an affiliate. Merge the old demo affiliate account
  // into the customer account so re-running the seed does not maintain two identities.
  const legacyAffiliate = await User.findOne({ where: { email: 'affiliate@marketflow.local' } });
  if (legacyAffiliate && legacyAffiliate.id !== customer.id) {
    await AffiliateLink.update({ affiliateId: customer.id }, { where: { affiliateId: legacyAffiliate.id } });
    await Commission.update({ affiliateId: customer.id }, { where: { affiliateId: legacyAffiliate.id } });
    await Payout.update({ affiliateId: customer.id }, { where: { affiliateId: legacyAffiliate.id } });
    await legacyAffiliate.destroy();
    console.log('Merged legacy affiliate demo account into customer account.');
  }
  const affiliate = customer;

  const company = await one(Company, { name: 'MarketFlow' }, {
    name: 'MarketFlow', legalName: 'MarketFlow', country: 'Ethiopia',
    city: 'Addis Ababa', status: 'active', email: 'admin@marketflow.local',
    phone: '+251911000010',
  });
  const category = await one(Category, { slug: 'mens-clothing' }, {
    name: "Men's Clothing", slug: 'mens-clothing', description: 'Demo clothing products', isActive: true,
  });
  const brand = await one(Brand, { slug: 'marketflow' }, {
    companyId: company.id, name: 'MarketFlow', slug: 'marketflow', description: 'House brand', isActive: true,
  });

  const attributeDefs = [
    ['Color', 'color', ['Black', 'White', 'Blue']],
    ['Size', 'select', ['S', 'M', 'L', 'XL']],
    ['Material', 'select', ['Cotton', 'Polyester']],
  ];
  const attrs = {};
  const values = {};
  for (const [name, type, labels] of attributeDefs) {
    const slug = slugify(name);
    attrs[name] = await one(Attribute, { slug }, { name, slug, type, isActive: true });
    values[name] = [];
    for (let i = 0; i < labels.length; i++) {
      values[name].push(await one(AttributeValue, { attributeId: attrs[name].id, value: labels[i] }, {
        attributeId: attrs[name].id, value: labels[i], label: labels[i], sortOrder: i, isActive: true,
      }));
    }
  }
  for (const name of ['Color', 'Size', 'Material']) {
    await one(CategoryAttribute, { categoryId: category.id, attributeId: attrs[name].id }, {
      categoryId: category.id, attributeId: attrs[name].id,
      isRequired: name !== 'Material', isVariant: ['Color', 'Size'].includes(name),
    });
  }

  const product = await one(Product, { slug: 'mens-cotton-t-shirt-demo' }, {
    companyId: company.id, categoryId: category.id, brandId: brand.id,
    name: "Men's Cotton T-Shirt", slug: 'mens-cotton-t-shirt-demo',
    description: 'Seeded demo product with color and size variants.',
    sku: 'MCT-BASE', price: 850, currency: 'ETB', status: 'active', affiliateEnabled: true,
    specifications: { material: 'Cotton', fit: 'Regular' },
  });
  const black = values.Color[0];
  const medium = values.Size[1];
  await one(ProductAttributeValue, { productId: product.id, attributeId: attrs.Material.id }, {
    productId: product.id, attributeId: attrs.Material.id, attributeValueId: values.Material[0].id,
  });

  const variants = [];
  for (const color of values.Color) {
    for (const size of values.Size) {
      const sku = 'MCT-' + color.value.slice(0, 2).toUpperCase() + '-' + size.value;
      const variant = await one(ProductVariant, { sku }, {
        productId: product.id, sku, price: 850, costPrice: 500, status: 'active',
      });
      variants.push(variant);
      await one(ProductVariantOption, { variantId: variant.id, attributeId: attrs.Color.id }, {
        variantId: variant.id, attributeId: attrs.Color.id, attributeValueId: color.id,
      });
      await one(ProductVariantOption, { variantId: variant.id, attributeId: attrs.Size.id }, {
        variantId: variant.id, attributeId: attrs.Size.id, attributeValueId: size.id,
      });
    }
  }

  const warehouse = await one(Warehouse, { code: 'MAIN' }, {
    companyId: company.id, code: 'MAIN', name: 'Main Warehouse',
    city: 'Addis Ababa', managerName: 'Warehouse Manager', isActive: true,
  });
  const secondaryWarehouse = await one(Warehouse, { code: 'BOLE' }, {
    companyId: company.id, code: 'BOLE', name: 'Bole Warehouse',
    city: 'Addis Ababa', managerName: 'Bole Manager', isActive: true,
  });
  const supplier = await one(Supplier, { companyId: company.id, name: 'Ethiopia Supply Co.' }, {
    companyId: company.id, name: 'Ethiopia Supply Co.', contactName: 'Purchasing Desk',
    phone: '+251911000020', paymentTerms: 'Net 30', isActive: true,
  });

  for (const variant of variants) {
    const targetWarehouse = variant.sku.startsWith('MCT-BL') ? secondaryWarehouse : warehouse;
    await one(Inventory, { warehouseId: targetWarehouse.id, variantId: variant.id }, {
      warehouseId: targetWarehouse.id, variantId: variant.id,
      quantityOnHand: 20, reservedQuantity: 0, reorderLevel: 5, binLocation: 'A-01',
    });
    await one(SupplierProduct, { supplierId: supplier.id, variantId: variant.id }, {
      supplierId: supplier.id, variantId: variant.id, supplierSku: 'SUP-' + variant.sku,
      costPrice: 500, currency: 'ETB', leadTimeDays: 7, minimumOrderQty: 10, isPrimary: true,
    });
  }

  const movement = await one(InventoryMovement, {
    warehouseId: warehouse.id, variantId: variants[0].id, type: 'receive', note: 'Initial demo stock',
  }, {
    warehouseId: warehouse.id, variantId: variants[0].id, type: 'receive',
    quantity: 20, unitCost: 500, referenceType: 'seed', note: 'Initial demo stock', createdBy: admin.id,
  });

  const purchaseOrder = await one(PurchaseOrder, { orderNumber: 'PO-DEMO-0001' }, {
    companyId: company.id, supplierId: supplier.id, orderNumber: 'PO-DEMO-0001',
    status: 'received', orderedAt: new Date(), expectedAt: new Date(),
    currency: 'ETB', notes: 'Seeded sample purchase order', totalCost: 5000,
  });
  await one(PurchaseOrderItem, { purchaseOrderId: purchaseOrder.id, variantId: variants[0].id }, {
    purchaseOrderId: purchaseOrder.id, variantId: variants[0].id,
    quantityOrdered: 10, quantityReceived: 10, unitCost: 500, supplierSku: 'SUP-' + variants[0].sku,
  });

  const program = await one(AffiliateProgram, { companyId: company.id, name: 'Standard Product Commission' }, {
    companyId: company.id, productId: product.id, name: 'Standard Product Commission',
    commissionType: 'percentage', commissionRate: 5, cookieDays: 30, status: 'active',
  });
  const link = await one(AffiliateLink, { code: 'DEMOAFFILIATE' }, {
    affiliateId: affiliate.id, programId: program.id, code: 'DEMOAFFILIATE',
    clicks: 1, conversions: 1, isActive: true,
  });
  await one(AffiliateClick, { affiliateLinkId: link.id, referrer: 'https://marketflow.local/demo' }, {
    affiliateLinkId: link.id, ipHash: 'demo-ip-hash', userAgent: 'Seeded demo visit',
    referrer: 'https://marketflow.local/demo',
  });

  const cart = await one(Cart, { userId: customer.id }, { userId: customer.id });
  await one(CartItem, { cartId: cart.id, variantId: variants[0].id }, {
    cartId: cart.id, productId: product.id, variantId: variants[0].id, quantity: 1,
  });

  const order = await one(Order, { orderNumber: 'MF-DEMO-0001' }, {
    orderNumber: 'MF-DEMO-0001', userId: customer.id, companyId: company.id,
    affiliateLinkId: link.id, subtotal: 850, shippingAmount: 0, taxAmount: 0, total: 850,
    currency: 'ETB', paymentStatus: 'pending', status: 'pending',
    shippingAddress: { name: customer.name, city: 'Addis Ababa', country: 'Ethiopia', phone: customer.phone },
  });
  await one(OrderItem, { orderId: order.id, variantId: variants[0].id }, {
    orderId: order.id, productId: product.id, variantId: variants[0].id, warehouseId: warehouse.id,
    productName: product.name, sku: variants[0].sku, variantLabel: 'Black / S',
    quantity: 1, unitPrice: 850, lineTotal: 850,
  });
  await one(Payment, { orderId: order.id }, {
    orderId: order.id, userId: customer.id, method: 'manual_screenshot',
    status: 'pending', amount: 850, currency: 'ETB', transactionReference: 'DEMO-TXN-0001',
  });
  const commission = await one(Commission, { orderId: order.id }, {
    orderId: order.id, affiliateId: affiliate.id, companyId: company.id, programId: program.id,
    baseAmount: 850, rate: 5, amount: 42.5, status: 'pending',
  });
  await one(Payout, { affiliateId: affiliate.id, amount: 42.5 }, {
    affiliateId: affiliate.id, amount: 42.5, method: 'mobile_money',
    destination: { provider: 'Demo Telebirr', account: '+251911000002' }, status: 'requested',
  });

  console.log('Seed complete: demo users and records for all 28 backend models.');
  console.log('Demo accounts: admin@marketflow.local, customer@marketflow.local (customer can also be an affiliate).');
  console.log('Shared demo password: ' + (process.env.DEMO_SEED_PASSWORD || 'DemoPass123!'));
  await sequelize.close();
})().catch(async error => {
  console.error('Seed failed:', error);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
