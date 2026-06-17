package com.silverguard.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标识需要被 AI 执行链路追踪的方法。
 *
 * <p>AI 子系统使用此注解来记录调用耗时、输入参数、输出结果，并配合 {@code traceId}
 * 组成完整可观测链路。AOP 切面位于 silver-guard-ai 模块。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AgentExecution {

    /**
     * 节点名称，如 "sense" / "judge" / "notify"。
     */
    String node() default "";

    /**
     * 是否记录输入参数（敏感数据建议关闭）。
     */
    boolean logInput() default true;

    /**
     * 是否记录输出结果。
     */
    boolean logOutput() default false;
}
