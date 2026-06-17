package com.silverguard.common.enums;

import lombok.Getter;

/**
 * 设备类型。
 */
@Getter
public enum DeviceType {

    RADAR("毫米波雷达"),
    MOTION_IR("红外人体感应"),
    DOOR("门磁"),
    SOS("紧急按钮"),
    BAND("智能手环"),
    CAMERA("AI 摄像头"),
    SMOKE("烟雾报警器"),
    GAS("燃气报警器"),
    FALL("跌倒报警器");

    private final String display;

    DeviceType(String display) {
        this.display = display;
    }
}
