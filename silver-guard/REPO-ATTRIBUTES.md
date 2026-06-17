# =========================================================
# Silver Guard · Git 仓库属性定义
# 用于：GitLab / GitHub 项目初始化
# ============================================================

# ==================== 仓库基础信息 ====================
仓库名称：silver-guard-backend
仓库路径：silver-guard/silver-guard-backend
仓库类型：私有仓库（Internal / Private）
默认分支：main（生产分支）
镜像仓库：
  - Harbor：harbor.silver-guard-internal.cn/silver-guard/backend
  - 测试环境：harbor-test.silver-guard-internal.cn/silver-guard/backend
  - 生产环境：harbor-prod.silver-guard-internal.cn/silver-guard/backend

# ==================== 分支策略（Git Flow） ====================
分支模型：Git Flow

分支命名规则：
  main                         # 生产分支（不可直接 push）
  develop                      # 开发分支（不可直接 push）
  feature/{模块缩写}-{功能描述}  # 功能分支（从 develop 切出）
  release/{主版本}.{次版本}.{修订版本}  # 预发布分支
  hotfix/{问题描述}-{日期}       # 紧急修复分支（从 main 切出）

示例：
  feature/event-auto-escalation    # 预警自动升级功能
  feature/ai-judge-engine         # AI 研判引擎
  release/v1.2.0                  # 1.2.0 版本发布
  hotfix/sla-timeout-20260617     # SLA 超时紧急修复（2026-06-17）

分支保护规则（重要！）：
  main    → 禁止直接 push，须通过 PR，需 2 人 Review，CI 必须通过
  develop → 禁止直接 push，须通过 PR，需 1 人 Review，CI 必须通过

# ==================== 仓库标签（Tags）====================
标签命名规则：v{主版本}.{次版本}.{修订版本}
示例：
  v1.2.0         # Phase 1 功能完成版
  v1.2.1         # 第一个修复版本
  v1.3.0         # Phase 1.5（引入 ClickHouse）
  v2.0.0         # Phase 2（微服务化）

标签说明：
  - 每次发布到生产环境前打一个 tag
  - tag 信息包含：版本号、发布日期、关键变更摘要
  - 格式示例：v1.2.0 2026-06-17 · AI 研判引擎 / 驾驶舱

# ==================== Merge 策略（Merge Request） ====================
推荐策略：Squash Merge（压缩合并）

原因：
  1. main / develop 历史简洁（每个 PR 对应一条 commit）
  2. 方便回滚（一个 PR 一个 commit，回滚清晰）
  3. 保留完整 diff（便于 Code Review）

具体配置：
  feature/* → develop：Squash Merge
  develop → main：Rebase Merge（保留完整 commit 历史，便于追踪）
  hotfix/* → main：Squash Merge，cherry-pick 回 develop
  release/* → main + develop：Merge Commit

# ==================== Commit 消息规范（Conventional Commits） ====================
格式：{类型}(范围): {简短描述}

类型定义：
  feat:      新功能
  fix:       Bug 修复
  docs:      文档变更
  style:     代码格式调整（非逻辑变更）
  refactor:  重构（非新增功能，非 Bug 修复）
  perf:      性能优化
  test:      测试相关
  build:     构建系统/依赖变更
  ci:        CI/CD 配置变更
  chore:     其他杂项（不修改 src/ 或 test/）

范围示例（对应模块）：
  (core)      # core 模块变更
  (ai)        # AI 模块变更
  (gateway)   # 网关模块变更
  (common)    # 公共模块变更
  (app)       # 应用启动模块变更
  (db)        # 数据库变更
  (security)  # 安全相关
  (performance) # 性能优化
  (docs)      # 文档

Commit 消息示例：
  feat(ai): 实现 LangChain4j 研判引擎，支持跌倒/静止/夜间离床识别
  fix(core): 修复事件状态机 ASSIGNED → CLOSED 状态转换缺失
  perf(core): 优化事件查询索引（idx_community_level_created），P95 从 2.1s → 0.8s
  docs: 补充评审议题清单 AI 模块章节
  test(core): 为预警自动升级机制补充单元测试，覆盖率从 65% → 82%
  ci: 修复 GitHub Actions 中 OWASP 扫描超时问题

Commit 规则：
  1. 第一行（subject）不超过 72 字符
  2. subject 使用祈使句（"修复..."而非"修复了..."）
  3. 空一行后可写详细描述（body）
  4. 涉及重大变更，body 中以 "BREAKING CHANGE:" 开头说明

# ==================== PR（Pull Request）规范 ====================
PR 标题：{类型}({范围}): {标题}

PR 描述模板：
  ### 变更说明
  {简要说明本次变更内容与目的}

  ### 相关 Issue
  {关联 issue 编号或 PRD 章节}

  ### 变更类型
  - [ ] 新功能（feat）
  - [ ] Bug 修复（fix）
  - [ ] 性能优化（perf）
  - [ ] 代码重构（refactor）
  - [ ] 文档变更（docs）
  - [ ] 测试补充（test）
  - [ ] CI/CD 配置（ci）
  - [ ] 其他（chore）

  ### 测试覆盖
  - [ ] 单元测试
  - [ ] 集成测试
  - [ ] 手工测试（附操作步骤）

  ### 性能影响
  {如有性能影响，说明影响范围与基准数据}

  ### 安全评审
  - [ ] 本变更涉及敏感数据处理
  - [ ] 本变更引入新权限
  - [ ] 本变更需要安全团队评审
  - [ ] 无安全影响

  ### 截图 / 附件
  {如有 UI 变更或附件，请在此附上}

PR Reviewer 规则：
  1. 小变更（≤ 200 行）：1 人 Review
  2. 大变更（> 200 行）：2 人 Review
  3. 核心路径（预警分发/AI 研判）：架构师 Review
  4. 安全相关：安全团队额外 Review
  5. PR 合并前 CI 必须通过（编译 + 单测 + Checkstyle + OWASP）

# ==================== CI/CD 配置（GitLab CI 或 GitHub Actions） ====================
触发规则：
  - main / develop：Push 触发全量 CI（编译 + 测试 + 构建镜像 + 部署）
  - feature/* / release/*：Push 触发 CI（编译 + 测试 + OWASP）
  - hotfix/*：Push 触发 CI（编译 + 测试 + 快速部署）

CI 流水线阶段：
  1. 编译与静态检查
  2. 单元测试 + 覆盖率
  3. OWASP 依赖安全扫描
  4. 构建多平台 Docker 镜像（AMD64 + ARM64）
  5. 推送 Harbor
  6. 部署到测试环境（仅 develop 分支）
  7. 部署到生产环境（仅 release 分支，需人工确认）

# ==================== 代码所有者（CODEOWNERS） ====================
/silver-guard/silver-guard-common/          @backend-team
/silver-guard/silver-guard-core/             @backend-team
/silver-guard/silver-guard-ai/               @ai-team
/silver-guard/silver-guard-gateway/          @gateway-team
/silver-guard/silver-guard-app/              @backend-team @ops-team
/sql/                                         @backend-team @dba-team
/docs/                                        @product-team
.ci/                                          @ops-team
.github/workflows/                           @ops-team
pom.xml                                       @backend-team
*.md                                          @product-team

# ==================== 安全与合规 ====================
敏感信息规则（禁止硬编码！）：
  1. 数据库密码 → 使用环境变量
  2. LLM API Key → 使用环境变量 / Nacos 配置中心
  3. 短信/电话/推送通道 Key → 使用环境变量
  4. 个人敏感信息（身份证号 / 手机号） → 严禁写入代码或日志
  5. Trace ID / 日志不得包含敏感字段

审计日志：
  - 所有写操作（CREATE/UPDATE/DELETE）自动记录
  - 所有阈值调整 / 权限变更自动记录
  - 日志不可篡改（写入后不可更新，仅可追加）

# ==================== 其他 ====================
命名规范（文件/类）：
  Java 类名：驼峰（如 EventService.java）
  目录/文件：全小写 + 短横线（如 silver-guard-gateway）
  SQL 文件名：V{版本号}__{描述}.sql（Flyway 格式）
  接口路径：/api/v1/xxx

编码规范：
  - 4 空格缩进（禁止 Tab）
  - UTF-8 字符编码
  - LF 行尾（非 CRLF）
  - Spotless 自动格式化（CI 强制检查）
  - 阿里巴巴 Java 编码规范（Checkstyle 强制检查）

代码评审 Checklist：
  [ ] 功能是否符合 PRD v1.2 规格
  [ ] 是否有单元测试（Service 层 ≥ 70% 覆盖率）
  [ ] 是否有敏感信息（硬编码 Key / 密码 / 明文身份证号）
  [ ] 日志中是否包含敏感数据（需脱敏）
  [ ] 是否正确处理异常与错误码
  [ ] 是否引入新的外部依赖（需评审必要性 + 版本）
  [ ] 性能是否达标（特别是 30 秒 SLA 链路相关）
  [ ] 是否更新了 README / 相关文档
  [ ] CI 是否通过（编译 + 单测 + Checkstyle + OWASP）
  [ ] Reviewer 确认（≥ 1 人，核心路径需 ≥ 2 人）
