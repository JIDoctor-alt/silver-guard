package com.silverguard.ai;

import lombok.Data;

@Data
public class SenseInput {

    private Long elderId;
    private String deviceId;
    private String deviceType;
    private String eventType;
    private String signalJson;
    private double confidence;
    private String room;
    private int hour;
}
