package com.katoksai.backend.repository;

import com.katoksai.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
           "JOIN cr.members m " +
           "WHERE m.user.id = :userId AND m.leftAt IS NULL " +
           "ORDER BY cr.updatedAt DESC")
    List<ChatRoom> findByUserId(@Param("userId") Long userId);

    @Query("SELECT cr FROM ChatRoom cr " +
           "JOIN cr.members m1 " +
           "JOIN cr.members m2 " +
           "WHERE cr.type = 'DIRECT' " +
           "AND m1.user.id = :userId1 AND m1.leftAt IS NULL " +
           "AND m2.user.id = :userId2 AND m2.leftAt IS NULL")
    Optional<ChatRoom> findDirectChatRoom(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT cr FROM ChatRoom cr " +
           "JOIN cr.members m " +
           "WHERE m.user.id = :userId AND m.leftAt IS NULL " +
           "AND (LOWER(cr.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ChatRoom> searchChatRooms(@Param("userId") Long userId, @Param("query") String query);
}
