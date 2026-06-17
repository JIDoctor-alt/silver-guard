package com.silverguard.ai.aop;

import com.silverguard.common.annotation.AgentExecution;
import com.silverguard.common.util.TraceUtil;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class AgentExecutionAspect {

    @Pointcut("@annotation(agent)")
    public void agentPointcut(AgentExecution agent) {}

    @Around(value = "agentPointcut(agent)", argNames = "pjp,agent")
    public Object around(ProceedingJoinPoint pjp, AgentExecution agent) throws Throwable {
        long start = System.currentTimeMillis();
        String node = agent.node() == null || agent.node().isEmpty()
                ? pjp.getSignature().getName() : agent.node();
        String traceId = TraceUtil.getTraceId();
        if (agent.logInput()) {
            log.info("[ai.node.{}] trace={} start args={}", node, traceId, pjp.getArgs());
        } else {
            log.info("[ai.node.{}] trace={} start", node, traceId);
        }
        try {
            Object result = pjp.proceed();
            long ms = System.currentTimeMillis() - start;
            if (agent.logOutput()) {
                log.info("[ai.node.{}] trace={} done latency={}ms result={}",
                        node, traceId, ms, result);
            } else {
                log.info("[ai.node.{}] trace={} done latency={}ms", node, traceId, ms);
            }
            return result;
        } catch (Throwable t) {
            long ms = System.currentTimeMillis() - start;
            log.warn("[ai.node.{}] trace={} failed latency={}ms err={}",
                    node, traceId, ms, t.getMessage());
            throw t;
        }
    }
}
