package com.silverguard.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventJudgeResult {

    private String eventType;
    private int eventLevel;
    private double confidence;
    private String aiExplanation;
    private String aiModelVersion;
    private long judgeLatencyMs;
    private boolean fallbackRule;
}
