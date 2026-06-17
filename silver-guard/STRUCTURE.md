# =========================================================
# Silver Guard · 包结构说明
# 版本：v1.0（评审后冻结版）
# 说明：Phase 1 单体架构，模块以内包划分，Phase 2 拆分为独立 Maven 模块
# =========================================================

# ============================================================
# silver-guard-common / 公共基础设施（所有模块依赖，禁止依赖其他业务模块）
# ============================================================
silver-guard-common/
├── src/main/java/com/silverguard/common/
│   ├── SilverGuardCommonApplication.java        # 公共模块启动类（空，仅用于打包）
│   │
│   ├── result/                                   # 统一响应结构
│   │   ├── ApiResult.java                       # 统一响应封装（code/data/msg）
│   │   └── ResultCode.java                      # 业务错误码枚举
│   │
│   ├── exception/                               # 异常体系
│   │   ├── BusinessException.java               # 业务异常（可带错误码）
│   │   ├── ErrorCode.java                       # 错误码定义（枚举）
│   │   ├── UnauthorizedException.java            # 未授权异常
│   │   └── ResourceNotFoundException.java       # 资源不存在异常
│   │
│   ├── annotation/                               # 自定义注解
│   │   ├── RequirePermission.java               # 权限校验注解（@RequirePermission("elder:create")）
│   │   ├── RateLimiter.java                    # 分布式限流注解（@RateLimiter(key="", qps=100)）
│   │   ├── AgentExecution.java                  # AI 执行链路计时注解（@AgentExecution）
│   │   └── NoRepeatSubmit.java                  # 防重复提交注解
│   │
│   ├── util/                                    # 工具类
│   │   ├── IdCardUtil.java                    # 身份证号哈希（SHA-256，不可逆）
│   │   ├── SensitiveUtil.java                  # 敏感字段脱敏（手机号/身份证/姓名）
│   │   ├── TraceUtil.java                     # Trace ID 生成与获取
│   │   └── DateTimeUtil.java                  # 日期时间工具
│   │
│   └── constant/                                 # 常量定义
│       ├── EventType.java                      # 事件类型枚举（FALL/STILL/SOS/OUT_OF_BED...）
│       ├── EventLevel.java                      # 预警等级枚举（L1~L4）
│       ├── EventStatus.java                     # 事件状态枚举
│       ├── NotifyChannel.java                   # 通知通道枚举（APP/SMS/CALL/WECHAT）
│       ├── UserRole.java                        # 用户角色枚举
│       └── DeviceType.java                      # 设备类型枚举
│   └── README.md

# ============================================================
# silver-guard-core / 核心业务模块（老人/设备/事件/通知/巡检/报表/画像/用户）
# ============================================================
silver-guard-core/
├── src/main/java/com/silverguard/core/
│   │
│   ├── config/                                  # Core 模块配置
│   │   ├── SecurityConfig.java                 # Spring Security 配置（JWT 过滤器链）
│   │   ├── AsyncConfig.java                   # CompletableFuture 线程池配置
│   │   ├── CacheConfig.java                   # Caffeine 多级缓存配置
│   │   └── WebConfig.java                    # Web 配置（CORS / 拦截器）
│   │
│   ├── elder/                                  # 【M01】老人档案模块
│   │   ├── ElderController.java               # REST API
│   │   ├── ElderService.java                   # 业务逻辑
│   │   ├── ElderMapper.java                   # MyBatis Flex Mapper
│   │   └── domain/
│   │       ├── Elder.java                     # 实体
│   │       ├── ElderDTO.java                  # 传输对象
│   │       ├── ElderQuery.java                # 查询条件
│   │       └── ElderCreateCmd.java            # 创建命令
│   │
│   ├── device/                                 # 【M02】设备管理模块
│   │   ├── DeviceController.java
│   │   ├── DeviceService.java
│   │   ├── DeviceMapper.java
│   │   └── domain/
│   │
│   ├── event/                                 # 【M03】事件与预警模块【核心】
│   │   ├── EventController.java
│   │   ├── EventService.java                  # 事件生命周期管理
│   │   ├── EventMapper.java
│   │   ├── EventStatusMachine.java           # 状态机（OPEN→CLOSED）
│   │   ├── EventAssembler.java               # DTO ↔ Entity 转换
│   │   └── domain/
│   │       ├── Event.java
│   │       ├── EventCreateCmd.java
│   │       ├── EventQuery.java
│   │       └── EventLevel.java               # L1~L4 枚举
│   │
│   ├── notify/                                 # 【M04】通知中心模块
│   │   ├── NotifyService.java
│   │   ├── NotifyMapper.java
│   │   ├── channel/                          # 通知渠道工厂（Strategy 模式）
│   │   │   ├── NotificationChannel.java     # 渠道接口
│   │   │   ├── AppPushChannel.java         # App 推送（极光）
│   │   │   ├── SmsChannel.java             # 短信（阿里云）
│   │   │   ├── CallChannel.java             # 电话（腾讯云）
│   │   │   └── WechatChannel.java           # 微信通知
│   │   └── escalation/
│   │       ├── EscalationStrategy.java       # 升级策略接口（Strategy）
│   │       ├── Level2Escalation.java        # L2 升级策略
│   │       └── Level3Escalation.java        # L3/L4 升级策略
│   │
│   ├── patrol/                                 # 【M05】巡检管理模块
│   │   ├── PatrolController.java
│   │   ├── PatrolService.java
│   │   ├── PatrolMapper.java
│   │   ├── TaskGenerator.java                 # 巡检清单自动生成
│   │   └── domain/
│   │
│   ├── user/                                   # 【M06】用户与权限模块
│   │   ├── AuthController.java                 # 登录 / JWT
│   │   ├── UserController.java
│   │   ├── UserService.java
│   │   ├── UserMapper.java
│   │   └── domain/
│   │
│   ├── report/                                # 【M07】报表与统计模块
│   │   ├── ReportController.java
│   │   ├── ReportService.java
│   │   └── WeeklyReportGenerator.java         # 周报生成
│   │
│   └── profile/                               # 【M08】老人日常画像模块
│       ├── ProfileService.java
│       └── ProfileMapper.java
│
├── src/main/java/com/silverguard/core/config/
│   └── CacheConfig.java                       # Caffeine 配置

└── README.md

# ============================================================
# silver-guard-ai / AI 研判模块（LangChain4j + LangGraph4j）
# ============================================================
silver-guard-ai/
├── src/main/java/com/silverguard/ai/
│   │
│   ├── AiJudgeService.java                    # AI 二次研判入口
│   │
│   ├── judge/                                # 研判规则引擎
│   │   ├── JudgeChain.java                  # 研判链（Template Method 模式）
│   │   ├── FallDetector.java                # 跌倒识别
│   │   ├── StillDetector.java               # 静止识别
│   │   ├── NightOutDetector.java             # 夜间离床识别
│   │   └── InactivityDetector.java           # 久未活动识别
│   │
│   ├── RiskLevelDecider.java                # 风险分级策略（Strategy 模式）
│   │
│   ├── llm/                                  # LLM 调用封装
│   │   ├── LlmService.java                  # LangChain4j 封装
│   │   ├── LlmSummaryService.java           # LLM 摘要生成
│   │   └── prompt/
│   │       ├── JudgePrompt.java              # 研判 Prompt 模板
│   │       └── SummaryPrompt.java            # 周报摘要 Prompt
│   │
│   ├── graph/                                # LangGraph 流程编排
│   │   ├── AiWorkflowGraph.java            # StateGraph 定义
│   │   ├── nodes/
│   │   │   ├── SenseNode.java               # 感知节点
│   │   │   ├── JudgeNode.java               # 研判节点
│   │   │   ├── LevelNode.java              # 分级节点
│   │   │   └── NotifyNode.java             # 通知节点
│   │   └── edges/
│   │       └── ConditionalEdges.java        # 条件边
│   │
│   └── config/
│       └── LangChainConfig.java             # LangChain4j 配置
│
└── README.md

# ============================================================
# silver-guard-gateway / 网关接入模块（设备数据 + 认证）
# ============================================================
silver-guard-gateway/
├── src/main/java/com/silverguard/gateway/
│   │
│   ├── DeviceGatewayController.java          # 设备数据统一入口（HTTP / MQTT 转发）
│   ├── DeviceSignatureValidator.java         # 设备签名校验（HMAC-SHA256）
│   │
│   ├── auth/                                 # 认证
│   │   ├── AuthController.java               # 手机号登录 / SSO / Refresh Token
│   │   ├── AuthService.java
│   │   ├── JwtTokenProvider.java            # JWT 签发与校验
│   │   ├── JwtAuthFilter.java               # JWT 过滤器（Security Filter Chain）
│   │   └── dto/
│   │       ├── LoginRequest.java
│   │       └── LoginResponse.java
│   │
│   └── exception/
│       └── GlobalExceptionHandler.java        # 全局异常处理（@RestControllerAdvice）
│
└── README.md

# ============================================================
# silver-guard-app / 应用启动模块（胖 JAR 打包）
# ============================================================
silver-guard-app/
├── src/main/java/com/silverguard/
│   │   └── SilverGuardApplication.java       # Spring Boot 主启动类
│   │
│   └── src/main/resources/
│       ├── application.yml                    # 配置文件
│       ├── application-dev.yml              # 开发环境
│       ├── application-test.yml             # 测试环境
│       ├── application-prod.yml             # 生产环境
│       ├── db/
│       │   └── migration/                   # Flyway SQL 迁移脚本
│       │       ├── V1__init_schema.sql     # ← 对应 /workspace/sql/V1__init_schema.sql
│       │       └── V2__add_xxx.sql         # 后续版本
│       ├── checks/
│       │   └── alibaba-checkstyle.xml       # 阿里巴巴代码规范
│       └── logback-spring.xml              # 日志配置
│
└── pom.xml                                  # App 模块 POM（依赖 core/ai/gateway）

# ============================================================
# 基础设施层（infra）—— 嵌入在 core 模块中
# ============================================================
# 以下包在 silver-guard-core 下，以 infra. 为前缀
com.silverguard.core.infra/
├── cache/
│   ├── ElderCacheService.java              # Caffeine 本地缓存（老人画像热点数据）
│   └── RedisCacheService.java              # Redis 分布式缓存
├── lock/
│   └── DistributedLock.java                 # Redisson 分布式锁
├── observability/
│   ├── MetricsConfig.java                  # Micrometer + Prometheus 指标
│   ├── TraceInterceptor.java               # 全链路 Trace ID 拦截器
│   └── LatencyRecorder.java               # 各链路延迟指标记录
├── audit/
│   ├── AuditLog.java                      # 审计日志实体
│   └── AuditLogAspect.java                 # AOP 审计拦截（切入所有写操作）
└── notification/
    └── AsyncNotifyExecutor.java            # CompletableFuture 异步通知执行器

# ============================================================
# 包依赖关系图（单向，禁止循环依赖）
# ============================================================
#
# common（无依赖）
#   ↑
#   │
# core（依赖 common）
#   │
#   ├──────────────┐
#   ↑              ↑
#   │
# ai（依赖 common + core）      gateway（依赖 common + core）
#   ↑                              ↑
#   │                              │
#   └────────── app ──────────────┘
#              （依赖 core + ai + gateway）
