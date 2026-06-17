package com.silverguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Silver Guard · 应用启动入口
 *
 * @see <a href="file:///workspace/PRD-SilverGuard-v1.0.md">PRD v1.2</a>
 * @see <a href="file:///workspace/docs/Module-Ownership-Diagram.md">模块归属图</a>
 *
 * 架构说明：
 *  Phase 1：单体架构，模块以内包（package）划分
 *  Phase 2：拆分为 Spring Cloud 微服务，引入 Nacos + Dubbo
 */
@SpringBootApplication
@EnableAsync
public class SilverGuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(SilverGuardApplication.class, args);
    }
}
