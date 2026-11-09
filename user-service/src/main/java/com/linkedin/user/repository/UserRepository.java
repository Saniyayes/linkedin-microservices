package com.linkedin.user.repository;

import com.linkedin.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.headline) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.company) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(@Param("query") String query);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.headline) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.company) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> searchUsersPageable(@Param("query") String query, Pageable pageable);
}
