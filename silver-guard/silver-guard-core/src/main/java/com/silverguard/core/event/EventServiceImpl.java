package com.silverguard.core.event;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventMapper eventMapper;

    @Override
    public CursorPage<Event> page(Long communityId, String status, Integer eventLevel, long cursor, int size) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_event");
        wrapper.orderBy("gmt_create desc");
        if (communityId != null) wrapper.where("community_id = {0}", communityId);
        if (status != null && !status.isBlank()) wrapper.where("status = {0}", status);
        if (eventLevel != null) wrapper.where("event_level = {0}", eventLevel);
        if (cursor > 0) wrapper.where("gmt_create < {0}", Instant.ofEpochMilli(cursor));
        int limit = Math.min(Math.max(size, 1), 100);
        wrapper.limit(limit + 1);
        List<Event> events = eventMapper.selectListByQuery(wrapper);
        boolean hasMore = events.size() > limit;
        List<Event> records = hasMore ? events.subList(0, limit) : events;
        Long nextCursor = null;
        if (hasMore && !records.isEmpty()) {
            nextCursor = records.get(records.size() - 1).getGmtCreate().toEpochMilli();
        }
        return CursorPage.of(new ArrayList<>(records), nextCursor, records.size());
    }

    @Override
    public Event getById(Long id) {
        QueryWrapper wrapper = QueryWrapper.create();
        wrapper.from("sg_event");
        wrapper.where("id = {0}", id);
        Event event = eventMapper.selectOneByQuery(wrapper);
        if (event == null) {
            throw new BusinessException(ResultCode.EVENT_NOT_FOUND);
        }
        return event;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(Event event) {
        event.setId(null);
        if (event.getStatus() == null) event.setStatus(EventStatusMachine.OPEN);
        event.setGmtCreate(Instant.now());
        event.setGmtModified(Instant.now());
        if (event.getFirstReportAt() == null) event.setFirstReportAt(Instant.now());
        eventMapper.insert(event);
        log.info("[event.create] eventId={} type={} level={} traceId={}",
                event.getId(), event.getEventType(), event.getEventLevel(),
                com.silverguard.common.util.TraceUtil.getTraceId());
        return event.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assign(Long eventId, Long userId) {
        Event event = getById(eventId);
        if (!EventStatusMachine.isValid(event.getStatus(), EventStatusMachine.ASSIGNED)) {
            throw new BusinessException(ResultCode.EVENT_STATUS_TRANSITION_INVALID);
        }
        event.setStatus(EventStatusMachine.ASSIGNED);
        event.setAssignedUserId(userId);
        event.setGmtModified(Instant.now());
        eventMapper.update(event);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handle(Long eventId, String closeReason, Long operatorId) {
        Event event = getById(eventId);
        if (!EventStatusMachine.isValid(event.getStatus(), EventStatusMachine.CLOSED)) {
            throw new BusinessException(ResultCode.EVENT_STATUS_TRANSITION_INVALID);
        }
        event.setStatus(EventStatusMachine.CLOSED);
        event.setClosedBy(operatorId == null ? UserContextHolder.userId() : operatorId);
        event.setClosedAt(Instant.now());
        event.setCloseReason(closeReason);
        event.setGmtModified(Instant.now());
        eventMapper.update(event);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markFalseAlarm(Long eventId, String reason, Long operatorId) {
        Event event = getById(eventId);
        if (!EventStatusMachine.isValid(event.getStatus(), EventStatusMachine.FALSE_ALARM)) {
            throw new BusinessException(ResultCode.EVENT_STATUS_TRANSITION_INVALID);
        }
        event.setStatus(EventStatusMachine.FALSE_ALARM);
        event.setClosedBy(operatorId == null ? UserContextHolder.userId() : operatorId);
        event.setClosedAt(Instant.now());
        event.setCloseReason(reason);
        event.setGmtModified(Instant.now());
        eventMapper.update(event);
    }
}
