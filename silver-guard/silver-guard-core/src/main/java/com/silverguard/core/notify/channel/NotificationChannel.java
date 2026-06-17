package com.silverguard.core.notify.channel;

import java.util.Map;

public interface NotificationChannel {

    String getChannel();

    void send(Long receiver, Map<String, Object> payload);
}
