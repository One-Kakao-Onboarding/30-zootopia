package com.katoksai.backend.repository;

import com.katoksai.backend.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    @Query("SELECT m FROM ChatRoomMember m WHERE m.chatRoom.id = :chatRoomId AND m.leftAt IS NULL")
    List<ChatRoomMember> findActiveMembersByChatRoomId(@Param("chatRoomId") Long chatRoomId);

    @Query("SELECT m FROM ChatRoomMember m WHERE m.chatRoom.id = :chatRoomId AND m.user.id = :userId AND m.leftAt IS NULL")
    Optional<ChatRoomMember> findByChatRoomIdAndUserId(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);

    @Query("SELECT SUM(m.unreadCount) FROM ChatRoomMember m WHERE m.user.id = :userId AND m.leftAt IS NULL")
    Integer getTotalUnreadCount(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatRoomMember m SET m.unreadCount = m.unreadCount + 1 " +
           "WHERE m.chatRoom.id = :chatRoomId AND m.user.id != :senderId AND m.leftAt IS NULL")
    void incrementUnreadCountForOtherMembers(@Param("chatRoomId") Long chatRoomId, @Param("senderId") Long senderId);
}
