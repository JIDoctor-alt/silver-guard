package com.silverguard.common.result;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiResultTest {

    @Test
    void ok_withData_carriesPayload() {
        ApiResult<String> r = ApiResult.ok("hello");
        assertEquals(200, r.getCode());
        assertEquals("ok", r.getMessage());
        assertEquals("hello", r.getData());
        assertTrue(r.getTimestamp() > 0);
    }

    @Test
    void ok_empty_buildsDefaultMessage() {
        ApiResult<Void> r = ApiResult.ok();
        assertEquals(200, r.getCode());
        assertEquals("ok", r.getMessage());
        assertNull(r.getData());
    }

    @Test
    void fail_withEnum_usesCodeAndMessage() {
        ApiResult<Void> r = ApiResult.fail(ResultCode.ELDER_NOT_FOUND);
        assertEquals(1001, r.getCode());
        assertEquals("老人档案不存在", r.getMessage());
    }

    @Test
    void fail_withCustomMessage_overridesDefault() {
        ApiResult<Void> r = ApiResult.fail(ResultCode.BAD_REQUEST, "id 不能为空");
        assertEquals(400, r.getCode());
        assertEquals("id 不能为空", r.getMessage());
    }

    @Test
    void setTraceId_writesField() {
        ApiResult<String> r = ApiResult.ok("data");
        r.setTraceId("abc-001");
        assertEquals("abc-001", r.getTraceId());
        assertNotNull(r);
    }

    @Test
    void timestamp_isNotZeroOnCreate() {
        ApiResult<String> r = ApiResult.ok("x");
        assertTrue(r.getTimestamp() > 0L);
        assertFalse(r.getTimestamp() < 0L);
    }
}
