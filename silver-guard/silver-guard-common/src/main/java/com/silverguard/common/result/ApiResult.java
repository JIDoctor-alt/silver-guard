package com.silverguard.common.result;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

/**
 * 统一响应结构
 *
 * <p>所有对外 REST 接口均返回此结构。成功/失败的区分通过 {@code code}
 * 判断。前端可约定：
 * <pre>
 *     code == 200 -> 成功
 *     code >= 400 -> 业务异常或参数错误
 *     code >= 500 -> 系统异常
 * </pre>
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResult<T> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 响应码（200 表示成功）
     */
    private int code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 业务数据
     */
    private T data;

    /**
     * 响应时间戳（毫秒，UTC）
     */
    private long timestamp;

    /**
     * 链路追踪 ID（便于定位请求）
     */
    private String traceId;

    public ApiResult() {
        this.timestamp = Instant.now().toEpochMilli();
    }

    public ApiResult(int code, String message, T data) {
        this();
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResult<T> ok(T data) {
        return new ApiResult<>(200, "ok", data);
    }

    public static <T> ApiResult<T> ok() {
        return new ApiResult<>(200, "ok", null);
    }

    public static <T> ApiResult<T> fail(int code, String message) {
        return new ApiResult<>(code, message, null);
    }

    public static <T> ApiResult<T> fail(ResultCode rc) {
        return new ApiResult<>(rc.getCode(), rc.getMessage(), null);
    }

    public static <T> ApiResult<T> fail(ResultCode rc, String customMessage) {
        return new ApiResult<>(rc.getCode(), customMessage, null);
    }
}
