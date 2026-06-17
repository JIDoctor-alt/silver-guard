package com.silverguard.common.exception;

import java.io.Serial;

/**
 * 未授权异常（Token 失效 / 缺失 / 越权）。
 */
public class UnauthorizedException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    public UnauthorizedException() {
        super();
    }

    public UnauthorizedException(String message) {
        super(message);
    }
}
