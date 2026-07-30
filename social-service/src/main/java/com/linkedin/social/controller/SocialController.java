package com.linkedin.social.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/connections")
public class SocialController {

    // Graph connection storage (User ID -> List of Connected User IDs)
    private final Map<String, Set<String>> graphConnections = new HashMap<>();

    public SocialController() {
        // Seed graph structure
        // Alice (101) connected to Bob (102) & Carol (103)
        // Bob (102) connected to David (104)
        // David (104) is a 2nd degree connection of Alice!
        graphConnections.put("user_101", new HashSet<>(Set.of("user_102", "user_103")));
        graphConnections.put("user_102", new HashSet<>(Set.of("user_101", "user_104")));
        graphConnections.put("user_103", new HashSet<>(Set.of("user_101", "user_105")));
        graphConnections.put("user_104", new HashSet<>(Set.of("user_102")));
        graphConnections.put("user_105", new HashSet<>(Set.of("user_103")));
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");
        return ResponseEntity.ok(Map.of(
            "status", "PENDING",
            "message", "Connection request sent from " + from + " to " + to
        ));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");
        graphConnections.computeIfAbsent(from, k -> new HashSet<>()).add(to);
        graphConnections.computeIfAbsent(to, k -> new HashSet<>()).add(from);
        return ResponseEntity.ok(Map.of(
            "status", "CONNECTED",
            "message", "Connection accepted between " + from + " and " + to
        ));
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<?> getFollowers(@PathVariable String userId) {
        Set<String> connections = graphConnections.getOrDefault(userId, Collections.emptySet());
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "followersCount", connections.size(),
            "followers", connections
        ));
    }

    @GetMapping("/second-degree/{userId}")
    public ResponseEntity<?> getSecondDegreeConnections(@PathVariable String userId) {
        Set<String> firstDegree = graphConnections.getOrDefault(userId, Collections.emptySet());
        Set<String> secondDegree = new HashSet<>();

        for (String friend : firstDegree) {
            Set<String> friendsOfFriend = graphConnections.getOrDefault(friend, Collections.emptySet());
            for (String f2 : friendsOfFriend) {
                if (!f2.equals(userId) && !firstDegree.contains(f2)) {
                    secondDegree.add(f2);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "query", "MATCH (u:User {id: $id})-[:CONNECTED]-(m)-[:CONNECTED]-(f2) RETURN f2",
            "firstDegree", firstDegree,
            "secondDegree", secondDegree,
            "executionTimeMs", 2.4
        ));
    }
}
