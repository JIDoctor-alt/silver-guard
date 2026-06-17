package com.silverguard.ai;

import com.silverguard.common.annotation.AgentExecution;
import com.silverguard.common.enums.EventLevel;
import com.silverguard.common.util.TraceUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiJudgeService {

    private final RiskLevelDecider riskLevelDecider;
    private final ElderProfileService profileService;

    @AgentExecution(node = "judge", logOutput = true)
    public EventJudgeResult judge(SenseInput input) {
        long start = System.currentTimeMillis();
        try {
            ElderProfile profile = profileService.getById(input.getElderId());
            EventJudgeResult result = buildDefault(input);
            EventLevel level = riskLevelDecider.decide(result, profile);
            result.setEventLevel(level.getLevel());
            result.setJudgeLatencyMs(System.currentTimeMillis() - start);
            log.info("[ai.judge] trace={} type={} level={} latency={}ms",
                    TraceUtil.getTraceId(), input.getEventType(),
                    level.getDisplay(), result.getJudgeLatencyMs());
            return result;
        } catch (Exception ex) {
            log.warn("[ai.judge] fallback-to-rule, trace={}, err={}",
                    TraceUtil.getTraceId(), ex.getMessage());
            EventJudgeResult fallback = buildDefault(input);
            fallback.setFallbackRule(true);
            fallback.setAiExplanation("LLM 调用失败，已降级使用规则引擎判断结果");
            fallback.setJudgeLatencyMs(System.currentTimeMillis() - start);
            return fallback;
        }
    }

    private EventJudgeResult buildDefault(SenseInput input) {
        EventJudgeResult r = new EventJudgeResult();
        r.setEventType(input.getEventType() == null ? "UNKNOWN" : input.getEventType());
        r.setConfidence(input.getConfidence());
        r.setAiModelVersion("rule-v1");
        r.setAiExplanation("规则引擎：基于设备信号强度与老人画像综合评估");
        return r;
    }
}
