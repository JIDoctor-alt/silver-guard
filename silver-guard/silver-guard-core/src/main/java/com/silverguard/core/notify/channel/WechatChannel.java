package com.silverguard.core.notify.channel;

import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class WechatChannel implements NotificationChannel {

    @Override
    public String getChannel() {
        return "WECHAT";
    }

    @Override
    public void send(Long receiver, Map<String, Object> payload) {
        log.info("[WechatChannel] 微信占位 receiver={} payload={}", receiver, payload);
        try {
        } catch (Exception e) {
            throw new BusinessException(ResultCode.NOTIFY_CHANNEL_FAILED, e);
        }
    }
}
