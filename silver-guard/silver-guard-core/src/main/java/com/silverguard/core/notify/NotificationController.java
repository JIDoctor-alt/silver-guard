package com.silverguard.core.notify;

import com.mybatisflex.core.paginate.Page;
import com.silverguard.common.result.ApiResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResult<Page<Notification>> list(@RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              @RequestParam(required = false) Long eventId) {
        return ApiResult.ok(notificationService.list(page, size, eventId));
    }

    @GetMapping("/{id}")
    public ApiResult<Notification> detail(@PathVariable Long id) {
        return ApiResult.ok(notificationService.getById(id));
    }

    @PostMapping("/{id}/ack")
    public ApiResult<Notification> ack(@PathVariable Long id) {
        return ApiResult.ok(notificationService.ack(id));
    }

    @PostMapping("/{id}/retry")
    public ApiResult<Notification> retry(@PathVariable Long id) {
        return ApiResult.ok(notificationService.retry(id));
    }

    @PostMapping
    public ApiResult<Notification> send(@RequestBody @Valid SendRequest request) {
        return ApiResult.ok(notificationService.send(request.getEventId(), request.getChannel(), request.getReceiverId(), request.getReceiverType(), request.getPayloadJson()));
    }

    @GetMapping("/event/{eventId}")
    public ApiResult<List<Notification>> listByEvent(@PathVariable Long eventId) {
        return ApiResult.ok(notificationService.listByEvent(eventId));
    }

    @Data
    public static class SendRequest implements Serializable {
        @NotNull
        private Long eventId;

        @NotNull
        private String channel;

        @NotNull
        private Long receiverId;

        private String receiverType;

        private String payloadJson;
    }
}
