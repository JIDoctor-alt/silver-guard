package com.silverguard.common.model;

import lombok.Data;

import java.util.List;

/**
 * 游标分页响应结构。
 *
 * @param <T> 记录类型
 */
@Data
public class CursorPage<T> {

    /**
     * 当前页数据。
     */
    private List<T> records;

    /**
     * 下一页游标（作为下一次查询的 cursor 字段传入）。
     * <p>为 null 表示已到末尾。
     */
    private Long nextCursor;

    /**
     * 当前页大小。
     */
    private int size;

    /**
     * 是否还有下一页。
     */
    private boolean hasMore;

    public static <T> CursorPage<T> of(List<T> records, Long nextCursor, int size) {
        CursorPage<T> page = new CursorPage<>();
        page.setRecords(records);
        page.setNextCursor(nextCursor);
        page.setSize(size);
        page.setHasMore(nextCursor != null);
        return page;
    }

    public static <T> CursorPage<T> empty() {
        CursorPage<T> page = new CursorPage<>();
        page.setRecords(List.of());
        page.setSize(0);
        page.setHasMore(false);
        return page;
    }
}
