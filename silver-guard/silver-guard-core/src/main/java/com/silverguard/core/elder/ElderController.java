package com.silverguard.core.elder;

import com.silverguard.common.annotation.OperateLog;
import com.silverguard.common.annotation.RequirePermission;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ApiResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/elders")
public class ElderController {

    private final ElderService elderService;

    @GetMapping
    public ApiResult<CursorPage<ElderDTO>> list(
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) Integer riskLevel,
            @RequestParam(defaultValue = "0") long cursor,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(elderService.page(communityId, riskLevel, cursor, size));
    }

    @GetMapping("/{id}")
    public ApiResult<ElderDTO> get(@PathVariable Long id) {
        return ApiResult.ok(elderService.getById(id));
    }

    @PostMapping
    @RequirePermission("elder:create")
    @OperateLog(module = "elder", operation = "create")
    public ApiResult<Long> create(@Valid @RequestBody ElderCreateCmd cmd) {
        return ApiResult.ok(elderService.create(cmd));
    }

    @PutMapping("/{id}")
    @RequirePermission("elder:update")
    @OperateLog(module = "elder", operation = "update")
    public ApiResult<Void> update(@PathVariable Long id, @Valid @RequestBody ElderCreateCmd cmd) {
        elderService.update(id, cmd);
        return ApiResult.ok();
    }

    @DeleteMapping("/{id}")
    @RequirePermission("elder:delete")
    @OperateLog(module = "elder", operation = "delete")
    public ApiResult<Void> delete(@PathVariable Long id) {
        elderService.delete(id);
        return ApiResult.ok();
    }

    @PostMapping("/{id}/family")
    @RequirePermission("elder:bind")
    @OperateLog(module = "elder", operation = "bind-family")
    public ApiResult<Void> bindFamily(@PathVariable Long id, @RequestParam Long guardianUserId) {
        elderService.bindFamily(id, guardianUserId);
        return ApiResult.ok();
    }
}
