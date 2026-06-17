# Silver Guard · SOP 发布检查清单

> 版本：v1.0
> 适用：所有 Phase 1 / Phase 2 生产环境发布
> 责任：发布负责人（Release Manager）必须逐项确认并签字
> 规则：任何"NO"或"N/A"项目必须有书面说明（在"备注"栏填写）

---

## 📋 发布清单总览

| 阶段 | 时间窗口 | 主要内容 |
| --- | --- | --- |
| ① 发布前检查（Pre-deploy） | 发布前 24 小时 | 代码冻结、代码审核、测试结果验证 |
| ② 配置检查（Config） | 发布前 4 小时 | 数据库、缓存、LLM、通知通道配置 |
| ③ 执行发布（Deploy） | 发布窗口（建议：09:00~11:00，避开夜间预警高峰） | 灰度 → 全量 → 健康检查 |
| ④ 发布后验证（Post-deploy Smoke） | 发布后 30 分钟内 | 全量冒烟测试 + 关键业务链路验证 |
| ⑤ 监控值守（Watch） | 发布后 4 小时 | 核心指标监控，待命回滚 |
| ⑥ 回滚预案（Rollback） | 必要时立即执行 | 一键回滚到上一个版本 + 验证 |

---

## ① 发布前检查（Pre-deploy）

> 必须在发布前 24 小时完成

| # | 检查项 | 检查方式 | 结果（YES/NO） | 备注 | 责任人 |
| --- | --- | --- | --- | --- | --- |
| P01 | **代码冻结**：发布分支（main / release/x.y.z）不再合入新 PR，仅允许热修复 | Git log 检查 | | | Release Manager |
| P02 | **PRD 评审签字**：已通过产品/技术评审，无遗留 P0 项 | 评审文件签字栏 | | | 产品负责人 |
| P03 | **所有 P0 单元测试通过** | CI 日志（build job） | | | 测试负责人 |
| P04 | **集成测试通过率 ≥ 95%** | CI 日志（IT job） | | | 测试负责人 |
| P05 | **SonarQube 无 Blocker/Critical 级别问题** | SonarQube Dashboard | | | 技术负责人 |
| P06 | **OWASP 依赖扫描无严重漏洞（CVSS ≥ 8.0）** | OWASP Report | | | 安全负责人 |
| P07 | **Checkstyle / Spotless 无错误** | CI 日志 | | | 开发负责人 |
| P08 | **变更清单（Changelog）已准备** | CHANGELOG.md | | | Release Manager |
| P09 | **数据库迁移脚本（Flyway）已评审** | SQL Code Review | | | DBA |
| P10 | **LLM Prompt 版本已锁定并登记** | `ai/llm/prompt/VERSION` | | | AI 负责人 |
| P11 | **回滚脚本/镜像已准备就绪** | 上一版本镜像在 Harbor 存在 | | | DevOps |
| P12 | **已确认发布窗口**：不与节假日/重大活动/夜间预警时段冲突 | 日历确认 | | | Release Manager |

---

## ② 配置检查（Configuration）

> 发布前 4 小时完成

| # | 检查项 | 检查方式 | 结果（YES/NO） | 备注 | 责任人 |
| --- | --- | --- | --- | --- | --- |
| C01 | **MySQL 生产连接配置正确**（URL / 用户名 / 密码 / 连接池参数） | 检查 application-prod.yml | | | 后端 |
| C02 | **Redis 配置正确**（主从/哨兵/集群），密码已注入 | Redis-cli ping | | | 后端 |
| C03 | **LLM API Key 已配置**，额度 ≥ 本次发布预计消耗的 10 倍 | LLM 控制台 + 配置中心 | | | AI 负责人 |
| C04 | **短信通道账号**（阿里云/腾讯云）有效，余额 ≥ 10000 条 | 通道控制台 | | | 后端 |
| C05 | **电话语音通知通道**账号有效 | 通道控制台 | | | 后端 |
| C06 | **App 推送通道**（极光/个推）证书有效 | 通道控制台 | | | 前端 |
| C07 | **JWT 签名密钥**已轮换（如本次发布涉及安全改动） | 配置中心检查 | | | 安全 |
| C08 | **Nginx / CORS 配置**：允许的 Origin 列表齐全 | 检查 nginx.conf | | | DevOps |
| C09 | **Nacos 配置中心**（如 Phase 2 启用）各环境配置不同 | Nacos UI 检查 | | | 后端 |
| C10 | **Prometheus / Grafana 大盘**指标路径正确 | 访问 Dashboard | | | DevOps |
| C11 | **告警通道**（钉钉/飞书/企业微信）可达 | 发送测试告警 | | | DevOps |
| C12 | **Docker 镜像 TAG** 与 commit SHA 一致且已推送至 Harbor | `docker pull` 验证 | | | DevOps |

---

## ③ 执行发布（Deployment）

> 建议发布窗口：工作日 09:00~11:00（避开夜间预警高峰）

### 3.1 灰度发布（Canary）

| # | 步骤 | 操作 | 完成？ | 备注 |
| --- | --- | --- | --- | --- |
| D01 | 1% 流量灰度 | 将 1% 流量路由到新版本 | | |
| D02 | 健康检查（Health） | `GET /actuator/health` 连续 3 次 UP | | |
| D03 | 核心接口响应时间 | P95 ≤ 200ms | | |
| D04 | 关键错误率 | 5xx ≤ 0.1% | | |
| D05 | 保持 10 分钟观察 | 查看 Prometheus / K8s Dashboard | | |
| D06 | **灰度判断**：继续？回滚？ | 团队会议 | | |

### 3.2 全量发布

| # | 步骤 | 操作 | 完成？ | 备注 |
| --- | --- | --- | --- | --- |
| D07 | 流量逐步提升 | 1% → 10% → 30% → 60% → 100%（每步 5 分钟观察） | | |
| D08 | 各 Pod 健康检查 | `kubectl get pods -n silver-guard -w` | | |
| D09 | 资源水位检查 | CPU ≤ 60%，内存 ≤ 70% | | |
| D10 | 数据库连接池检查 | `SHOW PROCESSLIST` | | |
| D11 | Redis 内存检查 | `redis-cli info memory` | | |
| D12 | **确认全量发布成功** | 所有 Pod Ready，新版本版本号正确 | | |

---

## ④ 发布后冒烟验证（Post-deploy Smoke）

> 发布完成后 30 分钟内必须完成

| # | 冒烟测试项 | 操作 | 预期 | 结果（PASS/FAIL） | 备注 |
| --- | --- | --- | --- | --- | --- |
| S01 | 健康检查 | `GET /actuator/health` | `{"status":"UP"}` | | |
| S02 | 登录流程 | `POST /api/v1/auth/login` | 返回 Token（200 OK） | | |
| S03 | 老人档案 CRUD | `GET /api/v1/elders` + `POST /api/v1/elders` | 正常返回 + 创建成功 | | |
| S04 | 设备数据上报 | `POST /api/v1/devices/report`（模拟信号） | 202 Accepted | | |
| S05 | **预警全链路** | 模拟跌倒事件 → 30 秒内生成 L3 事件 + 通知推送 | 通知状态成功 | | |
| S06 | 驾驶舱仪表盘 | `GET /api/v1/dashboard/summary` | 200 OK，有数据 | | |
| S07 | **LLM 连通性** | 发送测试研判请求 | 5 秒内响应（非超时） | | |
| S08 | **短信通道** | 发送测试短信 | 1 分钟内接收成功 | | |
| S09 | App 推送 | 发送测试推送到网格员 App | 设备收到推送 | | |
| S10 | **审计日志** | 执行 S02~S07 后检查 audit_log 表 | 每条写操作对应一条审计记录 | | |
| S11 | **家属端小程序** | 小程序打开 + 查看老人概况 | 页面正常加载，数据正确 | | |
| S12 | **管理后台** | 登录 + 查看事件列表 | 页面正常 | | |
| S13 | 发布版本号检查 | `GET /api/v1/actuator/info` | 版本号与本次发布一致 | | |
| S14 | 数据迁移完整性 | 新表/新字段检查 | Flyway 版本 ≥ 目标版本 | | |
| S15 | **快速功能回归** | 核心页面/接口走查（约 15 分钟） | 无明显错误 | | |

---

## ⑤ 发布后 4 小时值守（Watch & Monitor）

> 发布完成后 4 小时内必须有人值守监控

| # | 监控项 | 观察指标 | 阈值 | 当前状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| W01 | **API 错误率** | 5xx / 总请求数 | ≤ 0.5% | | |
| W02 | **API 响应时间** | P95 延迟 | ≤ 2 秒 | | |
| W03 | **预警响应时间** | L3/L4 事件 P95 | ≤ 30 秒 | | |
| W04 | **CPU 使用率** | 所有 Pod | ≤ 70% | | |
| W05 | **内存使用率** | 所有 Pod | ≤ 75% | | |
| W06 | **MySQL 慢查询** | slow.log 每分钟条数 | ≤ 5 | | |
| W07 | **Redis 内存** | used_memory_human | ≤ 70% maxmemory | | |
| W08 | **LLM 调用失败率** | 超时/错误率 | ≤ 5% | | |
| W09 | **通知通道成功率** | SMS / CALL / AppPush | ≥ 99% | | |
| W10 | **JVM 异常** | OutOfMemory / GC 频繁 | 无异常 | | |
| W11 | **告警通道验证** | 每 1 小时发送一次测试告警 | 告警通道正常送达 | | |
| W12 | **值守人确认** | 发布后 2 小时 / 4 小时两次确认签字 | 无异常则放行 | | |

---

## ⑥ 回滚预案（Rollback）

> 出现以下任一情况，立即执行回滚：
> - L3/L4 预警通道故障
> - 错误率 > 1%
> - P95 响应时间 > 5 秒（持续 10 分钟以上）
> - 严重业务阻断（登录失败、数据异常、隐私泄露风险）
> - 数据库严重错误（死锁/数据丢失风险）

### 6.1 回滚步骤

| # | 步骤 | 操作 | 耗时估计 | 完成？ |
| --- | --- | --- | --- | --- |
| R01 | **发布负责人确认回滚** | 签字/口头授权 | 1 min | |
| R02 | 通知所有人 | 在发布群通知"执行回滚" | 1 min | |
| R03 | **K8s 回滚** | `kubectl rollout undo deployment/silver-guard -n silver-guard` | 2-3 min | |
| R04 | 等待回滚完成 | `kubectl rollout status deployment/silver-guard -n silver-guard` | 2 min | |
| R05 | 验证回滚版本号 | `GET /actuator/info` → 旧版本号 | 1 min | |
| R06 | 健康检查 | `GET /actuator/health` | 1 min | |
| R07 | 冒烟测试（S01~S10 关键项） | 10 分钟内完成 | 10 min | |
| R08 | **数据库回滚**（如 Flyway 向下迁移脚本已准备） | 由 DBA 执行 | 视情况 | |
| R09 | 确认数据一致性 | 抽查关键表行数/时间戳 | 5 min | |
| R10 | **回滚后确认无异常** | 监控 30 分钟 | 30 min | |
| R11 | 发布问题分析报告 | 24 小时内输出 RCA（根本原因分析） | — | |

### 6.2 回滚联系人

| 角色 | 姓名 | 联系方式 | 备注 |
| --- | --- | --- | --- |
| Release Manager | | 手机 / 微信 | 决策责任人 |
| 后端负责人 | | 手机 / 微信 | 代码回滚/Hotfix |
| DBA | | 手机 / 微信 | 数据库相关回滚 |
| DevOps | | 手机 / 微信 | K8s / 基础设施 |
| AI 负责人 | | 手机 / 微信 | LLM 相关问题 |
| 安全负责人 | | 手机 / 微信 | 隐私/安全相关 |

---

## 📝 发布记录单

| 项目 | 内容 |
| --- | --- |
| **发布版本号** | v |
| **Git Commit SHA** | ` ` |
| **Docker 镜像 TAG** | ` ` |
| **发布日期** | 2026-06- |
| **发布窗口** | : ~ : |
| **发布类型** | [ ] 正式发布 [ ] 紧急 Hotfix [ ] 灰度发布 |
| **主要变更摘要** | |
| **发布负责人（签字）** | |
| **技术负责人（签字）** | |
| **产品负责人（签字）** | |
| **安全负责人（签字）** | |
| **DBA（签字）** | |
| **发布成功时间** | 2026-06- : |
| **发布验证状态** | [ ] 全部通过（S01~S15） [ ] 部分通过（备注：______） |
| **备注 / 已知问题** | |

---

## ✅ 最终签字确认

> 本清单所有检查项完成后，签字归档

| 角色 | 姓名 | 签字 | 时间 |
| --- | --- | --- | --- |
| Release Manager | | | |
| 后端负责人 | | | |
| 前端负责人 | | | |
| AI 负责人 | | | |
| DevOps | | | |
| DBA | | | |
| 安全负责人 | | | |

---

# 📌 附录：快速操作命令参考

## K8s 常用命令

```bash
# 查看部署状态
kubectl get deployment -n silver-guard
kubectl get pods -n silver-guard -w
kubectl describe deployment silver-guard -n silver-guard

# 查看日志（最新 100 行）
kubectl logs -f deployment/silver-guard -n silver-guard --tail=100

# 查看事件
kubectl get events -n silver-guard --sort-by='.lastTimestamp'

# 回滚
kubectl rollout undo deployment/silver-guard -n silver-guard
kubectl rollout status deployment/silver-guard -n silver-guard

# 扩容
kubectl scale deployment silver-guard -n silver-guard --replicas=10
```

## 数据库常用命令

```bash
# 连接数据库
mysql -h <host> -u silver_guard_app -p silver_guard

# 检查慢查询
SELECT * FROM information_schema.processlist WHERE time > 10;

# Flyway 版本信息
SELECT version, state, script FROM flyway_schema_history ORDER BY version;
```

## 健康检查

```bash
# 应用健康
curl -s https://api.silver-guard.cn/actuator/health | jq

# 应用信息（版本号）
curl -s https://api.silver-guard.cn/actuator/info | jq

# Prometheus 指标
curl -s https://api.silver-guard.cn/actuator/prometheus | head
```

---

**— SOP 发布检查清单结束 —**
