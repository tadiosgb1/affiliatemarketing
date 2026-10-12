const bcrypt=require('bcryptjs');const jwt=require('jsonwebtoken');const {Op}=require('sequelize');const {User}=require('../../database/models');function sign(u){return jwt.sign({sub:u.id,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});}function publicUser(u){const x=u.toJSON();x.isAffiliate=true;delete x.passwordHash;return x;}exports.register=async(req,res)=>{const name=req.body.name.trim(),email=req.body.email.trim().toLowerCase(),phone=(req.body.phone||'').trim()||null,password=req.body.password;if(await User.findOne({where:{[Op.or]:[{email},...(phone?[{phone}]:[])]}}))return res.status(409).json({success:false,message:'Email or phone number already registered'});const u=await User.create({name,email,phone,passwordHash:await bcrypt.hash(password,12),role:'customer',isAffiliate:true});res.status(201).json({success:true,data:{user:publicUser(u),token:sign(u)}})};exports.login=async(req,res)=>{const identifier=(req.body.identifier||req.body.email||req.body.phone||'').trim();const where=identifier.includes('@')?{email:identifier.toLowerCase()}:{phone:identifier};const u=await User.findOne({where});if(!u||!u.isActive||!(await bcrypt.compare(req.body.password,u.passwordHash)))return res.status(401).json({success:false,message:'Invalid credentials'});res.json({success:true,data:{user:publicUser(u),token:sign(u)}})};exports.me=async(req,res)=>res.json({success:true,data:{user:publicUser(req.user)}});
exports.listUsers=async(req,res)=>{
  if(req.user.role!=='admin')return res.status(403).json({success:false,message:'Admin access required'});
  const users=await User.findAll({attributes:{exclude:['passwordHash']},order:[['createdAt','DESC']],limit:500});
  res.json({success:true,data:users});
};
exports.updateUser=async(req,res)=>{
  if(req.user.role!=='admin')return res.status(403).json({success:false,message:'Admin access required'});
  const user=await User.findByPk(req.params.id);
  if(!user)return res.status(404).json({success:false,message:'User not found'});
  const allowed=['name','email','phone','role','isActive','isAffiliate'];
  const changes={};
  for(const key of allowed)if(Object.prototype.hasOwnProperty.call(req.body,key))changes[key]=req.body[key];
  if(changes.role&&!['customer','affiliate','company_staff','admin'].includes(changes.role))return res.status(400).json({success:false,message:'Invalid user role'});
  if(changes.name!==undefined&&(!String(changes.name).trim()||String(changes.name).trim().length>120))return res.status(400).json({success:false,message:'Name must contain 1 to 120 characters'});
  if(changes.email!==undefined)changes.email=String(changes.email).trim().toLowerCase();
  if(changes.phone!==undefined)changes.phone=String(changes.phone).trim()||null;
  if(changes.isActive!==undefined)changes.isActive=Boolean(changes.isActive);
  if(changes.isAffiliate!==undefined)changes.isAffiliate=Boolean(changes.isAffiliate);
  if(user.id===req.user.id&&(changes.isActive===false||changes.role&&changes.role!=='admin'))return res.status(400).json({success:false,message:'You cannot deactivate yourself or remove your own administrator role'});
  await user.update(changes);
  res.json({success:true,data:publicUser(user)});
};
