package com.katoksai.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"chat_room_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MemberRole role = MemberRole.MEMBER;

    @Column(nullable = false)
    @Builder.Default
    private Integer unreadCount = 0;

    private LocalDateTime lastReadAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;

    public enum MemberRole {
        OWNER, ADMIN, MEMBER
    }

    public void incrementUnreadCount() {
        this.unreadCount++;
    }

    public void resetUnreadCount() {
        this.unreadCount = 0;
        this.lastReadAt = LocalDateTime.now();
    }
}
