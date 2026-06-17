package com.silverguard.config;

import com.silverguard.common.context.UserContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Silver Guard · Web MVC 全局配置
 * 职责：
 *   1. CORS 跨域策略（前端 / Nginx / Knife4j 统一放行）
 *   2. TraceId / 请求上下文清洗拦截器
 *   3. Jackson 消息转换器复用
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final MappingJackson2HttpMessageConverter jackson2HttpMessageConverter;

    public WebConfig(MappingJackson2HttpMessageConverter jackson2HttpMessageConverter) {
        this.jackson2HttpMessageConverter = jackson2HttpMessageConverter;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "X-Trace-Id", "Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public void afterCompletion(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Object handler,
                                        Exception ex) {
                UserContextHolder.clear();
            }
        }).addPathPatterns("/**");
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        converters.removeIf(c -> c instanceof MappingJackson2HttpMessageConverter);
        converters.add(0, jackson2HttpMessageConverter);
    }
}
