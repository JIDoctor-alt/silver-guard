package com.silverguard.common.exception;

import com.silverguard.common.result.ApiResult;
import com.silverguard.common.result.ResultCode;
import com.silverguard.common.util.TraceUtil;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * 全局异常处理器。
 *
 * <p>所有业务异常、校验异常、系统异常均在此处统一包装为 {@link ApiResult}
 * 并附带 traceId 以便排查。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ApiResult<Void> handleBusiness(BusinessException ex) {
        log.warn("[业务异常] code={}, message={}", ex.getResultCode(), ex.getMessage());
        ApiResult<Void> result = ApiResult.fail(ex.getResultCode());
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ApiResult<Void> handleUnauthorized(UnauthorizedException ex) {
        ApiResult<Void> result = ApiResult.fail(ResultCode.UNAUTHORIZED);
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            BindException.class,
            ConstraintViolationException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ApiResult<Void> handleValidation(Exception ex) {
        log.info("[参数校验] {}", ex.getMessage());
        ApiResult<Void> result = ApiResult.fail(ResultCode.BAD_REQUEST);
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ApiResult<Void> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        ApiResult<Void> result = ApiResult.fail(ResultCode.METHOD_NOT_ALLOWED);
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public ApiResult<Void> handleDuplicateKey(DuplicateKeyException ex) {
        log.warn("[唯一键冲突] {}", ex.getMessage());
        ApiResult<Void> result = ApiResult.fail(ResultCode.CONFLICT);
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }

    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleUnknown(Exception ex) {
        log.error("[系统异常]", ex);
        ApiResult<Void> result = ApiResult.fail(ResultCode.INTERNAL_ERROR);
        result.setTraceId(TraceUtil.getTraceId());
        return result;
    }
}
