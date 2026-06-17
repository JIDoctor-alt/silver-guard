package com.silverguard.core.event;

import com.silverguard.common.annotation.OperateLog;
import com.silverguard.common.annotation.RequirePermission;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ApiResult;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ApiResult<CursorPage<Event>> list(@RequestParam(required = false) Long communityId,
                                             @RequestParam(required = false) String status,
                                             @RequestParam(required = false) Integer eventLevel,
                                             @RequestParam(defaultValue = "0") long cursor,
                                             @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(eventService.page(communityId, status, eventLevel, cursor, size));
    }

    @GetMapping("/{id}")
    public ApiResult<Event> get(@PathVariable Long id) {
        return ApiResult.ok(eventService.getById(id));
    }

    @PostMapping
    @RequirePermission("event:create")
    @OperateLog(module = "event", operation = "create")
    public ApiResult<Long> create(@RequestBody Event event) {
        return ApiResult.ok(eventService.create(event));
    }

    @PostMapping("/{id}/assign")
    @RequirePermission("event:assign")
    @OperateLog(module = "event", operation = "assign")
    public ApiResult<Void> assign(@PathVariable Long id, @RequestParam Long userId) {
        eventService.assign(id, userId);
        return ApiResult.ok();
    }

    @PostMapping("/{id}/handle")
    @RequirePermission("event:handle")
    @OperateLog(module = "event", operation = "handle")
    public ApiResult<Void> handle(@PathVariable Long id, @RequestBody HandleRequest request) {
        eventService.handle(id, request.getReason(), null);
        return ApiResult.ok();
    }

    @PostMapping("/{id}/false-alarm")
    @RequirePermission("event:handle")
    @OperateLog(module = "event", operation = "false-alarm")
    public ApiResult<Void> falseAlarm(@PathVariable Long id, @RequestBody HandleRequest request) {
        eventService.markFalseAlarm(id, request.getReason(), null);
        return ApiResult.ok();
    }

    @Data
    public static class HandleRequest implements Serializable {
        private String reason;
    }
}
