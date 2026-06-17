package com.silverguard.core.user;

import com.silverguard.common.annotation.OperateLog;
import com.silverguard.common.annotation.RequirePermission;
import com.silverguard.common.model.CursorPage;
import com.silverguard.common.result.ApiResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @GetMapping
    @RequirePermission("user:list")
    public ApiResult<CursorPage<User>> list(@RequestParam(required = false) String role,
                                            @RequestParam(required = false) Long communityId,
                                            @RequestParam(defaultValue = "0") long cursor,
                                            @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(userService.page(role, communityId, cursor, size));
    }

    @GetMapping("/{id}")
    public ApiResult<User> get(@PathVariable Long id) {
        return ApiResult.ok(userService.findById(id));
    }

    @PostMapping
    @RequirePermission("user:create")
    @OperateLog(module = "user", operation = "create")
    public ApiResult<Long> create(@RequestBody User user) {
        return ApiResult.ok(userService.create(user));
    }

    @PutMapping("/{id}/role")
    @RequirePermission("user:update")
    @OperateLog(module = "user", operation = "update-role")
    public ApiResult<Void> updateRole(@PathVariable Long id, @RequestParam String role) {
        userService.updateRole(id, role);
        return ApiResult.ok();
    }

    @DeleteMapping("/{id}")
    @RequirePermission("user:delete")
    @OperateLog(module = "user", operation = "delete")
    public ApiResult<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ApiResult.ok();
    }
}
