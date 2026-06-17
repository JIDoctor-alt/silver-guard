package com.silverguard.ai;

import com.silverguard.common.enums.EventLevel;
import com.silverguard.common.util.TraceUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiJudgeServiceTest {

    @Mock
    private RiskLevelDecider riskLevelDecider;

    @Mock
    private ElderProfileService profileService;

    @InjectMocks
    private AiJudgeService service;

    @BeforeEach
    void setUp() {
        TraceUtil.newTraceId();
    }

    @AfterEach
    void clean() {
        TraceUtil.clear();
    }

    @Test
    @DisplayName("正常流程_返回研判结果与最终等级")
    void happyPath() {
        SenseInput input = new SenseInput();
        input.setElderId(11L);
        input.setEventType("FALL_DETECTED");
        input.setConfidence(0.9);

        when(profileService.getById(11L)).thenReturn(ElderProfile.builder()
                .elderId(11L)
                .riskLevel(3)
                .tags(List.of("lonely"))
                .build());
        when(riskLevelDecider.decide(any(), any())).thenReturn(EventLevel.L4);

        EventJudgeResult result = service.judge(input);
        assertNotNull(result);
        assertEquals("FALL_DETECTED", result.getEventType());
        assertEquals(4, result.getEventLevel());
        assertEquals("rule-v1", result.getAiModelVersion());
        assertTrue(result.getJudgeLatencyMs() >= 0);
        assertEquals(false, result.isFallbackRule());
    }

    @Test
    @DisplayName("profileService抛异常_降级为规则引擎_标记fallbackRule=true")
    void profileThrows_fallback() {
        SenseInput input = new SenseInput();
        input.setElderId(11L);
        input.setEventType("WATER_LEAK");
        input.setConfidence(0.6);

        when(profileService.getById(11L)).thenThrow(new RuntimeException("redis down"));

        EventJudgeResult result = service.judge(input);
        assertEquals(true, result.isFallbackRule());
        assertEquals("WATER_LEAK", result.getEventType());
        assertNotNull(result.getAiExplanation());
        assertTrue(result.getAiExplanation().contains("降级"));
    }

    @Test
    @DisplayName("eventType为空_默认UNKNOWN")
    void unknownEventType() {
        SenseInput input = new SenseInput();
        input.setElderId(11L);
        input.setConfidence(0.5);

        when(profileService.getById(11L)).thenReturn(null);
        when(riskLevelDecider.decide(any(), any())).thenReturn(EventLevel.L1);

        EventJudgeResult result = service.judge(input);
        assertEquals("UNKNOWN", result.getEventType());
    }
}
