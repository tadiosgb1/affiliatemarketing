const {UserRole,RolePermission,UserPermission,Permission,Role}=require('../../database/models');
const {Op}=require('sequelize');
const requirePermission=(key)=>async(req,res,next)=>{
  try{
    const userId=req.user?.id;
    if(!userId)return res.status(401).json({success:false,message:'Authentication required'});
    const override=await UserPermission.findOne({where:{userId},include:[{model:Permission,as:'permission',where:{key}}]});
    if(override?.effect==='deny')return res.status(403).json({success:false,message:'Permission denied'});
    if(override?.effect==='grant')return next();
    const assignments=await UserRole.findAll({where:{userId},include:[{model:Role,as:'role',where:{isActive:true}}]});
    const slugs=assignments.map(item=>item.role?.slug).filter(Boolean);
    const legacy=String(req.user.role||'').toLowerCase();
    if(legacy==='admin'||slugs.includes('admin'))return next();
    if(!assignments.length){
      const legacyMap={company_staff:'catalog.manage',customer:'shop.access',affiliate:'affiliate.access'};
      if(legacy==='company_staff'&&['catalog.view','catalog.manage','inventory.view','inventory.manage','procurement.view','procurement.manage','orders.view','orders.manage','payments.view','finance.view','affiliates.manage','company.manage'].includes(key))return next();
    }
    const roleIds=assignments.map(item=>item.roleId);
    if(roleIds.length){
      const grant=await RolePermission.findOne({where:{roleId:{[Op.in]:roleIds}},include:[{model:Permission,as:'permission',where:{key}}]});
      if(grant)return next();
    }
    return res.status(403).json({success:false,code:'PERMISSION_DENIED',message:'You do not have permission to perform this action.'});
  }catch(error){return next(error)}
};
const requireAnyPermission=(keys)=>async(req,res,next)=>{for(const key of keys){let allowed=false;const middleware=requirePermission(key);await new Promise(resolve=>middleware(req,{status:code=>({json:body=>{if(code===403)resolve();else resolve();return body}})},error=>{if(!error)allowed=true;resolve()}));if(allowed)return next();}return res.status(403).json({success:false,code:'PERMISSION_DENIED',message:'You do not have permission to perform this action.'});};
module.exports={requirePermission,requireAnyPermission};
