package com.silverguard.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限校验注解，标注在需要权限校验的 Controller 方法上。
 *
 * <p>示例：
 * <pre>
 * @RequirePermission("elder:create")
 * public ApiResult<Long> create(...) { ... }
 * </pre>
 *
 * <p>具体校验逻辑由 AOP 切面实现（见 silver-guard-core 中的权限切面）。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {

    /** 权限标识，如 "elder:create"。*/
    String value();
}
