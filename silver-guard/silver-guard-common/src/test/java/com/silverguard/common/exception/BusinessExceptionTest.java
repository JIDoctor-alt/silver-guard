package com.silverguard.common.exception;

import com.silverguard.common.result.ResultCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class BusinessExceptionTest {

    @Test
    void defaultConstructor_usesCodeMessage() {
        BusinessException ex = new BusinessException(ResultCode.ELDER_NOT_FOUND);
        assertSame(ResultCode.ELDER_NOT_FOUND, ex.getResultCode());
        assertEquals("老人档案不存在", ex.getMessage());
        assertNull(ex.getDetail());
    }

    @Test
    void customMessage_overridesCodeMessage() {
        BusinessException ex = new BusinessException(ResultCode.BAD_REQUEST, "idCard 必填");
        assertSame(ResultCode.BAD_REQUEST, ex.getResultCode());
        assertEquals("idCard 必填", ex.getMessage());
    }

    @Test
    void withCause_keepsChain() {
        Throwable cause = new IllegalStateException("db down");
        BusinessException ex = new BusinessException(ResultCode.DATABASE_ERROR, cause);
        assertSame(ResultCode.DATABASE_ERROR, ex.getResultCode());
        assertSame(cause, ex.getCause());
        assertEquals("数据库操作失败", ex.getMessage());
    }

    @Test
    void withDetail_storesArbitraryPayload() {
        BusinessException ex = new BusinessException(ResultCode.CONFLICT, "conflict-detail");
        assertEquals("conflict-detail", ex.getDetail());
    }
}
