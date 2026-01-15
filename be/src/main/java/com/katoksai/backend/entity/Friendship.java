package com.katoksai.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "friendships", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "friend_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "friend_id", nullable = false)
    private User friend;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FriendshipStatus status = FriendshipStatus.ACCEPTED;

    @Column(nullable = false)
    @Builder.Default
    private Integer intimacyScore = 50;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IntimacyTrend intimacyTrend = IntimacyTrend.STABLE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Badge badge = Badge.ACQUAINTANCE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReplySpeed replySpeed = ReplySpeed.NORMAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Initiator initiator = Initiator.EQUAL;

    private LocalDateTime lastContactAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum FriendshipStatus {
        PENDING, ACCEPTED, BLOCKED
    }

    public enum IntimacyTrend {
        UP, DOWN, STABLE
    }

    public enum Badge {
        BESTIE, CLOSE, ACQUAINTANCE, DISTANT
    }

    public enum ReplySpeed {
        FAST, NORMAL, SLOW
    }

    public enum Initiator {
        ME, THEM, EQUAL
    }
}
