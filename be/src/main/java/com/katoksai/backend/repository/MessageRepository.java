package com.katoksai.backend.repository;

import com.katoksai.backend.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :chatRoomId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByChatRoomId(@Param("chatRoomId") Long chatRoomId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :chatRoomId AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findAllByChatRoomIdOrderByCreatedAtAsc(@Param("chatRoomId") Long chatRoomId);

    Optional<Message> findTopByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(Long chatRoomId);

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :chatRoomId " +
           "AND m.createdAt > :after AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findMessagesSince(@Param("chatRoomId") Long chatRoomId, @Param("after") LocalDateTime after);

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :chatRoomId " +
           "AND m.eventDetected = true AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findEventMessages(@Param("chatRoomId") Long chatRoomId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.chatRoom.id = :chatRoomId " +
           "AND m.sender.id = :userId AND m.isDeleted = false")
    Long countMessagesByUserInChatRoom(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);

    @Query("SELECT m FROM Message m WHERE m.sender.id = :senderId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdOrderByCreatedAtDesc(@Param("senderId") Long senderId);

    @Query("SELECT m FROM Message m WHERE m.chatRoom.id = :chatRoomId AND m.sender.id = :senderId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findByChatRoomIdAndSenderIdOrderByCreatedAtDesc(@Param("chatRoomId") Long chatRoomId, @Param("senderId") Long senderId);
}
