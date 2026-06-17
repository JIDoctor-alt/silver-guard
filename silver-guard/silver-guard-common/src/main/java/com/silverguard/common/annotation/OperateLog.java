package com.silverguard.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志。
 *
 * <p>被标注的方法在执行后会自动生成一条审计日志（操作人、模块、操作、耗时等）。
 * 核心写操作（新增/修改/删除/分配/关闭事件）建议统一加上。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperateLog {

    /**
     * 模块名称。
     */
    String module();

    /**
     * 操作类型，如 "新增" / "修改" / "删除" / "分配预警" / "关闭事件"。
     */
    String operation();

    /**
     * 是否记录方法参数。
     */
    boolean logParams() default true;

    /**
     * 是否记录方法返回值。
     */
    boolean logResult() default false;
}
