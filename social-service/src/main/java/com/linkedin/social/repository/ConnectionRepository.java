package com.linkedin.social.repository;

import com.linkedin.social.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    
    @Query("SELECT c FROM Connection c WHERE (c.requesterId = :u1 AND c.receiverId = :u2) OR (c.requesterId = :u2 AND c.receiverId = :u1)")
    Optional<Connection> findBetweenUsers(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT c FROM Connection c WHERE ((c.requesterId = :userId) OR (c.receiverId = :userId)) AND c.status = 'ACCEPTED'")
    List<Connection> findAcceptedConnections(@Param("userId") String userId);

    List<Connection> findByReceiverIdAndStatus(String receiverId, String status);

    List<Connection> findByRequesterIdAndStatus(String requesterId, String status);
}
