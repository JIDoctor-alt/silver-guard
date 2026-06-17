package com.silverguard.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

/**
 * 分布式限流注解。
 *
 * <p>被标注的方法（或类）在达到指定阈值时将抛出 {@link com.silverguard.common.exception.BusinessException}
 * （ResultCode = RATE_LIMIT_EXCEEDED）。底层依赖 Redisson 分布式锁 + RRateLimiter 实现。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimiter {

    /**
     * 限流键前缀。
     * <p>最终 key = prefix + (spEl=true 时结合参数)。
     */
    String prefix() default "silverguard:limit:";

    /**
     * 每秒允许通过的请求数。
     */
    double permitsPerSecond() default 10.0;

    /**
     * 获取令牌最大等待时间。
     */
    long timeout() default 0;

    TimeUnit timeUnit() default TimeUnit.SECONDS;
}
