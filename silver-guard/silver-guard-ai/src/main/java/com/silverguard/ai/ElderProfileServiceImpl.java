package com.silverguard.ai;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.mybatisflex.core.query.QueryWrapper;
import com.silverguard.core.elder.Elder;
import com.silverguard.core.elder.ElderMapper;
import com.silverguard.core.event.Event;
import com.silverguard.core.event.EventMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElderProfileServiceImpl implements ElderProfileService {

    private final ElderMapper elderMapper;
    private final EventMapper eventMapper;

    private final Cache<Long, ElderProfile> cache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(30))
            .build();

    @Override
    public ElderProfile getById(Long elderId) {
        if (elderId == null) return null;
        return cache.get(elderId, this::buildProfile);
    }

    @Override
    public ElderProfile refresh(Long elderId) {
        cache.invalidate(elderId);
        return getById(elderId);
    }

    private ElderProfile buildProfile(Long elderId) {
        QueryWrapper elderQ = QueryWrapper.create();
        elderQ.from("sg_elder");
        elderQ.where("id = {0}", elderId);
        Elder elder = elderMapper.selectOneByQuery(elderQ);
        if (elder == null) {
            return ElderProfile.builder().elderId(elderId).build();
        }
        QueryWrapper eventQ = QueryWrapper.create();
        eventQ.from("sg_event");
        eventQ.where("elder_id = {0}", elderId);
        eventQ.where("gmt_create > {0}",
                java.time.Instant.now().minus(java.time.Duration.ofDays(7)).toEpochMilli());
        List<Event> events = eventMapper.selectListByQuery(eventQ);
        int count = events == null ? 0 : events.size();
        List<String> tags = Collections.emptyList();
        if (elder.getTags() != null && !elder.getTags().isBlank()) {
            tags = Arrays.stream(elder.getTags().split(",")).map(String::trim).collect(Collectors.toList());
        }
        return ElderProfile.builder()
                .elderId(elderId)
                .riskLevel(elder.getRiskLevel())
                .tags(tags)
                .recentEventsCount(count)
                .avgDailyActivityScore(Math.max(0, 100 - count * 5))
                .build();
    }
}
