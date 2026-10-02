const {DataTypes}=require('sequelize'); const {sequelize}=require('./index');
const User=require('../modules/user/model')(sequelize,DataTypes),
Seller=require('../modules/seller/model')(sequelize,DataTypes),
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
Commission=require('../modules/commission/model')(sequelize,DataTypes),
Payout=require('../modules/payout/model')(sequelize,DataTypes);

User.hasOne(Seller,{foreignKey:'userId',as:'sellerProfile'});Seller.belongsTo(User,{foreignKey:'userId',as:'user'});
Seller.hasMany(Shop,{foreignKey:'sellerId',as:'shops'});Shop.belongsTo(Seller,{foreignKey:'sellerId',as:'seller'});
Shop.hasMany(ShopMember,{foreignKey:'shopId',as:'members'});ShopMember.belongsTo(Shop,{foreignKey:'shopId',as:'shop'});
User.hasMany(ShopMember,{foreignKey:'userId',as:'shopMemberships'});ShopMember.belongsTo(User,{foreignKey:'userId',as:'user'});
Shop.hasMany(Product,{foreignKey:'shopId',as:'products'});Product.belongsTo(Shop,{foreignKey:'shopId',as:'shop'});
Category.hasMany(Product,{foreignKey:'categoryId',as:'products'});Product.belongsTo(Category,{foreignKey:'categoryId',as:'category'});
Shop.hasMany(AffiliateProgram,{foreignKey:'shopId',as:'affiliatePrograms'});AffiliateProgram.belongsTo(Shop,{foreignKey:'shopId',as:'shop'});
Product.hasMany(AffiliateProgram,{foreignKey:'productId',as:'affiliatePrograms'});AffiliateProgram.belongsTo(Product,{foreignKey:'productId',as:'product'});
User.hasMany(AffiliateLink,{foreignKey:'affiliateId',as:'affiliateLinks'});AffiliateLink.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});
AffiliateProgram.hasMany(AffiliateLink,{foreignKey:'programId',as:'links'});AffiliateLink.belongsTo(AffiliateProgram,{foreignKey:'programId',as:'program'});
AffiliateLink.hasMany(AffiliateClick,{foreignKey:'affiliateLinkId',as:'clicks'});AffiliateClick.belongsTo(AffiliateLink,{foreignKey:'affiliateLinkId',as:'affiliateLink'});
User.hasOne(Cart,{foreignKey:'userId',as:'cart'});Cart.belongsTo(User,{foreignKey:'userId',as:'user'});Cart.hasMany(CartItem,{foreignKey:'cartId',as:'items'});CartItem.belongsTo(Cart,{foreignKey:'cartId',as:'cart'});CartItem.belongsTo(Product,{foreignKey:'productId',as:'product'});
User.hasMany(Order,{foreignKey:'userId',as:'orders'});Order.belongsTo(User,{foreignKey:'userId',as:'customer'});Shop.hasMany(Order,{foreignKey:'shopId',as:'orders'});Order.belongsTo(Shop,{foreignKey:'shopId',as:'shop'});Order.hasMany(OrderItem,{foreignKey:'orderId',as:'items'});OrderItem.belongsTo(Order,{foreignKey:'orderId',as:'order'});OrderItem.belongsTo(Product,{foreignKey:'productId',as:'product'});
AffiliateLink.hasMany(Order,{foreignKey:'affiliateLinkId',as:'orders'});Order.belongsTo(AffiliateLink,{foreignKey:'affiliateLinkId',as:'affiliateLink'});Order.hasMany(Commission,{foreignKey:'orderId',as:'commissions'});Commission.belongsTo(Order,{foreignKey:'orderId',as:'order'});User.hasMany(Commission,{foreignKey:'affiliateId',as:'commissions'});Commission.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});Commission.belongsTo(Shop,{foreignKey:'shopId',as:'shop'});Commission.belongsTo(AffiliateProgram,{foreignKey:'programId',as:'program'});User.hasMany(Payout,{foreignKey:'affiliateId',as:'payouts'});Payout.belongsTo(User,{foreignKey:'affiliateId',as:'affiliate'});Commission.belongsTo(Payout,{foreignKey:'payoutId',as:'payout'});

module.exports={sequelize,User,Seller,Shop,ShopMember,Category,Product,AffiliateProgram,AffiliateLink,AffiliateClick,Cart,CartItem,Order,OrderItem,Commission,Payout};