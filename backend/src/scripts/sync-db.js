require('dotenv').config();
const {sequelize,Role,Permission,RolePermission}=require('../database/models');
const permissionSeeds=[
 ['dashboard.view','View dashboard','workspace'],
 ['users.view','View users','users'],['users.manage','Manage users and access','users'],
 ['catalog.view','View catalog','catalog'],['catalog.manage','Manage products, categories, attributes and variants','catalog'],
 ['inventory.view','View inventory','inventory'],['inventory.manage','Manage stock and warehouses','inventory'],
 ['procurement.view','View procurement','procurement'],['procurement.manage','Manage suppliers and purchase orders','procurement'],
 ['orders.view','View orders','sales'],['orders.manage','Manage orders','sales'],
 ['payments.view','View payments','finance'],['payments.manage','Manage payments','finance'],
 ['finance.view','View financial reports','finance'],['finance.manage','Manage commissions, payouts and finance','finance'],
 ['affiliates.manage','Manage affiliate programs and links','growth'],
 ['company.manage','Manage company and platform branding','settings'],
 ['access.manage','Manage roles and permissions','settings'],
 ['shop.access','Access customer storefront','storefront'],['affiliate.access','Access affiliate portal','affiliate']
];
const roleSeeds=[
 {name:'Administrator',slug:'admin',description:'Full platform access',system:true,permissions:permissionSeeds.map(p=>p[0])},
 {name:'Finance Manager',slug:'finance-manager',description:'Finance reports, payments, commissions and payouts',system:true,permissions:['dashboard.view','finance.view','finance.manage','payments.view','payments.manage','orders.view']},
 {name:'Accountant',slug:'accountant',description:'Read financial reports, orders and payment records',system:true,permissions:['dashboard.view','finance.view','payments.view','orders.view']},
 {name:'Warehouse Manager',slug:'warehouse-manager',description:'Inventory, warehouses and procurement operations',system:true,permissions:['dashboard.view','catalog.view','inventory.view','inventory.manage','procurement.view','procurement.manage','orders.view']},
 {name:'Catalog Manager',slug:'catalog-manager',description:'Products, categories, attributes and variants',system:true,permissions:['dashboard.view','catalog.view','catalog.manage','inventory.view']},
 {name:'Customer Service',slug:'customer-service',description:'Customer accounts and order support',system:true,permissions:['dashboard.view','users.view','orders.view','orders.manage','payments.view']},
 {name:'Affiliate Manager',slug:'affiliate-manager',description:'Affiliate programs and commissions reporting',system:true,permissions:['dashboard.view','catalog.view','affiliates.manage','finance.view']},
 {name:'Customer',slug:'customer',description:'Customer storefront access',system:true,permissions:['shop.access']},
 {name:'Affiliate',slug:'affiliate',description:'Affiliate portal access',system:true,permissions:['shop.access','affiliate.access']}
];
(async()=>{try{
 await sequelize.sync({alter:process.env.NODE_ENV!=='production'});
 const permissions={};
 for(const [key,name,module] of permissionSeeds){const [row]=await Permission.findOrCreate({where:{key},defaults:{key,name,module}});permissions[key]=row;}
 for(const seed of roleSeeds){const [role]=await Role.findOrCreate({where:{slug:seed.slug},defaults:{name:seed.name,slug:seed.slug,description:seed.description,isSystem:seed.system,isActive:true}});if(role.name!==seed.name||role.description!==seed.description)await role.update({name:seed.name,description:seed.description});const wanted=seed.permissions.map(key=>permissions[key].id);const existing=await RolePermission.findAll({where:{roleId:role.id}});const existingIds=new Set(existing.map(row=>row.permissionId));const missing=wanted.filter(id=>!existingIds.has(id));if(missing.length)await RolePermission.bulkCreate(missing.map(permissionId=>({roleId:role.id,permissionId})));if(seed.slug==='admin'){const all=Object.values(permissions).map(p=>p.id);const present=new Set((await RolePermission.findAll({where:{roleId:role.id}})).map(p=>p.permissionId));const extra=all.filter(id=>!present.has(id));if(extra.length)await RolePermission.bulkCreate(extra.map(permissionId=>({roleId:role.id,permissionId})));}}
 console.log('Database schema synchronized; default roles and permissions seeded');process.exit(0);
}catch(e){console.error(e);process.exit(1);}})();
