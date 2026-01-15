package com.katoksai.backend.repository;

import com.katoksai.backend.entity.Friendship;
import com.katoksai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("SELECT f FROM Friendship f WHERE f.user.id = :userId AND f.status = :status ORDER BY f.intimacyScore DESC")
    List<Friendship> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Friendship.FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE f.user.id = :userId ORDER BY f.intimacyScore DESC")
    List<Friendship> findByUserIdOrderByIntimacyScoreDesc(@Param("userId") Long userId);

    Optional<Friendship> findByUserAndFriend(User user, User friend);

    @Query("SELECT f FROM Friendship f WHERE f.user.id = :userId AND f.friend.id = :friendId")
    Optional<Friendship> findByUserIdAndFriendId(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Query("SELECT f FROM Friendship f WHERE f.user.id = :userId AND f.status = 'ACCEPTED' " +
           "AND (LOWER(f.friend.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(f.friend.statusMessage) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Friendship> searchFriends(@Param("userId") Long userId, @Param("query") String query);

    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.user.id = :userId AND f.badge = :badge")
    Long countByUserIdAndBadge(@Param("userId") Long userId, @Param("badge") Friendship.Badge badge);

    boolean existsByUserAndFriend(User user, User friend);
}
