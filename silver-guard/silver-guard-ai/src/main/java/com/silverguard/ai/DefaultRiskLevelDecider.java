package com.silverguard.ai;

import com.silverguard.common.enums.EventLevel;
import org.springframework.stereotype.Component;

@Component
public class DefaultRiskLevelDecider implements RiskLevelDecider {

    @Override
    public EventLevel decide(EventJudgeResult result, ElderProfile profile) {
        if (result == null) return EventLevel.L2;
        double baseScore = (result.getEventLevel() - 1) * 25 + result.getConfidence() * 100;
        if (profile != null) {
            if (profile.getRecentEventsCount() != null && profile.getRecentEventsCount() > 3) {
                baseScore += 15;
            }
            if (profile.getTags() != null) {
                if (profile.getTags().contains("high-risk")) baseScore += 20;
                if (profile.getTags().contains("lonely")) baseScore += 10;
            }
        }
        if (baseScore >= 85) return EventLevel.L4;
        if (baseScore >= 65) return EventLevel.L3;
        if (baseScore >= 40) return EventLevel.L2;
        return EventLevel.L1;
    }
}
