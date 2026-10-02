const {DataTypes}=require('sequelize');const {sequelize}=require('./index');
const User=require('../modules/user/model')(sequelize,DataTypes),
Company=require('../modules/company/model')(sequelize,DataTypes),
Shop=require('../modules/shop/model')(sequelize,DataTypes),
ShopMember=require('../modules/shopMember/model')(sequelize,DataTypes),
Category=require('../modules/category/model')(sequelize,DataTypes),
Product=require('../modules/product/model')(sequelize,DataTypes),
AffiliateProgram=require('../modules/affiliateProgram/model')(sequelize,DataTypes),
AffiliateLink=require('../modules/affiliateLink/model')(sequelize,DataTypes),
AffiliateClick=require('../modules/affiliateClick/model')(sequelize,DataTypes),
Cart=require('../modules/cart/model')(sequelize,DataTypes),
CartItem=require('../modules/cartItem/model')(sequelize,DataTypes),
Order=require('../modules/order/model')(sequelize,DataTypes),
OrderItem=require('../modules/orderItem/model')(sequelize,DataTypes),
Payment=require('../modules/payment/model')(sequelize,DataTypes),
Commission=require('../modules/commission/model')(sequelize,DataTypes),
Payout=require('../modules/payout/model')(sequelize,DataTypes);

Company.hasMany(Product,{foreignKey:'companyId',as:'products'});Product.belongsTo(Company,{foreignKey:'companyId',as:'company'});
Company.hasMany(AffiliateProgram,{foreignKey:'companyId',as:'affiliatePrograms'});AffiliateProgram.belongsTo(Company,{foreignKey:'companyId',as:'company'});
Company.hasMany(Order,{foreignKey:'companyId',as:'orders'});Order.belongsTo(Company,{foreignKey:'companyId',as:'company'});
User.hasMany(Order,{foreignKey:'userId',as:'orders'});Order.belongsTo(User,{foreignKey:'userId',as:'customer'});Order.hasMany(OrderItem,{foreignKey:'orderId',as:'items'});OrderItem.belongsTo(Order,{foreignKey:'orderId',as:'order'});OrderItem.belongsTo(Product,{foreignKey:'productId',as:'product'});
Category.hasMany(Product,{foreignKey:'categoryId',as:'products'});Product.belongsTo(Category,{foreignKey:'categoryId',as:'category'});
AffiliateProgram.hasMany(AffiliateLink,{foreignKey:'programId',as:'links'});AffiliateLink.belongsTo(AffiliateProgram,{foreignKey:'programId',as:'program'});User.hasMany(AffiliateLink,{foreignKey:'affiliateId',as:'affiliateLinks'});AffiliateLink.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});AffiliateLink.hasMany(AffiliateClick,{foreignKey:'affiliateLinkId',as:'clicks'});AffiliateClick.belongsTo(AffiliateLink,{foreignKey:'affiliateLinkId',as:'affiliateLink'});
User.hasOne(Cart,{foreignKey:'userId',as:'cart'});Cart.belongsTo(User,{foreignKey:'userId',as:'user'});Cart.hasMany(CartItem,{foreignKey:'cartId',as:'items'});CartItem.belongsTo(Cart,{foreignKey:'cartId',as:'cart'});CartItem.belongsTo(Product,{foreignKey:'productId',as:'product'});
AffiliateLink.hasMany(Order,{foreignKey:'affiliateLinkId',as:'orders'});Order.belongsTo(AffiliateLink,{foreignKey:'affiliateLinkId',as:'affiliateLink'});Order.hasMany(Commission,{foreignKey:'orderId',as:'commissions'});Commission.belongsTo(Order,{foreignKey:'orderId',as:'order'});User.hasMany(Commission,{foreignKey:'affiliateId',as:'commissions'});Commission.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});Commission.belongsTo(Company,{foreignKey:'companyId',as:'company'});Commission.belongsTo(AffiliateProgram,{foreignKey:'programId',as:'program'});User.hasMany(Payout,{foreignKey:'affiliateId',as:'payouts'});Payout.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});Commission.belongsTo(Payout,{foreignKey:'payoutId',as:'payout'});
Order.hasOne(Payment,{foreignKey:'orderId',as:'payment'});Payment.belongsTo(Order,{foreignKey:'orderId',as:'order'});User.hasMany(Payment,{foreignKey:'userId',as:'payments'});Payment.belongsTo(User,{foreignKey:'userId',as:'customer'});Payment.belongsTo(User,{foreignKey:'verifiedBy',as:'verifier'});
module.exports={sequelize,User,Company,Shop,ShopMember,Category,Product,AffiliateProgram,AffiliateLink,AffiliateClick,Cart,CartItem,Order,OrderItem,Payment,Commission,Payout};