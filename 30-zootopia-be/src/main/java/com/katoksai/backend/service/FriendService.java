package com.katoksai.backend.service;

import com.katoksai.backend.dto.response.FriendResponse;
import com.katoksai.backend.dto.response.RelationshipStatsResponse;
import com.katoksai.backend.entity.Friendship;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.exception.BusinessException;
import com.katoksai.backend.exception.ResourceNotFoundException;
import com.katoksai.backend.repository.FriendshipRepository;
import com.katoksai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public List<FriendResponse> getFriends(Long userId) {
        return friendshipRepository.findByUserIdAndStatus(userId, Friendship.FriendshipStatus.ACCEPTED)
                .stream()
                .map(FriendResponse::from)
                .collect(Collectors.toList());
    }

    public List<FriendResponse> getFriendsRanking(Long userId) {
        return friendshipRepository.findByUserIdOrderByIntimacyScoreDesc(userId)
                .stream()
                .filter(f -> f.getStatus() == Friendship.FriendshipStatus.ACCEPTED)
                .map(FriendResponse::from)
                .collect(Collectors.toList());
    }

    public List<FriendResponse> searchFriends(Long userId, String query) {
        return friendshipRepository.searchFriends(userId, query)
                .stream()
                .map(FriendResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public FriendResponse addFriend(Long userId, Long friendId) {
        if (userId.equals(friendId)) {
            throw new BusinessException("자기 자신을 친구로 추가할 수 없습니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new ResourceNotFoundException("User", friendId));

        if (friendshipRepository.existsByUserAndFriend(user, friend)) {
            throw new BusinessException("이미 친구로 추가된 사용자입니다");
        }

        // Create bidirectional friendship
        Friendship friendship1 = Friendship.builder()
                .user(user)
                .friend(friend)
                .status(Friendship.FriendshipStatus.ACCEPTED)
                .build();

        Friendship friendship2 = Friendship.builder()
                .user(friend)
                .friend(user)
                .status(Friendship.FriendshipStatus.ACCEPTED)
                .build();

        friendshipRepository.save(friendship1);
        friendshipRepository.save(friendship2);

        log.info("Friendship created between {} and {}", userId, friendId);
        return FriendResponse.from(friendship1);
    }

    @Transactional
    public void removeFriend(Long userId, Long friendId) {
        Friendship friendship1 = friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        Friendship friendship2 = friendshipRepository.findByUserIdAndFriendId(friendId, userId)
                .orElse(null);

        friendshipRepository.delete(friendship1);
        if (friendship2 != null) {
            friendshipRepository.delete(friendship2);
        }

        log.info("Friendship removed between {} and {}", userId, friendId);
    }

    @Transactional
    public void updateIntimacy(Long userId, Long friendId, int scoreDelta) {
        friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .ifPresent(friendship -> {
                    int newScore = Math.max(0, Math.min(100, friendship.getIntimacyScore() + scoreDelta));
                    int oldScore = friendship.getIntimacyScore();

                    friendship.setIntimacyScore(newScore);
                    friendship.setLastContactAt(LocalDateTime.now());

                    // Update trend
                    if (newScore > oldScore) {
                        friendship.setIntimacyTrend(Friendship.IntimacyTrend.UP);
                    } else if (newScore < oldScore) {
                        friendship.setIntimacyTrend(Friendship.IntimacyTrend.DOWN);
                    }

                    // Update badge based on score
                    friendship.setBadge(calculateBadge(newScore));

                    friendshipRepository.save(friendship);
                });
    }

    private Friendship.Badge calculateBadge(int score) {
        if (score >= 90) return Friendship.Badge.BESTIE;
        if (score >= 60) return Friendship.Badge.CLOSE;
        if (score >= 30) return Friendship.Badge.ACQUAINTANCE;
        return Friendship.Badge.DISTANT;
    }

    public RelationshipStatsResponse getRelationshipStats(Long userId) {
        List<FriendResponse> ranking = getFriendsRanking(userId);

        return RelationshipStatsResponse.builder()
                .bestieCount(friendshipRepository.countByUserIdAndBadge(userId, Friendship.Badge.BESTIE))
                .closeCount(friendshipRepository.countByUserIdAndBadge(userId, Friendship.Badge.CLOSE))
                .acquaintanceCount(friendshipRepository.countByUserIdAndBadge(userId, Friendship.Badge.ACQUAINTANCE))
                .distantCount(friendshipRepository.countByUserIdAndBadge(userId, Friendship.Badge.DISTANT))
                .totalFriends((long) ranking.size())
                .ranking(ranking)
                .build();
    }

    public Integer getIntimacyScore(Long userId, Long friendId) {
        return friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friendship::getIntimacyScore)
                .orElse(null);
    }
}
