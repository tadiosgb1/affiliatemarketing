const crypto = require('crypto');
const {
  AffiliateLink,
  AffiliateProgram,
  Product,
} = require('../../database/models');

exports.create = async (req, res, next) => {
  try {
    const program = await AffiliateProgram.findOne({
      where: {
        id: req.body.programId,
        status: 'active',
      },
      include: [{ model: Product, as: 'product' }],
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate program not found',
      });
    }

    const link = await AffiliateLink.create({
      affiliateId: req.user.id,
      programId: program.id,
      code: crypto.randomBytes(7).toString('base64url'),
    });

    const target = program.product
      ? '/products/' + program.product.slug
      : '/';

    return res.status(201).json({
      success: true,
      data: {
        link,
        shareUrl: (process.env.APP_URL || 'http://localhost:5000') + '/r/' + link.code,
        target,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.mine = async (req, res, next) => {
  try {
    const links = await AffiliateLink.findAll({
      where: { affiliateId: req.user.id },
      include: [
        {
          model: AffiliateProgram,
          as: 'program',
          include: [{ model: Product, as: 'product' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listAll = async (req, res) => {
  const links = await AffiliateLink.findAll({
    include: [
      { association: 'affiliate', attributes: ['id', 'name', 'email'] },
      { model: AffiliateProgram, as: 'program', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  return res.json({ success: true, data: links });
};