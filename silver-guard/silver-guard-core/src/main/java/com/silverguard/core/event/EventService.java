package com.silverguard.core.event;

import com.silverguard.common.model.CursorPage;

public interface EventService {

    CursorPage<Event> page(Long communityId, String status, Integer eventLevel, long cursor, int size);

    Event getById(Long id);

    Long create(Event event);

    void assign(Long eventId, Long userId);

    void handle(Long eventId, String closeReason, Long operatorId);

    void markFalseAlarm(Long eventId, String reason, Long operatorId);
}
