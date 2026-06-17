package com.silverguard.core.event;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.context.UserContext;
import com.silverguard.common.context.UserContextHolder;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ResultCode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventMapper eventMapper;

    @InjectMocks
    private EventServiceImpl service;

    private Event sample;

    @BeforeEach
    void setUp() {
        sample = Event.builder()
                .id(1L)
                .elderId(11L)
                .deviceId(22L)
                .eventType("FALL_DETECTED")
                .eventLevel(3)
                .confidence(0.85d)
                .source("AI")
                .status(EventStatusMachine.OPEN)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
    }

    @AfterEach
    void clean() {
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("getById_存在_返回事件")
    void getById_existing() {
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        Event e = service.getById(1L);
        assertEquals(1L, e.getId());
    }

    @Test
    @DisplayName("getById_不存在_抛EVENT_NOT_FOUND")
    void getById_missing() {
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.getById(99L));
        assertEquals(ResultCode.EVENT_NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("create_默认状态OPEN_自动写gmtCreate")
    void create_defaults() {
        Event ev = Event.builder()
                .elderId(11L)
                .eventType("WATER_LEAK")
                .build();
        org.mockito.Mockito.doAnswer(invocation -> {
            Event e = invocation.getArgument(0);
            e.setId(99L);
            return 1;
        }).when(eventMapper).insert(any(Event.class));

        Long id = service.create(ev);
        assertEquals(99L, id);
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventMapper).insert(captor.capture());
        Event saved = captor.getValue();
        assertEquals(EventStatusMachine.OPEN, saved.getStatus());
        assertNotNull(saved.getGmtCreate());
        assertNotNull(saved.getGmtModified());
        assertNotNull(saved.getFirstReportAt());
    }

    @Test
    @DisplayName("assign_OPEN状态_转ASSIGNED")
    void assign_fromOpen() {
        sample.setStatus(EventStatusMachine.OPEN);
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.assign(1L, 99L);
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventMapper).update(captor.capture());
        assertEquals(EventStatusMachine.ASSIGNED, captor.getValue().getStatus());
        assertEquals(99L, captor.getValue().getAssignedUserId());
    }

    @Test
    @DisplayName("assign_CLOSED状态_抛状态流转非法")
    void assign_fromClosed_invalid() {
        sample.setStatus(EventStatusMachine.CLOSED);
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.assign(1L, 1L));
        assertEquals(ResultCode.EVENT_STATUS_TRANSITION_INVALID, ex.getResultCode());
        verify(eventMapper, never()).update(any());
    }

    @Test
    @DisplayName("handle_从ASSIGNED_转CLOSED_operatorId来自上下文")
    void handle_fromAssigned() {
        UserContext ctx = new UserContext();
        ctx.setUserId(555L);
        UserContextHolder.set(ctx);

        sample.setStatus(EventStatusMachine.ASSIGNED);
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.handle(1L, "已上门处理", null);
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventMapper).update(captor.capture());
        Event saved = captor.getValue();
        assertEquals(EventStatusMachine.CLOSED, saved.getStatus());
        assertEquals(555L, saved.getClosedBy());
        assertEquals("已上门处理", saved.getCloseReason());
        assertNotNull(saved.getClosedAt());
    }

    @Test
    @DisplayName("handle_从CLOSED_不允许再次关闭")
    void handle_fromClosed_invalid() {
        sample.setStatus(EventStatusMachine.CLOSED);
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        assertThrows(BusinessException.class, () -> service.handle(1L, "x", null));
    }

    @Test
    @DisplayName("markFalseAlarm_从OPEN_转FALSE_ALARM_operatorId传参优先")
    void markFalseAlarm() {
        sample.setStatus(EventStatusMachine.OPEN);
        when(eventMapper.selectOneByQuery(any(QueryWrapper.class))).thenReturn(sample);
        service.markFalseAlarm(1L, "测试用例", 888L);
        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventMapper).update(captor.capture());
        Event saved = captor.getValue();
        assertEquals(EventStatusMachine.FALSE_ALARM, saved.getStatus());
        assertEquals(888L, saved.getClosedBy());
        assertEquals("测试用例", saved.getCloseReason());
    }

    @Test
    @DisplayName("page_数量达limit+1_有nextCursor")
    void page_withMore() {
        Event a = sample.toBuilder().id(1L).gmtCreate(Instant.ofEpochMilli(3_000_000L)).build();
        Event b = sample.toBuilder().id(2L).gmtCreate(Instant.ofEpochMilli(2_000_000L)).build();
        when(eventMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of(a, b));
        CursorPage<Event> page = service.page(null, null, null, 1);
        assertEquals(1, page.getSize());
        assertTrue(page.isHasMore());
        assertEquals(3_000_000L, page.getNextCursor());
    }

    @Test
    @DisplayName("page_空集合_无nextCursor")
    void page_empty() {
        when(eventMapper.selectListByQuery(any(QueryWrapper.class))).thenReturn(List.of());
        CursorPage<Event> page = service.page(null, null, null, 10);
        assertFalse(page.isHasMore());
        assertNull(page.getNextCursor());
        assertEquals(0, page.getSize());
    }
}
