# Silver Guard Backend（智护长者）

> **项目代号**：Silver Guard
> **中文名称**：智护长者 · AI 社区独居老人智能巡检与安全预警系统
> **GitHub / GitLab 仓库**：`silver-guard-backend`
> **项目版本**：v1.2（评审后冻结版 · 2026-06-17）
> **技术栈**：Java 21 / Spring Boot 3 / MyBatis Flex / Redis + Caffeine / LangChain4j / Spring AI Alibaba / Docker Compose

---

## 项目概述

**Silver Guard** 是一套面向社区/街道的**智能养老巡检系统**，通过为独居老人家庭部署毫米波雷达、红外、SOS 等智能感知设备，结合 AI 研判与预警通知体系，辅助网格员日常巡检，降低老人独居意外风险。

**核心理念**：

- 🧓 **以老人为中心** — 每位老人一张独立画像，AI 动态调整风险等级
- 🛡️ **安全第一** — L3/L4 预警 30 秒内触达网格员，22:00~06:00 自动升级
- 🤖 **AI 辅助、人类决策** — AI 提供线索与研判，最终处置权在网格员手中
- 🔒 **隐私合规** — 敏感信息脱敏存储，知情同意签署，家属可撤销授权

---

## 核心功能

| 模块 | 功能 | 负责人 |
| --- | --- | --- |
| **M01 老人档案** | 信息建档、风险分级、家庭绑定、知情同意管理 | 后端团队 |
| **M02 设备管理** | 设备注册、在线状态、阈值配置、离线告警 | 后端团队 |
| **M03 事件与预警** | 跌倒/静止/SOS/离床识别、L1~L4 分级、状态机流转 | 后端 + AI 团队 |
| **M04 通知中心** | App 推送、短信、电话、微信通知、升级机制、重试 | 后端团队 |
| **M05 巡检管理** | 网格员巡检清单、到场处置、SOS 跟踪、离线缓存 | 后端 + App 团队 |
| **M06 用户与权限** | 五级 RBAC、JWT 认证、审计日志 | 后端团队 |
| **M07 报表与驾驶舱** | 街道/社区驾驶舱、周报、LLM 摘要 | 后端 + AI 团队 |
| **M08 老人日常画像** | 基于历史事件的动态画像、活动评分、异常趋势 | AI 团队 |

---

## 架构说明

- **Phase 1（当前）**：单体架构（Maven 多模块，Spring Boot 3）
- **Phase 2（规划中）**：Spring Cloud 微服务 + Nacos + Dubbo
- **数据库**：MySQL 8 + ClickHouse（Phase 2，历史事件分析）
- **缓存**：Caffeine 本地缓存 + Redis 分布式缓存（多级缓存策略）
- **LLM**：通义千问 Plus（境内合规，成本可控）
- **部署**：Docker Compose（Phase 1）→ K8s（Phase 2）
- **监控**：Prometheus + Grafana + ARMS

---

## 快速开始（本地开发）

### 环境要求

| 依赖 | 版本 |
| --- | --- |
| JDK | 21 |
| Maven | 3.9+ |
| MySQL | 8.0+ |
| Redis | 7.0+ |
| Docker | 24.0+ |

### 1. 克隆仓库

```bash
git clone https://your-gitlab-host.com/silver-guard/silver-guard-backend.git
cd silver-guard-backend
```

### 2. 启动本地环境（MySQL + Redis）

```bash
docker compose up -d
```

### 3. 初始化数据库（Flyway 自动执行）

```bash
mvn -pl silver-guard-app -am compile spring-boot:run \
  -Dspring-boot.run.profiles=dev
```

或直接运行 SQL：

```bash
mysql -h localhost -u test_user -ptest1234 silver_guard < sql/V1__init_schema.sql
```

### 4. 启动应用

```bash
# 方式一：Maven 启动
mvn -pl silver-guard-app -am spring-boot:run -Dspring-boot.run.profiles=dev

# 方式二：IDEA 中运行 SilverGuardApplication
# 打开 silver-guard/silver-guard-app/src/main/java/com/silverguard/SilverGuardApplication.java
# 选择运行按钮，激活 dev profile
```

### 5. 访问验证

```bash
# 健康检查
curl http://localhost:8080/actuator/health
# 预期返回：{"status":"UP"}

# API 文档（Knife4j）
# 浏览器打开：http://localhost:8080/doc.html
```

---

## 项目结构

```
silver-guard-backend/
├── silver-guard/                  # Maven 多模块工程（核心代码）
│   ├── silver-guard-common/       # 公共基础设施（异常/工具/注解/常量）
│   ├── silver-guard-core/         # 核心业务（老人/设备/事件/通知/巡检/报表/用户）
│   ├── silver-guard-ai/           # AI 研判（LangChain4j + LangGraph4j）
│   ├── silver-guard-gateway/      # 设备接入网关 + 认证（JWT）
│   └── silver-guard-app/          # Spring Boot 启动模块（胖 JAR 打包）
│
├── sql/                           # Flyway 迁移脚本
│   └── V1__init_schema.sql
│
├── .github/workflows/             # CI/CD 流水线
│   └── ci.yml                     # 编译 → 单测 → OWASP → 构建镜像 → K8s 部署
│
├── docs/                          # 项目文档
│   ├── Module-Ownership-Diagram.md # 模块归属图（T-02 评审附件）
│   ├── Test-Case-Templates.md     # 测试用例模板（AC-01~08）
│   ├── Deployment-SOP-Checklist.md # SOP 发布检查清单
│   ├── Nginx-Configuration.md    # Nginx 配置
│   ├── Review-Meeting-Execution-Guide.md # 评审执行指南
│   └── Review-Meeting-PreRead-Package.md # 参会人阅读包
│
├── PRD-SilverGuard-v1.0.md        # 需求规格说明书 v1.2
├── PRD-Tech-Review-Agenda-v1.0.md # 评审议题清单 v1.2
│
├── pom.xml                        # Maven 父 POM
├── Dockerfile                     # 多阶段 Docker 构建
├── docker-compose.yml             # 本地开发环境
├── .github/workflows/ci.yml      # GitHub Actions CI/CD
├── .gitignore                     # Git 忽略文件
└── README.md                      # 本文件
```

---

## 分支策略（Git Flow）

```
main （生产分支）
  ↑  PR（Pull Request），代码审查 + CI 通过后合并
  │
develop（开发分支）
  ↑  feature/* 分支 PR 合并
  │
├── feature/xxx                   # 功能分支（从 develop 切出）
├── release/x.y.z                 # 预发布分支（版本冻结后）
└── hotfix/xxx                    # 紧急修复分支（从 main 切出）

规则：
  1. 不允许直接 push 到 main / develop
  2. 所有代码通过 PR 合入，需 ≥ 1 人 Review
  3. 核心路径（预警分发/AI 研判）需架构师 Review
  4. CI 失败的 PR 不允许合并
```

---

## API 文档

**Swagger UI（Knife4j）**：开发环境启动后访问 `http://localhost:8080/doc.html`

主要 API 分组：

| 模块 | 前缀 |
| --- | --- |
| 设备网关 | `/api/v1/devices/*` |
| 认证登录 | `/api/v1/auth/*` |
| 老人管理 | `/api/v1/elders/*` |
| 预警事件 | `/api/v1/events/*` |
| 巡检管理 | `/api/v1/patrols/*` |
| 通知中心 | `/api/v1/notifications/*` |
| 驾驶舱报表 | `/api/v1/dashboard/*` |
| 系统管理 | `/api/v1/admin/*` |

---

## 测试与质量

| 类型 | 目标 | 工具 |
| --- | --- | --- |
| 单元测试 | ≥ 70% 覆盖率 | JUnit 5 + Mockito |
| AI 层测试 | ≥ 80% 覆盖率 | JUnit 5 + LangChain4j Mock |
| 集成测试 | 端到端链路完整 | Testcontainers |
| 代码规范 | 强制执行 | Alibaba Java Coding Guidelines + Spotless |
| 依赖安全 | CVSS ≥ 8 阻断 | OWASP Dependency Check |
| 性能测试 | 压测 1000 户 | JMeter |

**测试数据**：`silver-guard/test-data.sql` —— 包含 2 个社区、10 名老人、6 条事件、3 条巡检记录的完整测试数据集。

---

## 发布流程（SOP）

```
1. 代码冻结 → PRD + 评审签字归档
2. 发布分支：从 develop 切出 release/x.y.z
3. CI：编译 → 单测 → Checkstyle → OWASP → 构建多平台镜像
4. 灰度：1% → 10% → 30% → 60% → 100%
5. 冒烟验证：/actuator/health + 核心接口
6. 回滚：kubectl rollout undo（一键回滚 ≤ 5 分钟）
```

详细 SOP 见 [Deployment-SOP-Checklist.md](file:///workspace/docs/Deployment-SOP-Checklist.md)

---

## 30 秒 SLA 分解

```
┌───────────────────────────────────────────────────────────────┐
│  端到端 SLA：L3/L4 预警从数据上报到首通知送达 ≤ 30 秒（P95）   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  设备数据上报（≤ 1 秒）  →  网关处理（≤ 2 秒） →              │
│      │                                                         │
│      ▼                                                         │
│  AI 研判（≤ 5 秒，超时走规则兜底）→ 通知发送（≤ 5 秒）→         │
│      │                                                         │
│      ▼                                                         │
│  网络余量（≥ 17 秒，兜底波动 / 重试 / 网络延迟）                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘

  监控告警：Prometheus 30 秒 SLA 分解各段阈值
  详见 silver-guard/prometheus-alerts.yml
```

---

## 隐私合规要点

1. ✅ 身份证号哈希存储（SHA-256，不可逆）
2. ✅ 手机号脱敏显示（138****1234）
3. ✅ 敏感数据加密存储（详细地址、健康信息）
4. ✅ 老人首次使用须签署知情同意书
5. ✅ 家属绑定须老人/监护人授权 + 短信验证码双重确认
6. ✅ 家属可随时撤销授权
7. ✅ 所有权限变更、阈值调整、数据导出须留痕审计日志
8. ✅ LLM 使用境内模型（通义千问），避免数据跨境

---

## 里程碑

| 阶段 | 目标 | 预计时间 |
| --- | --- | --- |
| **Phase 0** | 需求评审 → 技术方案评审 → 签字归档 | ✅ 已完成（2026-06-17） |
| **Phase 1** | 核心功能开发（感知接入 + AI 研判 + 网格员 App） | 规划中 |
| **Phase 1.5** | 引入 ClickHouse 历史事件分析、驾驶舱优化 | 规划中 |
| **Phase 2** | 微服务化、引入 K8s、110/120 联动、民政对接 | 规划中 |

---

## 团队

| 角色 | 职责 |
| --- | --- |
| 产品负责人 | PRD / 评审 / 需求管理 |
| 技术负责人 | 技术方案 / 架构 / 代码评审 |
| 后端架构师 | 数据库设计 / 模块划分 / 性能优化 |
| AI 负责人 | LLM 选型 / Prompt 工程 / LangGraph 编排 |
| 测试负责人 | 用例设计 / 自动化测试 / 性能测试 |
| 运维负责人 | CI/CD / K8s / 监控告警 / 发布管理 |
| 安全/合规 | 安全评审 / 隐私保护 / 合规审计 |
| 社区运营代表 | 需求对接 / 试点社区 / 网格员培训 |

---

## 许可证

内部项目，所有代码归项目团队所有，未经授权不得对外发布。

---

**— 银龄守护，让关爱永不停步 🏘️✨ —**
