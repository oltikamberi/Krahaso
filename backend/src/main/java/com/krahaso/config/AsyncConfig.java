package com.krahaso.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Background work for seller feeds: parsing runs off the request thread so uploads
 * return immediately, and registered feed URLs are polled on a timer. Kept in its
 * own config class so the application entry point stays untouched.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    public static final String FEED_EXECUTOR = "feedIngestionExecutor";

    @Bean(FEED_EXECUTOR)
    public ThreadPoolTaskExecutor feedIngestionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("feed-ingest-");
        executor.initialize();
        return executor;
    }
}
