package com.silverguard.ai;

import com.silverguard.common.enums.EventLevel;

public interface RiskLevelDecider {

    EventLevel decide(EventJudgeResult judgeResult, ElderProfile profile);
}
