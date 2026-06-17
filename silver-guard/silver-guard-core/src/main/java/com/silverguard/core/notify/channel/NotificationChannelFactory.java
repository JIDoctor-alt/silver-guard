package com.silverguard.core.notify.channel;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class NotificationChannelFactory {

    private final Map<String, NotificationChannel> channelMap;

    public NotificationChannelFactory(List<NotificationChannel> channels) {
        this.channelMap = new HashMap<>();
        for (NotificationChannel channel : channels) {
            channelMap.put(channel.getChannel(), channel);
        }
    }

    public NotificationChannel get(String channel) {
        if (channel == null) {
            return null;
        }
        return channelMap.get(channel.toUpperCase());
    }
}
