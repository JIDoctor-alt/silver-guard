package com.silverguard.common.enums;

import lombok.Getter;

/**
 * 事件状态流转。
 *
 * <p>流程：
 * <pre>
 *     OPEN → ASSIGNED → CLOSED
 *                    ↘ FALSE_ALARM
 * </pre>
 */
@Getter
public enum EventStatus {

    OPEN("待处理"),
    ASSIGNED("已分配网格员"),
    CLOSED("已关闭"),
    FALSE_ALARM("误报");

    private final String display;

    EventStatus(String display) {
        this.display = display;
    }
}
