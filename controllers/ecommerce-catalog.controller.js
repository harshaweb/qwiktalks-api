import axios from 'axios';
import { EcommerceCatalog, EcommerceProduct, WhatsappWaba } from '../models/index.js';
import * as funnelService from '../services/funnel.service.js';
import aisensyService from '../aisency/aisensy.service.js';
import {
  getWABACatalogsFromAPI,
  linkCatalogToWABAFromAPI,
  unlinkCatalogFromWABAFromAPI,
  getProductsFromCatalogFromAPI,
  createProductInCatalogFromAPI,
  updateProductInCatalogFromAPI,
  deleteProductFromCatalogFromAPI,
  syncCatalogWithDatabase,
  syncProductWithDatabase,
  getCatalogProductCount
} from '../utils/ecommerce-catalog-service.js';
import mongoose  from 'mongoose';
const API_VERSION = 'v20.0';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT_FIELD = 'created_at';
const DEFAULT_SORT_ORDER = -1;

const ALLOWED_SORT_FIELDS = [
  '_id',
  'name',
  'price',
  'created_at',
  'updated_at'
];

const SORT_ORDER = {
  ASC: 1,
  DESC: -1
};

const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.max(1, Math.min(MAX_LIMIT, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const parseSortParams = (query) => {
  const sortField = ALLOWED_SORT_FIELDS.includes(query.sort_by)
    ? query.sort_by
    : DEFAULT_SORT_FIELD;

  const sortOrder = query.sort_order?.toUpperCase() === 'ASC'
    ? SORT_ORDER.ASC
    : SORT_ORDER.DESC;

  return { sortField, sortOrder };
};

const buildSearchQuery = (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return {};
  }

  const sanitizedSearch = searchTerm.trim();

  return {
    $or: [
      { name: { $regex: sanitizedSearch, $options: 'i' } },
      { description: { $regex: sanitizedSearch, $options: 'i' } },
      { retailer_id: { $regex: sanitizedSearch, $options: 'i' } }
    ]
  };
};


export const syncWABACatalogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { waba_id } = req.params;

    const waba = await WhatsappWaba.findOne({
      _id: waba_id,
      user_id: userId,
      deleted_at: null
    });

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found or does not belong to user'
      });
    }

    let catalogs = [];
    let syncSource = 'facebook';

    try {
      const response = await getWABACatalogsFromAPI(waba.business_id, waba.access_token);
      catalogs = response.data || [];
    } catch (facebookError) {
      const errorMsg = facebookError.response?.data?.error?.message || facebookError.message || '';
      const statusCode = facebookError.response?.status;
      const isPermissionError = statusCode === 403 || statusCode === 401 ||
        errorMsg.includes('(#10)') ||
        errorMsg.includes('(#200)') ||
        errorMsg.toLowerCase().includes('permission') ||
        errorMsg.toLowerCase().includes('access denied') ||
        errorMsg.toLowerCase().includes('necessary permissions') ||
        errorMsg.includes('OAuthException');

      if (isPermissionError) {
        console.log('[Catalog Sync] Facebook API permission error, falling back to AiSensy:', errorMsg);
        syncSource = 'aisensy';

        const aisensyResult = await aisensyService.getCatalog();
        const catalogData = aisensyResult.catalogs || aisensyResult.catalog || aisensyResult.data?.catalogs || aisensyResult.data?.catalog || [];
        const aisensyCatalogs = Array.isArray(catalogData) ? catalogData : (catalogData ? [catalogData] : []);

        catalogs = aisensyCatalogs.map(c => ({
          id: c.id,
          name: c.name,
          product_count: c.product_count || 0,
          feed_count: c.feed_count || 0,
          default_image_url: c.default_image_url || '',
          is_catalog_segment: c.is_catalog_segment || false,
          vertical: c.vertical || 'commerce',
          business: c.business,
          da_display_settings: c.da_display_settings,
          source: 'aisensy'
        }));
      } else {
        throw facebookError;
      }
    }

    for (const catalogData of catalogs) {
      let productCount = catalogData.product_count || 0;
      if (syncSource === 'facebook') {
        productCount = await getCatalogProductCount(catalogData.id, waba.access_token);
      }

      await syncCatalogWithDatabase(catalogData.id, waba_id, userId, {
        ...catalogData,
        product_count: productCount
      });
    }

    return res.json({
      success: true,
      message: `Successfully synced ${catalogs.length} catalogs from ${syncSource}`,
      data: {
        synced_count: catalogs.length,
        catalogs: catalogs
      }
    });
  } catch (error) {
    console.error('Error syncing WABA catalogs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync catalogs',
      details: error.response?.data || error.message
    });
  }
};

export const getWABACatalogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { waba_id } = req.params;

    const waba = await WhatsappWaba.findOne({
      _id: waba_id,
      user_id: userId,
      deleted_at: null
    });

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found or does not belong to user'
      });
    }

    let catalogs = await EcommerceCatalog.find({
      user_id: userId,
      waba_id: waba_id,
      deleted_at: null
    }).lean();

    // If no catalogs in DB, try to sync from AiSensy (Facebook likely has permission issues)
    if (catalogs.length === 0) {
      try {
        console.log('[getWABACatalogs] No catalogs in DB, trying AiSensy sync');
        const aisensyResult = await aisensyService.getCatalog();
        const catalogData = aisensyResult.catalogs || aisensyResult.catalog || aisensyResult.data?.catalogs || aisensyResult.data?.catalog || [];
        const aisensyCatalogs = Array.isArray(catalogData) ? catalogData : (catalogData ? [catalogData] : []);

        for (const c of aisensyCatalogs) {
          await syncCatalogWithDatabase(c.id, waba_id, userId, {
            id: c.id,
            name: c.name,
            product_count: c.product_count || 0,
            feed_count: c.feed_count || 0,
            default_image_url: c.default_image_url || '',
            is_catalog_segment: c.is_catalog_segment || false,
            vertical: c.vertical || 'commerce',
            business: c.business,
            da_display_settings: c.da_display_settings,
            source: 'aisensy'
          });
        }

        // Re-fetch from DB after sync
        catalogs = await EcommerceCatalog.find({
          user_id: userId,
          waba_id: waba_id,
          deleted_at: null
        }).lean();
        console.log('[getWABACatalogs] Synced', catalogs.length, 'catalogs from AiSensy');
      } catch (syncError) {
        console.error('[getWABACatalogs] AiSensy sync failed:', syncError.message);
      }
    }

    const catalogsPopulatedWithCounts = await Promise.all(
      catalogs.map(async (catalog) => {
        const productCount = await EcommerceProduct.countDocuments({
          catalog_id: catalog._id,
          deleted_at: null
        });

        return {
          ...catalog,
          product_count: productCount
        };
      })
    );

    return res.json({
      success: true,
      data: {
        data: catalogsPopulatedWithCounts
      }
    });
  } catch (error) {
    console.error('Error getting WABA catalogs from database:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get catalogs',
      details: error.message
    });
  }
};


export const linkCatalogToWABA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { waba_id, catalog_id } = req.body;

    if (!waba_id || !catalog_id) {
      return res.status(400).json({
        success: false,
        error: 'WABA ID and Catalog ID are required'
      });
    }

    const waba = await WhatsappWaba.findOne({
      _id: waba_id,
      user_id: userId,
      deleted_at: null
    });

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found or does not belong to user'
      });
    }

    const existingLinkedCatalogs = await EcommerceCatalog.find({
      user_id: userId,
      waba_id: waba_id,
      is_linked: true,
      deleted_at: null
    });

    for (const existing of existingLinkedCatalogs) {
      try {
        await unlinkCatalogFromWABAFromAPI(
          waba.whatsapp_business_account_id,
          existing.catalog_id,
          waba.access_token
        );
      } catch (unlinkError) {
        console.error('Error unlinking existing catalog from WABA:', unlinkError.response?.data || unlinkError.message);
      }

      existing.is_linked = false;
      await existing.save();
    }
    const linkedCatalog = await EcommerceCatalog.findById(catalog_id);

  console.log("linkedCatalog", linkedCatalog.catalog_id);
    const response = await linkCatalogToWABAFromAPI(
      waba.whatsapp_business_account_id,
      linkedCatalog.catalog_id,
      waba.access_token
    );

    const catalogDetailsUrl = `https://graph.facebook.com/${API_VERSION}/${linkedCatalog.catalog_id}`;
    const catalogDetailsResponse = await axios.get(catalogDetailsUrl, {
      headers: {
        'Authorization': `Bearer ${waba.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const catalog = await syncCatalogWithDatabase(linkedCatalog.catalog_id, waba_id, userId, catalogDetailsResponse.data);

    catalog.is_linked = true;
    await catalog.save();

    return res.json({
      success: true,
      message: 'Catalog linked to WABA successfully',
      data: {
        catalog_id: catalog_id,
        catalog_db_id: catalog._id,
        response: response
      }
    });
  } catch (error) {
    console.error('Error linking catalog to WABA:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to link catalog to WABA',
      message: error.response?.data.error.error_user_msg || error.message,
      details: error.response?.data.error  || error.message
    });
  }
};


export const getLinkedCatalogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { waba_id } = req.params;

    const { page, limit, skip } = parsePaginationParams(req.query);
    const { sortField, sortOrder } = parseSortParams(req.query);
    const searchTerm = req.query.search || '';
    const searchQuery = buildSearchQuery(searchTerm);

    const waba = await WhatsappWaba.findOne({
      _id: waba_id,
      user_id: userId,
      deleted_at: null
    });

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found or does not belong to user'
      });
    }

    let baseFilter = {
      user_id: userId,
      waba_id: waba_id,
      is_linked: true,
      deleted_at: null
    };

    let combinedFilter = { ...baseFilter, ...searchQuery };
    let totalCount = await EcommerceCatalog.countDocuments(combinedFilter);

    // If no linked catalogs in DB, try to sync from AiSensy and mark as linked
    if (totalCount === 0) {
      try {
        console.log('[getLinkedCatalogs] No linked catalogs in DB, trying AiSensy sync');
        const aisensyResult = await aisensyService.getCatalog();
        const catalogData = aisensyResult.catalogs || aisensyResult.catalog || aisensyResult.data?.catalogs || aisensyResult.data?.catalog || [];
        const aisensyCatalogs = Array.isArray(catalogData) ? catalogData : (catalogData ? [catalogData] : []);

        for (const c of aisensyCatalogs) {
          const existing = await EcommerceCatalog.findOne({ catalog_id: c.id, user_id: userId });
          if (!existing) {
            await EcommerceCatalog.create({
              user_id: userId,
              waba_id: waba_id,
              catalog_id: c.id,
              name: c.name,
              currency: 'USD',
              country: 'US',
              is_linked: true,
              is_active: true,
              meta_data: c
            });
          } else if (!existing.is_linked) {
            existing.is_linked = true;
            await existing.save();
          }
        }

        totalCount = await EcommerceCatalog.countDocuments(combinedFilter);
        console.log('[getLinkedCatalogs] Synced', totalCount, 'linked catalogs from AiSensy');
      } catch (syncError) {
        console.error('[getLinkedCatalogs] AiSensy sync failed:', syncError.message);
      }
    }

    const catalogs = await EcommerceCatalog.find(combinedFilter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const catalogsPopulatedWithCounts = await Promise.all(
      catalogs.map(async (catalog) => {
        const productCount = await EcommerceProduct.countDocuments({
          catalog_id: catalog._id,
          deleted_at: null
        });

        return {
          ...catalog,
          product_count: productCount
        };
      })
    );

    return res.json({
      success: true,
      data: {
        catalogs: catalogsPopulatedWithCounts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error getting linked catalogs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get linked catalogs',
      details: error.message
    });
  }
};


export const getProductsFromCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { catalog_id } = req.params;

    const { page, limit, skip } = parsePaginationParams(req.query);
    const searchTerm = req.query.search || '';
    const searchQuery = buildSearchQuery(searchTerm);

    const catalog = await EcommerceCatalog.findOne({
      _id: catalog_id,
      user_id: userId,
      deleted_at: null
    });

    if (!catalog) {
      return res.status(404).json({ success: false, error: 'Catalog not found or does not belong to user' });
    }

    // Fetch from AiSensy via aisency-api and sync to DB
    try {
      console.log(`[getProductsFromCatalog] Syncing from AiSensy for catalog: ${catalog.catalog_id}`);
      const aisensyResult = await aisensyService.getProducts(catalog.catalog_id);
      const aisensyProducts = aisensyResult.products || [];

      for (const product of aisensyProducts) {
        await syncProductWithDatabase({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          sale_price: product.sale_price || 0,
          currency: product.currency || 'INR',
          availability: product.availability || 'in stock',
          condition: product.condition || 'new',
          image_url: product.image_url || '',
          url: product.url || '',
          brand: product.brand || '',
          category: product.category || '',
          retailer_id: product.retailer_id || product.id,
          retailer_product_group_id: null
        }, catalog._id, userId);
      }
      console.log(`[getProductsFromCatalog] Synced ${aisensyProducts.length} products`);
    } catch (syncError) {
      console.error('[getProductsFromCatalog] AiSensy sync failed:', syncError.message);
    }

    const dbFilter = {
      user_id: userId,
      catalog_id: catalog._id,
      deleted_at: null,
      ...searchQuery
    };

    const totalDbCount = await EcommerceProduct.countDocuments(dbFilter);
    const products = await EcommerceProduct.find(dbFilter)
      .select('-meta_data')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDbCount / limit),
          totalItems: totalDbCount,
          total: totalDbCount,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting products from catalog:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get products from catalog',
      message: error.message,
      details: error.response?.data || error.message
    });
  }
};


export const createProductInCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { catalog_id } = req.params;
    const productData = req.body;

    const catalog = await EcommerceCatalog.findOne({
      _id: catalog_id,
      user_id: userId,
      deleted_at: null
    });

    if (!catalog) {
      return res.status(404).json({ success: false, error: 'Catalog not found or does not belong to user' });
    }

    if (!productData.retailer_id) {
      return res.status(400).json({ success: false, error: 'retailer_id is required for the product' });
    }

    const resolvedImageUrl = productData.image_url ||
      (Array.isArray(productData.image_urls) ? productData.image_urls.find(u => u?.trim()) : null) || '';

    if (!resolvedImageUrl) {
      return res.status(400).json({ success: false, error: 'image_url is required for the product' });
    }

    // Delegate to aisency-api
    const aisensyPayload = {
      catalogId: catalog.catalog_id,
      name: productData.name,
      category: productData.category || '',
      currency: productData.currency || 'INR',
      image_url: resolvedImageUrl,
      price: String(productData.price),
      retailer_id: productData.retailer_id,
      description: productData.description || '',
      url: productData.url || '',
      brand: productData.brand || '',
      ...(productData.sale_price && { sale_price: String(productData.sale_price) }),
      ...(productData.sale_price_start_date && { sale_price_start_date: productData.sale_price_start_date }),
      ...(productData.sale_price_end_date && { sale_price_end_date: productData.sale_price_end_date })
    };

    const aisensyResponse = await aisensyService.createProduct(aisensyPayload);
    const externalProductId = aisensyResponse.product?.id || aisensyResponse.id;
    console.log(`[createProductInCatalog] Product created via AiSensy, id: ${externalProductId}`);

    const newProduct = await EcommerceProduct.create({
      user_id: userId,
      catalog_id: catalog._id,
      product_external_id: externalProductId,
      name: productData.name || '',
      description: productData.description || '',
      price: parseFloat(productData.price) || 0,
      sale_price: productData.sale_price || 0,
      currency: productData.currency || 'INR',
      availability: productData.availability || 'in stock',
      condition: productData.condition || 'new',
      image_urls: [resolvedImageUrl, ...(Array.isArray(productData.image_urls) ? productData.image_urls.filter(u => u?.trim() && u !== resolvedImageUrl) : [])],
      url: productData.url || '',
      category: productData.category || '',
      brand: productData.brand || '',
      retailer_id: productData.retailer_id,
      additional_variant_attributes: productData.additional_variant_attributes || {},
      meta_data: productData
    });

    return res.json({
      success: true,
      message: 'Product created successfully',
      data: {
        product_id: externalProductId,
        product_db_id: newProduct._id
      }
    });
  } catch (error) {
    console.error('Error creating product in catalog:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create product in catalog',
      message: error.message,
      details: error.data || error.message
    });
  }
};


export const getUserCatalogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const { page, limit, skip } = parsePaginationParams(req.query);
    const { sortField, sortOrder } = parseSortParams(req.query);
    const searchTerm = req.query.search || '';
    const searchQuery = buildSearchQuery(searchTerm);

    const baseFilter = {
      user_id: userId,
      deleted_at: null
    };

    const combinedFilter = { ...baseFilter, ...searchQuery };

    let totalCount = await EcommerceCatalog.countDocuments(combinedFilter);

    // If no catalogs in DB, try to sync from AiSensy
    if (totalCount === 0) {
      try {
        console.log('[getUserCatalogs] No catalogs in DB, trying AiSensy sync');
        const aisensyResult = await aisensyService.getCatalog();
        const catalogData = aisensyResult.catalogs || aisensyResult.catalog || aisensyResult.data?.catalogs || aisensyResult.data?.catalog || [];
        const aisensyCatalogs = Array.isArray(catalogData) ? catalogData : (catalogData ? [catalogData] : []);

        const waba = await WhatsappWaba.findOne({ user_id: userId, deleted_at: null }).select('_id').lean();
        const wabaId = waba?._id;

        for (const c of aisensyCatalogs) {
          const existing = await EcommerceCatalog.findOne({ catalog_id: c.id, user_id: userId });
          if (!existing) {
            await EcommerceCatalog.create({
              user_id: userId,
              waba_id: wabaId || null,
              catalog_id: c.id,
              name: c.name,
              currency: 'USD',
              country: 'US',
              is_linked: true,
              is_active: true,
              meta_data: c
            });
          }
        }

        totalCount = await EcommerceCatalog.countDocuments(combinedFilter);
        console.log('[getUserCatalogs] Synced', totalCount, 'catalogs from AiSensy');
      } catch (syncError) {
        console.error('[getUserCatalogs] AiSensy sync failed:', syncError.message);
      }
    }

    const catalogs = await EcommerceCatalog.find(combinedFilter)
      .populate('waba_id', 'name whatsapp_business_account_id')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const catalogsPopulatedWithCounts = await Promise.all(
      catalogs.map(async (catalog) => {
        const productCount = await EcommerceProduct.countDocuments({
          catalog_id: catalog._id,
          deleted_at: null
        });

        return {
          ...catalog,
          product_count: productCount
        };
      })
    );

    return res.json({
      success: true,
      data: {
        catalogs: catalogsPopulatedWithCounts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error getting user catalogs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user catalogs',
      details: error.message
    });
  }
};


export const getUserProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { catalog_id } = req.query;

    const { page, limit, skip } = parsePaginationParams(req.query);
    const { sortField, sortOrder } = parseSortParams(req.query);
    const searchTerm = req.query.search || '';
    const searchQuery = buildSearchQuery(searchTerm);

    const baseFilter = {
      user_id: userId,
      deleted_at: null
    };

    if (catalog_id) {
      baseFilter.catalog_id = catalog_id;
    }

    const combinedFilter = { ...baseFilter, ...searchQuery };

    const totalCount = await EcommerceProduct.countDocuments(combinedFilter);

    const products = await EcommerceProduct.find(combinedFilter)
      .populate('catalog_id', 'name catalog_id')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Error getting user products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user products',
      details: error.message
    });
  }
};


export const deleteProductFromCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, catalog_id } = req.params;

    const catalog = await EcommerceCatalog.findOne({
      _id: catalog_id,
      user_id: userId,
      deleted_at: null
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        error: 'Catalog not found or does not belong to user'
      });
    }

    const waba = await WhatsappWaba.findById(catalog.waba_id);

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found'
      });
    }

    const response = await deleteProductFromCatalogFromAPI(product_id, waba.access_token);

    const product = await EcommerceProduct.findOne({
      product_external_id: product_id,
      user_id: userId,
      catalog_id: catalog._id,
      deleted_at: null
    });

    if (product) {
      product.deleted_at = new Date();
      await product.save();
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
      data: response
    });
  } catch (error) {
    console.error('Error deleting product from catalog:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete product from catalog',
      message: error.response?.data.error.error_user_msg || error.message,
      details: error.response?.data || error.message
    });
  }
};


export const updateProductInCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, catalog_id } = req.params;
    const productData = req.body;

    const catalog = await EcommerceCatalog.findOne({
      _id: catalog_id,
      user_id: userId,
      deleted_at: null
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        error: 'Catalog not found or does not belong to user'
      });
    }

    const waba = await WhatsappWaba.findById(catalog.waba_id);

    if (!waba) {
      return res.status(404).json({
        success: false,
        error: 'WABA not found'
      });
    }

    const response = await updateProductInCatalogFromAPI(product_id, productData, waba.access_token);

    const product = await EcommerceProduct.findOne({
      product_external_id: product_id,
      user_id: userId,
      catalog_id: catalog._id,
      deleted_at: null
    });

    if (product) {
      if (productData.name) product.name = productData.name;
      if (productData.description) product.description = productData.description;
      if (productData.price) product.price = parseFloat(productData.price);
      if (productData.currency) product.currency = productData.currency;
      if (productData.availability) product.availability = productData.availability;
      if (productData.condition) product.condition = productData.condition;
      if (productData.image_urls) product.image_urls = Array.isArray(productData.image_urls) ? productData.image_urls : [productData.image_urls].filter(Boolean);
      if (productData.url) product.url = productData.url;
      if (productData.category) product.category = productData.category;
      if (productData.brand) product.brand = productData.brand;
      if (productData.retailer_id) product.retailer_id = productData.retailer_id;
      if (productData.additional_variant_attributes) product.additional_variant_attributes = productData.additional_variant_attributes;

      await product.save();
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: response
    });
  } catch (error) {
    console.error('Error updating product in catalog:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update product in catalog',
      message: error.response?.data.error.error_user_msg || error.message,
      details: error.response?.data || error.message
    });
  }
};

export const getProductFunnels = async (req, res) => {
  try {
    const userId = req.user.id;
    const funnels = await funnelService.getFunnelsByType(userId, 'ecommerce_product');
    res.status(200).json({ success: true, data: funnels });
  } catch (error) {
    console.error("Error fetching product funnels:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductKanbanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const status = await funnelService.getItemStatus(id, userId);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    console.error("Error fetching product kanban status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const handleProductKanbanAction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { globalItemId, actions } = req.body;

    let result;
    if (actions && Array.isArray(actions)) {
      result = await funnelService.processBulkActions({
        globalItemId,
        actions,
        userId,
        changedBy: req.user.id
      });
    } else {
      result = await funnelService.processAction({
        ...req.body,
        userId,
        changedBy: req.user.id
      });
    }

    res.status(200).json({ success: true, data: result, message: "Action processed successfully" });
  } catch (error) {
    console.error("Error processing product kanban action:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getWABACatalogs,
  syncWABACatalogs,
  linkCatalogToWABA,
  getLinkedCatalogs,
  getProductsFromCatalog,
  createProductInCatalog,
  getUserCatalogs,
  getUserProducts,
  deleteProductFromCatalog,
  updateProductInCatalog,
  getProductFunnels,
  getProductKanbanStatus,
  handleProductKanbanAction
};
