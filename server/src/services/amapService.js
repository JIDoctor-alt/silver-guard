// ============================================================
// Silver Guard · 高德地图服务
// 基于高德 MCP Server 能力：天气、POI搜索、路径规划、地理编码
// 养老场景：周边医疗/药店搜索、天气提醒、出行规划、位置服务
// ============================================================
const config = require('../config');
const crypto = require('crypto');

const BASE_URL = 'https://restapi.amap.com/v3';

function getKey() {
  return config.AMAP_API_KEY;
}

function getSecurityKey() {
  return config.AMAP_SECURITY_KEY || '';
}

// 生成签名（高德安全密钥机制）
// 签名规则：将请求参数按 key 升序排序后拼接，末尾加上 security_key，然后 MD5
function generateSig(params) {
  const securityKey = getSecurityKey();
  if (!securityKey) return null;

  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const sigStr = sorted + securityKey;
  return crypto.createHash('md5').update(sigStr).digest('hex');
}

async function amapRequest(path, params = {}) {
  const key = getKey();
  if (!key) throw new Error('AMAP_API_KEY 未配置');

  // 添加签名
  const sig = generateSig(params);
  if (sig) {
    params.sig = sig;
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(`高德API错误(${data.infocode}): ${data.info}`);
  }
  return data;
}

// ==================== 天气查询 ====================

async function getWeather(city) {
  const data = await amapRequest('/weather/weatherInfo', { city, extensions: 'all' });
  return {
    city: data.forecasts?.[0]?.city || city,
    current: data.lives?.[0] || null,
    forecasts: data.forecasts?.[0]?.casts || [],
  };
}

// ==================== 地理编码 ====================

async function geoCode(address, city) {
  const data = await amapRequest('/geocode/geo', { address, city });
  return {
    geocodes: data.geocodes?.map((g) => ({
      location: g.location,
      formattedAddress: g.formatted_address,
      province: g.province,
      city: g.city,
      district: g.district,
      level: g.level,
    })) || [],
  };
}

async function reGeoCode(location) {
  const data = await amapRequest('/geocode/regeo', { location, extensions: 'all' });
  return {
    formattedAddress: data.regeocode?.formatted_address || '',
    addressComponent: data.regeocode?.addressComponent || {},
    pois: (data.regeocode?.pois || []).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      location: p.location,
      distance: p.distance,
    })),
  };
}

// ==================== POI 搜索 ====================

async function searchPOI(keywords, city, page = 1, pageSize = 10) {
  const data = await amapRequest('/place/text', {
    keywords,
    city,
    offset: pageSize,
    page,
    extensions: 'all',
  });
  return {
    pois: (data.pois || []).map(formatPOI),
    count: parseInt(data.count) || 0,
    page,
    pageSize,
  };
}

async function searchAround(keywords, location, radius = 3000, page = 1, pageSize = 10) {
  const data = await amapRequest('/place/around', {
    keywords,
    location,
    radius,
    offset: pageSize,
    page,
    extensions: 'all',
  });
  return {
    pois: (data.pois || []).map(formatPOI),
    count: parseInt(data.count) || 0,
    page,
    pageSize,
  };
}

async function getPOIDetail(id) {
  const data = await amapRequest('/place/detail', { id });
  return data.pois?.[0] ? formatPOI(data.pois[0]) : null;
}

function formatPOI(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    address: p.address,
    location: p.location,
    tel: p.tel || '',
    distance: p.distance ? parseInt(p.distance) : null,
    businessArea: p.business_area || '',
    photos: (p.photos || []).map((ph) => ph.url),
    rating: p.biz_ext?.rating || '',
  };
}

// ==================== 路径规划 ====================

async function walkingRoute(origin, destination) {
  const data = await amapRequest('/direction/walking', {
    origin,
    destination,
    show_fields: 'cost,polyline',
  });
  return formatRoute(data.route, 'walking');
}

async function drivingRoute(origin, destination) {
  const data = await amapRequest('/direction/driving', {
    origin,
    destination,
    show_fields: 'cost,polyline',
    strategy: 0,
  });
  return formatRoute(data.route, 'driving');
}

async function transitRoute(origin, destination, city, cityd) {
  const data = await amapRequest('/direction/transit/integrated', {
    origin,
    destination,
    city,
    cityd: cityd || city,
    show_fields: 'cost',
  });
  return formatRoute(data.route, 'transit');
}

async function bicyclingRoute(origin, destination) {
  const data = await amapRequest('/direction/bicycling', {
    origin,
    destination,
    show_fields: 'cost,polyline',
  });
  return formatRoute(data.route, 'bicycling');
}

function formatRoute(route, type) {
  if (!route || !route.paths || route.paths.length === 0) {
    return { type, paths: [], distance: 0, duration: 0 };
  }
  const path = route.paths[0];
  return {
    type,
    distance: parseInt(path.distance) || 0,
    duration: parseInt(path.duration) || 0,
    taxiCost: path.cost?.duration || '',
    paths: route.paths.map((p) => ({
      distance: parseInt(p.distance) || 0,
      duration: parseInt(p.duration) || 0,
      steps: (p.steps || []).map((s) => ({
        instruction: s.instruction,
        road: s.road,
        distance: parseInt(s.distance) || 0,
        duration: parseInt(s.duration) || 0,
        orientation: s.orientation || '',
        action: s.action || '',
        polyline: s.polyline || '',
      })),
    })),
  };
}

// ==================== 距离测量 ====================

async function measureDistance(origins, destination) {
  const data = await amapRequest('/distance', {
    origins,
    destination,
    type: 1,
  });
  return {
    results: (data.results || []).map((r) => ({
      originId: r.origin_id,
      destId: r.dest_id,
      distance: parseInt(r.distance) || 0,
      duration: parseInt(r.duration) || 0,
    })),
  };
}

// ==================== 养老场景专用 ====================

// 搜索老人周边医疗设施
async function searchNearbyMedical(location, radius = 5000) {
  const [hospitals, pharmacies, clinics] = await Promise.all([
    searchAround('医院', location, radius),
    searchAround('药店', location, radius),
    searchAround('社区卫生服务中心', location, radius),
  ]);
  return { hospitals, pharmacies, clinics };
}

// 搜索老人周边养老设施
async function searchNearbyElderCare(location, radius = 10000) {
  const [parks, markets, elderCenters, banks] = await Promise.all([
    searchAround('公园', location, radius),
    searchAround('菜市场|超市', location, radius),
    searchAround('老年活动中心|老年大学', location, radius),
    searchAround('银行', location, radius),
  ]);
  return { parks, markets, elderCenters, banks };
}

// 生成天气提醒文案
async function getWeatherAlert(city) {
  const weather = await getWeather(city);
  if (!weather.forecasts || weather.forecasts.length === 0) {
    return { weather, alerts: [] };
  }

  const today = weather.forecasts[0];
  const alerts = [];

  if (parseInt(today.daytemp) >= 35 || parseInt(today.nighttemp) >= 35) {
    alerts.push({ type: 'warning', message: `高温预警：今日最高气温${today.daytemp}°C，建议老人减少户外活动，注意防暑降温，多饮水。` });
  }
  if (parseInt(today.daytemp) <= 5 || parseInt(today.nighttemp) <= 5) {
    alerts.push({ type: 'warning', message: `低温预警：今日最低气温${today.nighttemp}°C，请老人注意保暖，添加衣物，预防感冒。` });
  }
  if (today.dayweather.includes('雨')) {
    alerts.push({ type: 'info', message: `雨天提醒：今日有${today.dayweather}，路面湿滑，老人出行请注意安全，建议携带雨具。` });
  }
  if (today.dayweather.includes('雪')) {
    alerts.push({ type: 'warning', message: `降雪提醒：今日有${today.dayweather}，路面结冰风险，建议老人尽量减少外出。` });
  }
  if (today.daywind.includes('大风') || today.daypower.includes('≥6')) {
    alerts.push({ type: 'info', message: `大风提醒：今日风力较大，外出请远离广告牌和临时搭建物。` });
  }

  return { weather, alerts };
}

module.exports = {
  getWeather,
  getWeatherAlert,
  geoCode,
  reGeoCode,
  searchPOI,
  searchAround,
  getPOIDetail,
  walkingRoute,
  drivingRoute,
  transitRoute,
  bicyclingRoute,
  measureDistance,
  searchNearbyMedical,
  searchNearbyElderCare,
};