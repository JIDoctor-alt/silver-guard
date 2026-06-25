// ============================================================
// Silver Guard · 高德地图 API
// 天气查询、POI搜索、路径规划、地理编码
// ============================================================
import { request } from './request';

// ==================== 类型定义 ====================

export interface WeatherForecast {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
  daywind: string;
  daypower: string;
}

export interface WeatherResult {
  city: string;
  current: {
    weather: string;
    temperature: string;
    winddirection: string;
    windpower: string;
    humidity: string;
    reporttime: string;
  } | null;
  forecasts: WeatherForecast[];
}

export interface WeatherAlert {
  city: string;
  weather: WeatherResult;
  alerts: Array<{ type: 'warning' | 'info'; message: string }>;
}

export interface GeocodeResult {
  geocodes: Array<{
    location: string;
    formattedAddress: string;
    province: string;
    city: string;
    district: string;
    level: string;
  }>;
}

export interface POI {
  id: string;
  name: string;
  type: string;
  address: string;
  location: string;
  tel: string;
  distance: number | null;
  businessArea: string;
  photos: string[];
  rating: string;
}

export interface POISearchResult {
  pois: POI[];
  count: number;
  page: number;
  pageSize: number;
}

export interface NearbyMedicalResult {
  hospitals: POISearchResult;
  pharmacies: POISearchResult;
  clinics: POISearchResult;
}

export interface NearbyElderCareResult {
  parks: POISearchResult;
  markets: POISearchResult;
  elderCenters: POISearchResult;
  banks: POISearchResult;
}

export interface RouteStep {
  instruction: string;
  road: string;
  distance: number;
  duration: number;
  orientation: string;
  action: string;
  polyline: string;
}

export interface RoutePath {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteResult {
  type: string;
  distance: number;
  duration: number;
  taxiCost: string;
  paths: RoutePath[];
}

export interface DistanceResult {
  results: Array<{
    originId: string;
    destId: string;
    distance: number;
    duration: number;
  }>;
}

// ==================== API 封装 ====================

export const getWeather = (city: string) =>
  request.get<WeatherResult>('/amap/weather', { params: { city } });

export const getWeatherAlert = (city: string) =>
  request.get<WeatherAlert>('/amap/weather-alert', { params: { city } });

export const geocode = (address: string, city?: string) =>
  request.get<GeocodeResult>('/amap/geo', { params: { address, city } });

export const regeocode = (location: string) =>
  request.get<any>('/amap/regeo', { params: { location } });

export const searchPOI = (keywords: string, city?: string, page?: number, pageSize?: number) =>
  request.get<POISearchResult>('/amap/search', { params: { keywords, city, page, pageSize } });

export const searchAround = (keywords: string, location: string, radius?: number, page?: number, pageSize?: number) =>
  request.get<POISearchResult>('/amap/around', { params: { keywords, location, radius, page, pageSize } });

export const getPOIDetail = (id: string) =>
  request.get<POI>(`/amap/poi/${id}`);

export const searchNearbyMedical = (location: string, radius?: number) =>
  request.get<NearbyMedicalResult>('/amap/nearby-medical', { params: { location, radius } });

export const searchNearbyElderCare = (location: string, radius?: number) =>
  request.get<NearbyElderCareResult>('/amap/nearby-eldercare', { params: { location, radius } });

export const getWalkingRoute = (origin: string, destination: string) =>
  request.get<RouteResult>('/amap/route/walking', { params: { origin, destination } });

export const getDrivingRoute = (origin: string, destination: string) =>
  request.get<RouteResult>('/amap/route/driving', { params: { origin, destination } });

export const getTransitRoute = (origin: string, destination: string, city: string, cityd?: string) =>
  request.get<RouteResult>('/amap/route/transit', { params: { origin, destination, city, cityd } });

export const getBicyclingRoute = (origin: string, destination: string) =>
  request.get<RouteResult>('/amap/route/bicycling', { params: { origin, destination } });

export const measureDistance = (origins: string, destination: string) =>
  request.get<DistanceResult>('/amap/distance', { params: { origins, destination } });
