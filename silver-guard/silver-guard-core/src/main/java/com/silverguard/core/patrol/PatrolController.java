package com.silverguard.core.patrol;

import com.silverguard.common.annotation.OperateLog;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ApiResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/patrols")
public class PatrolController {

    private final PatrolService patrolService;

    @GetMapping
    public ApiResult<CursorPage<PatrolRecord>> list(@RequestParam(required = false) Long elderId,
                                                    @RequestParam(required = false) Long userId,
                                                    @RequestParam(defaultValue = "0") long cursor,
                                                    @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(patrolService.page(elderId, userId, cursor, size));
    }

    @GetMapping("/{id}")
    public ApiResult<PatrolRecord> get(@PathVariable Long id) {
        return ApiResult.ok(patrolService.getById(id));
    }

    @PostMapping
    @OperateLog(module = "patrol", operation = "create")
    public ApiResult<Long> create(@RequestBody PatrolRecord record) {
        return ApiResult.ok(patrolService.create(record));
    }
}
