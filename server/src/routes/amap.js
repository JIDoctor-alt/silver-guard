// ============================================================
// Silver Guard · 高德地图路由
// 天气查询、POI搜索、路径规划、地理编码
// ============================================================
const express = require('express');
const amap = require('../services/amapService');

const router = express.Router();

// ==================== 天气 ====================

/**
 * GET /api/amap/weather?city=北京
 */
router.get('/weather', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ code: 400, message: '请提供城市名称', data: null });
    const result = await amap.getWeather(city);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('天气查询失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/weather-alert?city=北京
 * 养老场景：天气 + 智能提醒
 */
router.get('/weather-alert', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ code: 400, message: '请提供城市名称', data: null });
    const result = await amap.getWeatherAlert(city);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('天气提醒查询失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

// ==================== 地理编码 ====================

/**
 * GET /api/amap/geo?address=北京市朝阳区&city=北京
 */
router.get('/geo', async (req, res) => {
  try {
    const { address, city } = req.query;
    if (!address) return res.status(400).json({ code: 400, message: '请提供地址', data: null });
    const result = await amap.geoCode(address, city);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('地理编码失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/regeo?location=116.397,39.908
 */
router.get('/regeo', async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ code: 400, message: '请提供经纬度', data: null });
    const result = await amap.reGeoCode(location);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('逆地理编码失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

// ==================== POI 搜索 ====================

/**
 * GET /api/amap/search?keywords=医院&city=北京&page=1&pageSize=10
 */
router.get('/search', async (req, res) => {
  try {
    const { keywords, city, page, pageSize } = req.query;
    if (!keywords) return res.status(400).json({ code: 400, message: '请提供搜索关键词', data: null });
    const result = await amap.searchPOI(keywords, city, Number(page) || 1, Number(pageSize) || 10);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('POI搜索失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/around?keywords=药店&location=116.397,39.908&radius=3000
 */
router.get('/around', async (req, res) => {
  try {
    const { keywords, location, radius, page, pageSize } = req.query;
    if (!keywords || !location) return res.status(400).json({ code: 400, message: '请提供关键词和经纬度', data: null });
    const result = await amap.searchAround(keywords, location, Number(radius) || 3000, Number(page) || 1, Number(pageSize) || 10);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('周边搜索失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/poi/:id
 */
router.get('/poi/:id', async (req, res) => {
  try {
    const result = await amap.getPOIDetail(req.params.id);
    if (!result) return res.status(404).json({ code: 404, message: 'POI不存在', data: null });
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('POI详情失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

// ==================== 养老场景专用 ====================

/**
 * GET /api/amap/nearby-medical?location=116.397,39.908&radius=5000
 * 搜索周边医疗设施（医院+药店+社区中心）
 */
router.get('/nearby-medical', async (req, res) => {
  try {
    const { location, radius } = req.query;
    if (!location) return res.status(400).json({ code: 400, message: '请提供经纬度', data: null });
    const result = await amap.searchNearbyMedical(location, Number(radius) || 5000);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('周边医疗搜索失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/nearby-eldercare?location=116.397,39.908&radius=10000
 * 搜索周边养老设施（公园+菜市场+老年中心+银行）
 */
router.get('/nearby-eldercare', async (req, res) => {
  try {
    const { location, radius } = req.query;
    if (!location) return res.status(400).json({ code: 400, message: '请提供经纬度', data: null });
    const result = await amap.searchNearbyElderCare(location, Number(radius) || 10000);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('周边养老设施搜索失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

// ==================== 路径规划 ====================

/**
 * GET /api/amap/route/walking?origin=116.397,39.908&destination=116.481,39.910
 */
router.get('/route/walking', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) return res.status(400).json({ code: 400, message: '请提供起终点经纬度', data: null });
    const result = await amap.walkingRoute(origin, destination);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('步行路径规划失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/route/driving?origin=116.397,39.908&destination=116.481,39.910
 */
router.get('/route/driving', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) return res.status(400).json({ code: 400, message: '请提供起终点经纬度', data: null });
    const result = await amap.drivingRoute(origin, destination);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('驾车路径规划失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/route/transit?origin=116.397,39.908&destination=116.481,39.910&city=北京
 */
router.get('/route/transit', async (req, res) => {
  try {
    const { origin, destination, city, cityd } = req.query;
    if (!origin || !destination) return res.status(400).json({ code: 400, message: '请提供起终点经纬度', data: null });
    const result = await amap.transitRoute(origin, destination, city, cityd);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('公交路径规划失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/route/bicycling?origin=116.397,39.908&destination=116.481,39.910
 */
router.get('/route/bicycling', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) return res.status(400).json({ code: 400, message: '请提供起终点经纬度', data: null });
    const result = await amap.bicyclingRoute(origin, destination);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('骑行路径规划失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

/**
 * GET /api/amap/distance?origins=116.397,39.908;116.481,39.910&destination=116.500,39.920
 */
router.get('/distance', async (req, res) => {
  try {
    const { origins, destination } = req.query;
    if (!origins || !destination) return res.status(400).json({ code: 400, message: '请提供起终点经纬度', data: null });
    const result = await amap.measureDistance(origins, destination);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('距离测量失败:', e.message);
    res.status(500).json({ code: 500, message: e.message, data: null });
  }
});

module.exports = router;