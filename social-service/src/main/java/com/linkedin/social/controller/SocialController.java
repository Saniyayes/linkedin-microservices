package com.linkedin.social.controller;

import com.linkedin.social.model.Connection;
import com.linkedin.social.model.Follow;
import com.linkedin.social.repository.ConnectionRepository;
import com.linkedin.social.repository.FollowRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/connections")
public class SocialController {

    private final ConnectionRepository connectionRepository;
    private final FollowRepository followRepository;

    @org.springframework.beans.factory.annotation.Value("${feed-service.url:http://localhost:8084}")
    private String feedServiceUrl;

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    private void sendNotification(String recipientId, String actorId, String actorName, String actorAvatar, String type, String title, String message, String referenceId) {
        if (recipientId == null || recipientId.equals(actorId)) return;
        try {
            Map<String, String> payload = Map.of(
                "recipientId", recipientId,
                "actorId", actorId,
                "actorName", actorName != null ? actorName : "Member",
                "actorAvatar", actorAvatar != null ? actorAvatar : "",
                "type", type,
                "title", title,
                "message", message,
                "referenceId", referenceId != null ? referenceId : ""
            );
            restTemplate.postForEntity(feedServiceUrl + "/api/feed/notifications", payload, Map.class);
        } catch (Exception ignored) {}
    }

    public SocialController(ConnectionRepository connectionRepository, FollowRepository followRepository) {
        this.connectionRepository = connectionRepository;
        this.followRepository = followRepository;
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");
        String fromName = body.getOrDefault("fromUserName", "Member");
        String toName = body.getOrDefault("toUserName", "Member");

        if (from == null || to == null || from.equals(to)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid fromUserId and toUserId are required"));
        }

        Optional<Connection> existing = connectionRepository.findBetweenUsers(from, to);
        if (existing.isPresent()) {
            Connection conn = existing.get();
            if ("ACCEPTED".equals(conn.getStatus())) {
                return ResponseEntity.ok(Map.of("status", "CONNECTED", "message", "Already connected", "connection", conn));
            }
            conn.setRequesterId(from);
            conn.setReceiverId(to);
            conn.setStatus("PENDING");
            conn.setCreatedAt(System.currentTimeMillis());
            return ResponseEntity.ok(Map.of("status", "PENDING", "message", "Connection request resent", "connection", connectionRepository.save(conn)));
        }

        Connection conn = new Connection(from, to, fromName, toName, "PENDING");
        sendNotification(to, from, fromName, "", "CONNECTION_REQUEST", "Connection Request", fromName + " wants to connect with you", from);
        return ResponseEntity.ok(Map.of(
            "status", "PENDING",
            "message", "Connection request sent successfully",
            "connection", connectionRepository.save(conn)
        ));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");

        Optional<Connection> existing = connectionRepository.findBetweenUsers(from, to);
        if (existing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No connection request found"));
        }

        Connection conn = existing.get();
        conn.setStatus("ACCEPTED");
        connectionRepository.save(conn);

        return ResponseEntity.ok(Map.of(
            "status", "CONNECTED",
            "message", "Connection accepted",
            "connection", conn
        ));
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");

        connectionRepository.findBetweenUsers(from, to).ifPresent(conn -> {
            conn.setStatus("REJECTED");
            connectionRepository.save(conn);
        });

        return ResponseEntity.ok(Map.of("status", "REJECTED", "message", "Connection request rejected"));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawRequest(@RequestBody Map<String, String> body) {
        String from = body.get("fromUserId");
        String to = body.get("toUserId");

        connectionRepository.findBetweenUsers(from, to).ifPresent(connectionRepository::delete);
        return ResponseEntity.ok(Map.of("status", "WITHDRAWN", "message", "Connection request withdrawn"));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeConnection(@RequestParam String fromUserId, @RequestParam String toUserId) {
        connectionRepository.findBetweenUsers(fromUserId, toUserId).ifPresent(connectionRepository::delete);
        return ResponseEntity.ok(Map.of("status", "REMOVED", "message", "Connection removed"));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getConnectionStatus(@RequestParam String user1, @RequestParam String user2) {
        if (user1.equals(user2)) {
            return ResponseEntity.ok(Map.of("status", "SELF"));
        }
        Optional<Connection> conn = connectionRepository.findBetweenUsers(user1, user2);
        if (conn.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "NONE"));
        }
        Connection c = conn.get();
        if ("ACCEPTED".equals(c.getStatus())) {
            return ResponseEntity.ok(Map.of("status", "CONNECTED", "connectionId", c.getId()));
        }
        if ("PENDING".equals(c.getStatus())) {
            if (c.getRequesterId().equals(user1)) {
                return ResponseEntity.ok(Map.of("status", "PENDING_OUTGOING", "connectionId", c.getId()));
            } else {
                return ResponseEntity.ok(Map.of("status", "PENDING_INCOMING", "connectionId", c.getId()));
            }
        }
        return ResponseEntity.ok(Map.of("status", "NONE"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getAcceptedConnections(@PathVariable String userId) {
        List<Connection> conns = connectionRepository.findAcceptedConnections(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Connection c : conns) {
            boolean isRequester = c.getRequesterId().equals(userId);
            String otherId = isRequester ? c.getReceiverId() : c.getRequesterId();
            String otherName = isRequester ? c.getReceiverName() : c.getRequesterName();
            result.add(Map.of(
                "connectionId", c.getId(),
                "userId", otherId,
                "name", otherName != null ? otherName : "Member",
                "connectedAt", c.getCreatedAt()
            ));
        }
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "connectionsCount", result.size(),
            "connections", result
        ));
    }

    @GetMapping("/pending/{userId}")
    public ResponseEntity<?> getPendingInvitations(@PathVariable String userId) {
        List<Connection> pending = connectionRepository.findByReceiverIdAndStatus(userId, "PENDING");
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/sent/{userId}")
    public ResponseEntity<?> getSentInvitations(@PathVariable String userId) {
        List<Connection> sent = connectionRepository.findByRequesterIdAndStatus(userId, "PENDING");
        return ResponseEntity.ok(sent);
    }

    @PostMapping("/follow")
    public ResponseEntity<?> followUser(@RequestBody Map<String, String> body) {
        String followerId = body.get("followerId");
        String followedId = body.get("followedId");
        String followerName = body.getOrDefault("followerName", "Member");
        String followedName = body.getOrDefault("followedName", "Member");

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowedId(followerId, followedId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of("status", "FOLLOWING", "message", "Already following"));
        }

        Follow f = new Follow(followerId, followedId, followerName, followedName);
        return ResponseEntity.ok(Map.of("status", "FOLLOWING", "follow", followRepository.save(f)));
    }

    @Transactional
    @PostMapping("/unfollow")
    public ResponseEntity<?> unfollowUser(@RequestBody Map<String, String> body) {
        String followerId = body.get("followerId");
        String followedId = body.get("followedId");
        followRepository.deleteByFollowerIdAndFollowedId(followerId, followedId);
        return ResponseEntity.ok(Map.of("status", "UNFOLLOWED"));
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<?> getFollowing(@PathVariable String userId) {
        List<Follow> list = followRepository.findByFollowerId(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "followingCount", list.size(), "following", list));
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<?> getFollowers(@PathVariable String userId) {
        List<Follow> list = followRepository.findByFollowedId(userId);
        return ResponseEntity.ok(Map.of("userId", userId, "followersCount", list.size(), "followers", list));
    }

    @GetMapping("/second-degree/{userId}")
    public ResponseEntity<?> getSecondDegreeConnections(@PathVariable String userId) {
        List<Connection> myConns = connectionRepository.findAcceptedConnections(userId);
        Set<String> firstDegree = new HashSet<>();
        for (Connection c : myConns) {
            firstDegree.add(c.getRequesterId().equals(userId) ? c.getReceiverId() : c.getRequesterId());
        }

        Set<String> secondDegree = new HashSet<>();
        for (String f1 : firstDegree) {
            List<Connection> f1Conns = connectionRepository.findAcceptedConnections(f1);
            for (Connection c2 : f1Conns) {
                String friend = c2.getRequesterId().equals(f1) ? c2.getReceiverId() : c2.getRequesterId();
                if (!friend.equals(userId) && !firstDegree.contains(friend)) {
                    secondDegree.add(friend);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "firstDegreeCount", firstDegree.size(),
            "firstDegree", firstDegree,
            "secondDegreeCount", secondDegree.size(),
            "secondDegree", secondDegree
        ));
    }
}
