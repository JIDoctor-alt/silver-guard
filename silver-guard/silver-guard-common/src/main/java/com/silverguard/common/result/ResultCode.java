package com.silverguard.common.result;

import lombok.Getter;

/**
 * 全局响应码枚举。
 *
 * <p>约定：
 * <pre>
 * 1xx - 保留（HTTP 语义）
 * 200 - 成功
 * 4xx - 客户端错误（参数 / 权限 / 资源不存在）
 * 5xx - 服务端错误（系统 / 依赖）
 * 1xxx - 业务错误（分模块：老人 / 设备 / 事件 / 通知 / 巡检）
 * </pre>
 */
@Getter
public enum ResultCode {

    SUCCESS(200, "ok"),

    // 4xx 客户端错误
    BAD_REQUEST(400, "请求参数不合法"),
    UNAUTHORIZED(401, "未授权或 Token 已失效"),
    FORBIDDEN(403, "没有操作权限"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "HTTP 方法不允许"),
    CONFLICT(409, "数据冲突（唯一约束）"),

    // 5xx 系统错误
    INTERNAL_ERROR(500, "系统内部错误"),
    SERVICE_UNAVAILABLE(503, "服务暂时不可用"),
    TIMEOUT(504, "服务调用超时"),

    // 业务错误
    ELDER_NOT_FOUND(1001, "老人档案不存在"),
    ELDER_ALREADY_EXISTS(1002, "老人档案已存在（相同身份证）"),
    ELDER_NAME_EMPTY(1003, "老人姓名不能为空"),

    DEVICE_NOT_FOUND(1101, "设备不存在"),
    DEVICE_OFFLINE(1102, "设备离线"),
    DEVICE_SIGNATURE_INVALID(1103, "设备签名校验失败"),
    DEVICE_DISABLED(1104, "设备已禁用"),

    EVENT_NOT_FOUND(1201, "事件不存在"),
    EVENT_STATUS_TRANSITION_INVALID(1202, "事件状态流转不合法"),
    EVENT_ASSIGN_NOT_ALLOWED(1203, "无权限分配此事件"),

    NOTIFY_CHANNEL_FAILED(1301, "通知通道调用失败"),
    NOTIFY_TEMPLATE_NOT_FOUND(1302, "通知模板不存在"),

    PATROL_NOT_FOUND(1401, "巡检记录不存在"),

    USER_NOT_FOUND(1501, "用户不存在"),
    USER_PASSWORD_INVALID(1502, "密码错误"),
    USER_NAME_CONFLICT(1503, "用户名已存在"),
    USER_SMS_CODE_INVALID(1504, "短信验证码错误或已过期"),

    // 限流 / 幂等
    RATE_LIMIT_EXCEEDED(2001, "访问过于频繁，请稍后再试"),
    REPEAT_SUBMIT(2002, "重复提交"),

    // 外部依赖
    LLM_CALL_FAILED(3001, "AI 模型调用失败，请稍后再试"),
    SMS_GATEWAY_FAILED(3002, "短信网关调用失败"),
    DATABASE_ERROR(3003, "数据库操作失败");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
