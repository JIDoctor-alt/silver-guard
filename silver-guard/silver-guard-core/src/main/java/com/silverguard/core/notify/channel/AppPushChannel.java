package com.silverguard.core.notify.channel;

import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class AppPushChannel implements NotificationChannel {

    @Override
    public String getChannel() {
        return "APP";
    }

    @Override
    public void send(Long receiver, Map<String, Object> payload) {
        log.info("[AppPushChannel] 极光推送占位 receiver={} payload={}", receiver, payload);
        try {
        } catch (Exception e) {
            throw new BusinessException(ResultCode.NOTIFY_CHANNEL_FAILED, e);
        }
    }
}
