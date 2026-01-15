package com.katoksai.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReplyMode replyMode = ReplyMode.SUGGEST;

    @Column(nullable = false)
    @Builder.Default
    private Integer autoReplyThreshold = 20;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DefaultTone defaultTone = DefaultTone.POLITE;

    @Builder.Default
    private Boolean notificationsEnabled = true;

    @Builder.Default
    private Boolean soundEnabled = true;

    public enum ReplyMode {
        AUTO, SUGGEST
    }

    public enum DefaultTone {
        POLITE, FRIENDLY, FORMAL
    }
}
