package com.silverguard.core.notify;

import com.mybatisflex.core.paginate.Page;
import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import com.silverguard.common.util.TraceUtil;
import com.silverguard.core.notify.channel.NotificationChannel;
import com.silverguard.core.notify.channel.NotificationChannelFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationChannelFactory channelFactory;

    @Override
    public Notification send(Long eventId, String channel, Long receiverId, String receiverType, String payloadJson) {
        NotificationChannel notificationChannel = channelFactory.get(channel);
        if (notificationChannel == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "未知通知通道: " + channel);
        }

        Notification notification = Notification.builder()
                .eventId(eventId)
                .channel(channel)
                .receiverId(receiverId)
                .receiverType(receiverType)
                .payloadJson(payloadJson)
                .retryCount(0)
                .ackStatus("PENDING")
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();

        try {
            notificationChannel.send(receiverId, Map.of(
                    "eventId", eventId,
                    "payloadJson", payloadJson == null ? "" : payloadJson,
                    "traceId", TraceUtil.getTraceId()
            ));
            notification.setSentAt(Instant.now());
            notification.setAckStatus("SENT");
        } catch (Exception e) {
            log.warn("[notify] channel={} receiver={} 发送失败: {}", channel, receiverId, e.getMessage());
            notification.setAckStatus("FAILED");
            notification.setFailReason(e.getMessage());
        }

        notificationMapper.insert(notification);
        return notification;
    }

    @Override
    public Page<Notification> list(int page, int size, Long eventId) {
        QueryWrapper wrapper = QueryWrapper.create();
        if (eventId != null) {
            wrapper.where("event_id = {0}", eventId);
        }
        wrapper.orderBy("gmt_create desc");
        return notificationMapper.paginate(page, size, wrapper);
    }

    @Override
    public Notification getById(Long id) {
        Notification notification = notificationMapper.selectOneById(id);
        if (notification == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "通知不存在");
        }
        return notification;
    }

    @Override
    public List<Notification> listByEvent(Long eventId) {
        return notificationMapper.selectListByQuery(QueryWrapper.create()
                .where("event_id = {0}", eventId)
                .orderBy("gmt_create desc"));
    }

    @Override
    public Notification ack(Long notificationId) {
        Notification notification = getById(notificationId);
        notification.setAckStatus("READ");
        notification.setReadAt(Instant.now());
        notification.setGmtModified(Instant.now());
        notificationMapper.update(notification);
        return notification;
    }

    @Override
    public Notification retry(Long notificationId) {
        Notification notification = getById(notificationId);
        NotificationChannel notificationChannel = channelFactory.get(notification.getChannel());
        if (notificationChannel == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "未知通知通道: " + notification.getChannel());
        }

        try {
            notificationChannel.send(notification.getReceiverId(), Map.of(
                    "eventId", notification.getEventId(),
                    "payloadJson", notification.getPayloadJson() == null ? "" : notification.getPayloadJson(),
                    "traceId", TraceUtil.getTraceId()
            ));
            notification.setSentAt(Instant.now());
            notification.setAckStatus("SENT");
            notification.setFailReason(null);
        } catch (Exception e) {
            log.warn("[notify] retry channel={} receiver={} 发送失败: {}", notification.getChannel(), notification.getReceiverId(), e.getMessage());
            notification.setAckStatus("FAILED");
            notification.setFailReason(e.getMessage());
        }

        notification.setRetryCount(notification.getRetryCount() + 1);
        notification.setGmtModified(Instant.now());
        notificationMapper.update(notification);
        return notification;
    }
}
