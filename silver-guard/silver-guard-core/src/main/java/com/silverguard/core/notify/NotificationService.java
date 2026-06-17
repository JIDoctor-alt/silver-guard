package com.silverguard.core.notify;

import com.mybatisflex.core.paginate.Page;

import java.util.List;

public interface NotificationService {

    Notification send(Long eventId, String channel, Long receiverId, String receiverType, String payloadJson);

    Page<Notification> list(int page, int size, Long eventId);

    Notification getById(Long id);

    List<Notification> listByEvent(Long eventId);

    Notification ack(Long notificationId);

    Notification retry(Long notificationId);
}
