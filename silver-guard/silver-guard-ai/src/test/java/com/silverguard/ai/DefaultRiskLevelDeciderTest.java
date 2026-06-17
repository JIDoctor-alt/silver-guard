package com.silverguard.ai;

import com.silverguard.common.enums.EventLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DefaultRiskLevelDeciderTest {

    private final DefaultRiskLevelDecider decider = new DefaultRiskLevelDecider();

    @Test
    @DisplayName("result为null_默认L2")
    void nullResult() {
        assertEquals(EventLevel.L2, decider.decide(null, null));
    }

    @Test
    @DisplayName("高基础分+high-risk标签_升级到L4")
    void escalateToL4() {
        EventJudgeResult result = EventJudgeResult.builder()
                .eventType("FALL")
                .eventLevel(4)
                .confidence(0.9)
                .build();
        ElderProfile profile = ElderProfile.builder()
                .riskLevel(3)
                .tags(List.of("high-risk"))
                .recentEventsCount(1)
                .build();
        // base = (4-1)*25 + 0.9*100 = 75 + 90 = 165 + 20(high-risk) = 185
        assertEquals(EventLevel.L4, decider.decide(result, profile));
    }

    @Test
    @DisplayName("中等分数+lonely_升级到L3")
    void escalateToL3() {
        EventJudgeResult result = EventJudgeResult.builder()
                .eventType("STILL")
                .eventLevel(2)
                .confidence(0.5)
                .build();
        ElderProfile profile = ElderProfile.builder()
                .tags(List.of("lonely"))
                .build();
        // base = 25 + 50 = 75 + 10(lonely) = 85
        assertEquals(EventLevel.L3, decider.decide(result, profile));
    }

    @Test
    @DisplayName("recentEventsCount>3_加分")
    void frequentEvents() {
        EventJudgeResult result = EventJudgeResult.builder()
                .eventLevel(2)
                .confidence(0.0)
                .build();
        ElderProfile profile = ElderProfile.builder()
                .recentEventsCount(5)
                .build();
        // base = 25 + 0 + 15(recent) = 40 -> L2
        assertEquals(EventLevel.L2, decider.decide(result, profile));
    }

    @Test
    @DisplayName("低分_降级L1")
    void downToL1() {
        EventJudgeResult result = EventJudgeResult.builder()
                .eventLevel(1)
                .confidence(0.0)
                .build();
        // base = 0
        assertEquals(EventLevel.L1, decider.decide(result, null));
    }
}
