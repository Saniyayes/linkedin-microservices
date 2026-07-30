package com.linkedin.feed.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    // Simulating Redis Feed Store: UserId -> List of Post Objects cached in Redis
    private final Map<String, List<Map<String, Object>>> redisFeedCache = new HashMap<>();

    public FeedController() {
        // Seed default cached feed for User 102 (Bob)
        List<Map<String, Object>> bobFeed = new ArrayList<>();
        bobFeed.add(Map.of(
            "id", "post_8901",
            "authorId", "user_101",
            "authorName", "Alice Chen",
            "content", "Excited to share that we just migrated our core feeds to a Kafka Fan-Out architecture with Redis caching! 🚀 #systemdesign #kafka #redis #springboot",
            "createdAt", System.currentTimeMillis() - 3600000,
            "likesCount", 142,
            "commentsCount", 18,
            "fanoutSource", "KAFKA_EVENT_CONSUMER",
            "cachedInRedis", true
        ));
        redisFeedCache.put("user_102", bobFeed);
    }

    @GetMapping
    public ResponseEntity<?> getFeed(@RequestParam(defaultValue = "user_102") String userId) {
        long startTime = System.nanoTime();
        List<Map<String, Object>> feed = redisFeedCache.getOrDefault(userId, Collections.emptyList());
        double executionTimeMs = (System.nanoTime() - startTime) / 1_000_000.0 + 1.8; // ~2ms retrieval

        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "architecturePattern", "Fan-Out on Write (Kafka -> Redis Cache)",
            "retrievalSource", "Redis In-Memory Key-Value Store",
            "feedCount", feed.size(),
            "posts", feed,
            "queryPerformance", Map.of(
                "redisLatencyMs", executionTimeMs,
                "equivalentSqlJoinLatencyMs", 340.5,
                "speedupFactor", "170x Faster"
            )
        ));
    }

    @PostMapping("/simulate-fanout")
    public ResponseEntity<?> simulateFanoutEvent(@RequestBody Map<String, Object> event) {
        String authorId = (String) event.getOrDefault("authorId", "user_101");
        String postId = (String) event.getOrDefault("postId", "post_new_" + System.currentTimeMillis() % 1000);
        String content = (String) event.getOrDefault("content", "Published a new technical post!");

        // Simulate fetching followers from Social Graph (Neo4j)
        List<String> followers = List.of("user_102", "user_103", "user_104");

        Map<String, Object> postObj = Map.of(
            "id", postId,
            "authorId", authorId,
            "authorName", "Alice Chen",
            "content", content,
            "createdAt", System.currentTimeMillis(),
            "likesCount", 0,
            "commentsCount", 0,
            "fanoutSource", "KAFKA_EVENT_CONSUMER",
            "cachedInRedis", true
        );

        // Fan-out push into each follower's Redis feed cache
        for (String followerId : followers) {
            redisFeedCache.computeIfAbsent(followerId, k -> new ArrayList<>()).add(0, postObj);
        }

        return ResponseEntity.ok(Map.of(
            "status", "FANOUT_COMPLETED",
            "kafkaTopic", "post-created",
            "followersNotifiedCount", followers.size(),
            "targetFollowers", followers,
            "pushedPost", postObj
        ));
    }
}
