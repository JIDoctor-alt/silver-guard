package com.silverguard.gateway;

import cn.hutool.crypto.SecureUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DeviceSignatureValidator {

    private final String deviceSecret;

    public DeviceSignatureValidator(
            @Value("${silverguard.device.secret:silverguard-device-shared-secret}") String deviceSecret) {
        this.deviceSecret = deviceSecret;
    }

    public boolean validate(String deviceSn, String payload, String signature) {
        if (signature == null || signature.isEmpty()) return false;
        String expected = SecureUtil.hmacSha256(deviceSecret).digestHex(deviceSn + "|" + payload);
        boolean ok = expected.equalsIgnoreCase(signature);
        if (!ok) {
            log.warn("[device.signature] mismatch deviceSn={}", deviceSn);
        }
        return ok;
    }
}
