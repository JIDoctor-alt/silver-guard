package com.silverguard.common.exception;

import com.silverguard.common.result.ResultCode;
import lombok.Getter;

import java.io.Serial;

/**
 * 业务异常。
 *
 * <p>所有业务异常统一抛出 {@link BusinessException}，由全局异常处理器统一处理。
 * 技术类异常（如 NPE、IO 异常等）不使用此类，应向上抛给框架统一包装为 5xx。
 */
@Getter
public class BusinessException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    private final ResultCode resultCode;
    private final Object detail;

    public BusinessException(ResultCode rc) {
        super(rc.getMessage());
        this.resultCode = rc;
        this.detail = null;
    }

    public BusinessException(ResultCode rc, String customMessage) {
        super(customMessage);
        this.resultCode = rc;
        this.detail = null;
    }

    public BusinessException(ResultCode rc, Throwable cause) {
        super(rc.getMessage(), cause);
        this.resultCode = rc;
        this.detail = null;
    }

    public BusinessException(ResultCode rc, Object detail) {
        super(rc.getMessage());
        this.resultCode = rc;
        this.detail = detail;
    }
}
