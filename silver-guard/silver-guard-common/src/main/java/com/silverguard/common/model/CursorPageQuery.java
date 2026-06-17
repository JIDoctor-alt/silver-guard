package com.silverguard.common.model;

import lombok.Data;

import java.time.Instant;

/**
 * 游标分页查询基类（cursor-based pagination）。
 *
 * <p>相比 offset/limit，游标分页在大数据量场景下无性能退化，适合事件表
 * 这类持续增长的业务数据。默认使用主键时间（lastCreatedAt） + 主键 ID
 * 作为复合游标。
 */
@Data
public class CursorPageQuery {

    /**
     * 游标时间戳（毫秒，UTC）。首次查询传 0；后续传最后一条记录的 createdAt + 1。
     */
    private long cursor;

    /**
     * 每页大小，默认 20。
     */
    private int size = 20;

    /**
     * 排序方向：ASC / DESC，默认 DESC（最新在前）。
     */
    private String sort = "DESC";

    /**
     * 搜索关键词（可选）。
     */
    private String keyword;

    public Instant cursorAsInstant() {
        return cursor <= 0 ? Instant.EPOCH : Instant.ofEpochMilli(cursor);
    }
}
