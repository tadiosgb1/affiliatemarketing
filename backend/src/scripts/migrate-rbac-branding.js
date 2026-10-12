require('dotenv').config();
const {sequelize,Role,Permission,RolePermission}=require('../database/models');
const {DataTypes}=require('sequelize');
const permissions=[
 ['dashboard.view','View dashboard','workspace'],['users.view','View users','users'],['users.manage','Manage users and access','users'],
 ['catalog.view','View catalog','catalog'],['catalog.manage','Manage products, categories, attributes and variants','catalog'],
 ['inventory.view','View inventory','inventory'],['inventory.manage','Manage stock and warehouses','inventory'],
 ['procurement.view','View procurement','procurement'],['procurement.manage','Manage suppliers and purchase orders','procurement'],
 ['orders.view','View orders','sales'],['orders.manage','Manage orders','sales'],['payments.view','View payments','finance'],
 ['payments.manage','Manage payments','finance'],['finance.view','View financial reports','finance'],['finance.manage','Manage commissions, payouts and finance','finance'],
 ['affiliates.manage','Manage affiliate programs and links','growth'],['company.manage','Manage company and platform branding','settings'],
 ['access.manage','Manage roles and permissions','settings'],['shop.access','Access customer storefront','storefront'],['affiliate.access','Access affiliate portal','affiliate']
];
const roles=[
 ['Administrator','admin','Full platform access',permissions.map(p=>p[0])],
 ['Finance Manager','finance-manager','Finance reports, payments, commissions and payouts',['dashboard.view','finance.view','finance.manage','payments.view','payments.manage','orders.view']],
 ['Accountant','accountant','Read financial reports, orders and payment records',['dashboard.view','finance.view','payments.view','orders.view']],
 ['Warehouse Manager','warehouse-manager','Inventory, warehouses and procurement operations',['dashboard.view','catalog.view','inventory.view','inventory.manage','procurement.view','procurement.manage','orders.view']],
 ['Catalog Manager','catalog-manager','Products, categories, attributes and variants',['dashboard.view','catalog.view','catalog.manage','inventory.view']],
 ['Customer Service','customer-service','Customer accounts and order support',['dashboard.view','users.view','orders.view','orders.manage','payments.view']],
 ['Affiliate Manager','affiliate-manager','Affiliate programs and commissions reporting',['dashboard.view','catalog.view','affiliates.manage','finance.view']],
 ['Customer','customer','Customer storefront access',['shop.access']],['Affiliate','affiliate','Affiliate portal access',['shop.access','affiliate.access']]
];
(async()=>{try{
 await sequelize.authenticate();
 const qi=sequelize.getQueryInterface();
 let companyColumns={};try{companyColumns=await qi.describeTable('company')}catch{}
 if(Object.keys(companyColumns).length){
  if(!companyColumns.platform_name)await qi.addColumn('company','platform_name',{type:DataTypes.STRING(120),allowNull:true});
  if(!companyColumns.tagline)await qi.addColumn('company','tagline',{type:DataTypes.STRING(180),allowNull:true});
  if(!companyColumns.primary_color)await qi.addColumn('company','primary_color',{type:DataTypes.STRING(7),allowNull:false,defaultValue:'#4f46e5'});
 }
 await sequelize.sync();
 const permissionRows={};
 for(const [key,name,module] of permissions){const [row]=await Permission.findOrCreate({where:{key},defaults:{key,name,module}});permissionRows[key]=row;}
 for(const [name,slug,description,keys] of roles){const [role]=await Role.findOrCreate({where:{slug},defaults:{name,slug,description,isSystem:true,isActive:true}});const existing=new Set((await RolePermission.findAll({where:{roleId:role.id}})).map(item=>item.permissionId));const ids=keys.map(key=>permissionRows[key].id).filter(id=>!existing.has(id));if(ids.length)await RolePermission.bulkCreate(ids.map(permissionId=>({roleId:role.id,permissionId})));}
 console.log('RBAC tables and platform branding schema are ready; default roles and permissions seeded.');
 process.exit(0);
}catch(error){console.error('RBAC migration failed:',error);process.exit(1)}})();
