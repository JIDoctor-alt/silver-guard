// ============================================================
// Silver Guard · 高德地图服务页面
// 天气提醒、周边医疗、养老设施、路径规划
// ============================================================
import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  Divider,
  List,
  Input,
  Select,
  message,
  Alert,
  Statistic,
  Collapse,
} from 'antd';
import {
  CloudOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  CompassOutlined,
  AimOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  getWeatherAlert,
  searchNearbyMedical,
  searchNearbyElderCare,
  searchPOI,
  getWalkingRoute,
  getDrivingRoute,
  getTransitRoute,
  geocode,
  type WeatherAlert,
  type POI,
  type POISearchResult,
  type NearbyMedicalResult,
  type NearbyElderCareResult,
  type RouteResult,
  type RouteStep,
} from '../../api/amap';

const { Text, Title } = Typography;
const { Panel } = Collapse;

// 默认城市列表
const DEFAULT_CITIES = [
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
  { label: '杭州', value: '杭州' },
  { label: '成都', value: '成都' },
  { label: '武汉', value: '武汉' },
  { label: '南京', value: '南京' },
  { label: '重庆', value: '重庆' },
  { label: '西安', value: '西安' },
];

export default function AmapPage() {
  const [activeTab, setActiveTab] = useState('weather');
  const [loading, setLoading] = useState(false);

  // 天气
  const [weatherCity, setWeatherCity] = useState('北京');
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlert | null>(null);

  // 周边
  const [nearbyCity, setNearbyCity] = useState('北京');
  const [nearbyAddress, setNearbyAddress] = useState('');
  const [nearbyLocation, setNearbyLocation] = useState('');
  const [nearbyMedical, setNearbyMedical] = useState<NearbyMedicalResult | null>(null);
  const [nearbyElderCare, setNearbyElderCare] = useState<NearbyElderCareResult | null>(null);

  // POI 搜索
  const [poiKeywords, setPoiKeywords] = useState('');
  const [poiCity, setPoiCity] = useState('北京');
  const [poiResults, setPoiResults] = useState<POISearchResult | null>(null);

  // 路径规划
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [routeType, setRouteType] = useState<'walking' | 'driving' | 'transit'>('driving');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  // 加载天气
  useEffect(() => {
    loadWeather(weatherCity);
  }, []);

  const loadWeather = async (city: string) => {
    setLoading(true);
    try {
      const res = await getWeatherAlert(city);
      setWeatherAlert(res.data);
    } catch {
      message.error('天气查询失败');
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    if (!nearbyAddress) {
      message.warning('请输入地址');
      return;
    }
    setLoading(true);
    try {
      // 先地理编码
      const geoRes = await geocode(nearbyAddress, nearbyCity);
      if (!geoRes.data.geocodes || geoRes.data.geocodes.length === 0) {
        message.error('未找到该地址，请检查输入');
        return;
      }
      const loc = geoRes.data.geocodes[0].location;
      setNearbyLocation(loc);

      const [medical, elderCare] = await Promise.all([
        searchNearbyMedical(loc),
        searchNearbyElderCare(loc),
      ]);
      setNearbyMedical(medical.data);
      setNearbyElderCare(elderCare.data);
    } catch {
      message.error('周边搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const searchPoi = async () => {
    if (!poiKeywords) {
      message.warning('请输入搜索关键词');
      return;
    }
    setLoading(true);
    try {
      const res = await searchPOI(poiKeywords, poiCity);
      setPoiResults(res.data);
    } catch {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const planRoute = async () => {
    if (!routeOrigin || !routeDest) {
      message.warning('请输入起点和终点');
      return;
    }
    setLoading(true);
    try {
      // 地理编码起点和终点
      const [originRes, destRes] = await Promise.all([
        geocode(routeOrigin, nearbyCity),
        geocode(routeDest, nearbyCity),
      ]);
      if (!originRes.data.geocodes?.[0] || !destRes.data.geocodes?.[0]) {
        message.error('地址解析失败');
        return;
      }

      const origin = originRes.data.geocodes[0].location;
      const dest = destRes.data.geocodes[0].location;

      let res;
      if (routeType === 'walking') {
        res = await getWalkingRoute(origin, dest);
      } else if (routeType === 'driving') {
        res = await getDrivingRoute(origin, dest);
      } else {
        res = await getTransitRoute(origin, dest, nearbyCity);
      }
      setRouteResult(res.data);
    } catch {
      message.error('路径规划失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: 'weather', label: '天气提醒', icon: <CloudOutlined /> },
    { key: 'nearby', label: '周边设施', icon: <EnvironmentOutlined /> },
    { key: 'search', label: '地点搜索', icon: <SearchOutlined /> },
    { key: 'route', label: '路径规划', icon: <CompassOutlined /> },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space align="center" size="large">
          <EnvironmentOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>高德地图服务</Title>
            <Text type="secondary">天气预报 · 周边设施 · 路径规划 · 位置搜索</Text>
          </div>
        </Space>
      </Card>

      <Card tabList={tabItems as never} activeTabKey={activeTab} onTabChange={(k) => setActiveTab(k)}>
        <Spin spinning={loading}>
          {/* ==================== 天气提醒 ==================== */}
          {activeTab === 'weather' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col>
                  <Select
                    value={weatherCity}
                    onChange={(v) => { setWeatherCity(v); loadWeather(v); }}
                    style={{ width: 120 }}
                    options={DEFAULT_CITIES}
                  />
                </Col>
                <Col>
                  <Button type="primary" onClick={() => loadWeather(weatherCity)}>刷新天气</Button>
                </Col>
              </Row>

              {weatherAlert && (
                <div>
                  {/* 天气提醒 */}
                  {weatherAlert.alerts.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {weatherAlert.alerts.map((a, i) => (
                        <Alert
                          key={i}
                          type={a.type}
                          message={a.message}
                          showIcon
                          icon={a.type === 'warning' ? <WarningOutlined /> : <InfoCircleOutlined />}
                          style={{ marginBottom: 8 }}
                        />
                      ))}
                    </div>
                  )}

                  {/* 预报 */}
                  <Text strong style={{ fontSize: 16 }}>{weatherAlert.weather.city} 未来天气预报</Text>
                  <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                    {weatherAlert.weather.forecasts.slice(0, 7).map((f, i) => (
                      <Col xs={24} sm={12} md={8} lg={Math.floor(24 / 7)} key={i}>
                        <Card size="small" hoverable>
                          <Text strong>{f.date}</Text>
                          <Text type="secondary"> {f.week}</Text>
                          <Divider style={{ margin: '8px 0' }} />
                          <div>
                            <Text>白天：{f.dayweather} {f.daytemp}°C</Text>
                            <br />
                            <Text type="secondary">夜间：{f.nightweather} {f.nighttemp}°C</Text>
                            <br />
                            <Text type="secondary">{f.daywind} {f.daypower}</Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </div>
          )}

          {/* ==================== 周边设施 ==================== */}
          {activeTab === 'nearby' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col flex="auto">
                  <Input.Search
                    placeholder="输入地址（如：北京市朝阳区建国路100号）"
                    value={nearbyAddress}
                    onChange={(e) => setNearbyAddress(e.target.value)}
                    enterButton="搜索周边"
                    onSearch={loadNearby}
                  />
                </Col>
                <Col>
                  <Select
                    value={nearbyCity}
                    onChange={setNearbyCity}
                    style={{ width: 100 }}
                    options={DEFAULT_CITIES}
                  />
                </Col>
              </Row>

              {nearbyLocation && (
                <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                  定位坐标：{nearbyLocation}
                </Text>
              )}

              {nearbyMedical && (
                <Collapse defaultActiveKey={['hospitals']} style={{ marginBottom: 16 }}>
                  <Panel header={<Space><MedicineBoxOutlined />周边医院 ({nearbyMedical.hospitals.count} 个)</Space>} key="hospitals">
                    <POIList pois={nearbyMedical.hospitals.pois} />
                  </Panel>
                  <Panel header={<Space><MedicineBoxOutlined />周边药店 ({nearbyMedical.pharmacies.count} 个)</Space>} key="pharmacies">
                    <POIList pois={nearbyMedical.pharmacies.pois} />
                  </Panel>
                  <Panel header={<Space><HomeOutlined />社区卫生中心 ({nearbyMedical.clinics.count} 个)</Space>} key="clinics">
                    <POIList pois={nearbyMedical.clinics.pois} />
                  </Panel>
                </Collapse>
              )}

              {nearbyElderCare && (
                <Collapse>
                  <Panel header={<Space><AimOutlined />周边公园 ({nearbyElderCare.parks.count} 个)</Space>} key="parks">
                    <POIList pois={nearbyElderCare.parks.pois} />
                  </Panel>
                  <Panel header={<Space>菜市场/超市 ({nearbyElderCare.markets.count} 个)</Space>} key="markets">
                    <POIList pois={nearbyElderCare.markets.pois} />
                  </Panel>
                  <Panel header={<Space>老年活动中心 ({nearbyElderCare.elderCenters.count} 个)</Space>} key="elder">
                    <POIList pois={nearbyElderCare.elderCenters.pois} />
                  </Panel>
                  <Panel header={<Space>银行 ({nearbyElderCare.banks.count} 个)</Space>} key="banks">
                    <POIList pois={nearbyElderCare.banks.pois} />
                  </Panel>
                </Collapse>
              )}
            </div>
          )}

          {/* ==================== 地点搜索 ==================== */}
          {activeTab === 'search' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col flex="auto">
                  <Input.Search
                    placeholder="搜索地点（如：医院、超市、公园）"
                    value={poiKeywords}
                    onChange={(e) => setPoiKeywords(e.target.value)}
                    enterButton="搜索"
                    onSearch={searchPoi}
                  />
                </Col>
                <Col>
                  <Select
                    value={poiCity}
                    onChange={setPoiCity}
                    style={{ width: 100 }}
                    options={DEFAULT_CITIES}
                  />
                </Col>
              </Row>

              {poiResults && (
                <div>
                  <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                    共找到 {poiResults.count} 个结果
                  </Text>
                  <POIList pois={poiResults.pois} />
                </div>
              )}
            </div>
          )}

          {/* ==================== 路径规划 ==================== */}
          {activeTab === 'route' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col flex="auto">
                  <Input
                    placeholder="起点地址"
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    prefix={<AimOutlined />}
                  />
                </Col>
                <Col flex="auto">
                  <Input
                    placeholder="终点地址"
                    value={routeDest}
                    onChange={(e) => setRouteDest(e.target.value)}
                    prefix={<SendOutlined />}
                  />
                </Col>
                <Col>
                  <Select
                    value={routeType}
                    onChange={setRouteType}
                    style={{ width: 120 }}
                    options={[
                      { label: '驾车', value: 'driving' },
                      { label: '步行', value: 'walking' },
                      { label: '公交', value: 'transit' },
                    ]}
                  />
                </Col>
                <Col>
                  <Button type="primary" onClick={planRoute} icon={<CompassOutlined />}>
                    规划路线
                  </Button>
                </Col>
              </Row>

              {routeResult && (
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Statistic title="距离" value={routeResult.distance} suffix="米" />
                    </Col>
                    <Col span={8}>
                      <Statistic title="预计时间" value={Math.round(routeResult.duration / 60)} suffix="分钟" />
                    </Col>
                    {routeResult.taxiCost && (
                      <Col span={8}>
                        <Statistic title="预估费用" value={routeResult.taxiCost} />
                      </Col>
                    )}
                  </Row>

                  <Divider>路线详情</Divider>
                  <List
                    size="small"
                    dataSource={routeResult.paths[0]?.steps || []}
                    renderItem={(step: RouteStep, i: number) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue">{i + 1}</Tag>
                          <Text>{step.instruction.replace(/<[^>]+>/g, '')}</Text>
                          <Text type="secondary">({step.distance}米)</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
}

// POI 列表组件
function POIList({ pois }: { pois: POI[] }) {
  if (!pois || pois.length === 0) return <Empty description="暂无结果" />;
  return (
    <List
      size="small"
      dataSource={pois}
      renderItem={(poi) => (
        <List.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Text strong>{poi.name}</Text>
              {poi.rating && <Tag color="orange">{poi.rating}</Tag>}
            </Space>
            <Space size={16}>
              <Space size={4}>
                <EnvironmentOutlined />
                <Text type="secondary">{poi.address}</Text>
              </Space>
              {poi.distance && (
                <Space size={4}>
                  <AimOutlined />
                  <Text type="secondary">{poi.distance < 1000 ? `${poi.distance}米` : `${(poi.distance / 1000).toFixed(1)}公里`}</Text>
                </Space>
              )}
              {poi.tel && (
                <Space size={4}>
                  <PhoneOutlined />
                  <Text type="secondary">{poi.tel}</Text>
                </Space>
              )}
            </Space>
          </Space>
        </List.Item>
      )}
    />
  );
}