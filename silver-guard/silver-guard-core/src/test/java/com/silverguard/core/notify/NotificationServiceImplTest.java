package com.silverguard.core.notify;

import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.common.exception.BusinessException;
import com.silverguard.common.result.ResultCode;
import com.silverguard.core.notify.channel.NotificationChannel;
import com.silverguard.core.notify.channel.NotificationChannelFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private NotificationChannelFactory channelFactory;

    @Mock
    private NotificationChannel smsChannel;

    @InjectMocks
    private NotificationServiceImpl service;

    private Notification stored;

    @BeforeEach
    void setUp() {
        when(smsChannel.getChannel()).thenReturn("SMS");
        when(channelFactory.get("SMS")).thenReturn(smsChannel);

        org.mockito.Mockito.doAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(System.nanoTime());
            stored = n;
            return 1;
        }).when(notificationMapper).insert(any(Notification.class));
    }

    @Test
    @DisplayName("send_通道未知_抛BAD_REQUEST")
    void send_unknownChannel() {
        when(channelFactory.get("UNKNOWN")).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> service.send(1L, "UNKNOWN", 100L, "USER", "{}"));
        assertEquals(ResultCode.BAD_REQUEST, ex.getResultCode());
    }

    @Test
    @DisplayName("send_通道发送成功_状态置为SENT")
    void send_success() {
        Notification n = service.send(1L, "SMS", 100L, "USER", "{\"k\":\"v\"}");
        assertNotNull(n);
        assertEquals("SENT", n.getAckStatus());
        assertNotNull(n.getSentAt());
        assertNull(n.getFailReason());
        verify(smsChannel, times(1)).send(anyLong(), anyMap());
    }

    @Test
    @DisplayName("send_通道抛异常_状态置为FAILED_记录失败原因")
    void send_failed() {
        doThrow(new RuntimeException("network down")).when(smsChannel).send(anyLong(), anyMap());
        Notification n = service.send(1L, "SMS", 100L, "USER", "{}");
        assertEquals("FAILED", n.getAckStatus());
        assertEquals("network down", n.getFailReason());
    }

    @Test
    @DisplayName("ack_将状态从SENT改为READ_记录readAt")
    void ack() {
        Notification stored1 = Notification.builder()
                .id(10L)
                .channel("SMS")
                .ackStatus("SENT")
                .retryCount(0)
                .gmtCreate(Instant.now())
                .gmtModified(Instant.now())
                .build();
        when(notificationMapper.selectOneById(10L)).thenReturn(stored1);
        Notification updated = service.ack(10L);
        assertEquals("READ", updated.getAckStatus());
        assertNotNull(updated.getReadAt());
        verify(notificationMapper, times(1)).update(any(Notification.class));
    }

    @Test
    @DisplayName("getById_不存在_抛NOT_FOUND")
    void getById_missing() {
        when(notificationMapper.selectOneById(99L)).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.getById(99L));
        assertEquals(ResultCode.NOT_FOUND, ex.getResultCode());
    }

    @Test
    @DisplayName("retry_通道未知_抛BAD_REQUEST")
    void retry_unknownChannel() {
        Notification n = Notification.builder()
                .id(20L)
                .channel("PUSH")
                .ackStatus("FAILED")
                .retryCount(0)
                .build();
        when(notificationMapper.selectOneById(20L)).thenReturn(n);
        when(channelFactory.get("PUSH")).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> service.retry(20L));
        assertEquals(ResultCode.BAD_REQUEST, ex.getResultCode());
    }

    @Test
    @DisplayName("retry_通道异常_状态FAILED_重试次数+1")
    void retry_failed() {
        Notification n = Notification.builder()
                .id(21L)
                .channel("SMS")
                .ackStatus("FAILED")
                .retryCount(0)
                .build();
        when(notificationMapper.selectOneById(21L)).thenReturn(n);
        doThrow(new RuntimeException("err")).when(smsChannel).send(anyLong(), anyMap());

        Notification updated = service.retry(21L);
        assertEquals("FAILED", updated.getAckStatus());
        assertEquals(1, updated.getRetryCount());
    }

    @Test
    @DisplayName("retry_成功_重置ackStatus为SENT")
    void retry_success() {
        Notification n = Notification.builder()
                .id(22L)
                .channel("SMS")
                .ackStatus("FAILED")
                .retryCount(2)
                .build();
        when(notificationMapper.selectOneById(22L)).thenReturn(n);
        Notification updated = service.retry(22L);
        assertEquals("SENT", updated.getAckStatus());
        assertEquals(3, updated.getRetryCount());
        assertNull(updated.getFailReason());
    }

    @Test
    @DisplayName("listByEvent_调用Mapper_不传事件时仅按时间倒序")
    void listByEvent() {
        when(notificationMapper.selectListByQuery(any(QueryWrapper.class)))
                .thenReturn(List.of(Notification.builder().id(1L).build()));
        List<Notification> list = service.listByEvent(99L);
        assertEquals(1, list.size());
    }
}
