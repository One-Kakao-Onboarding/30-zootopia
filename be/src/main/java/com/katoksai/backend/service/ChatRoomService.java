package com.katoksai.backend.service;

import com.katoksai.backend.dto.request.CreateChatRoomRequest;
import com.katoksai.backend.dto.response.ChatRoomResponse;
import com.katoksai.backend.entity.ChatRoom;
import com.katoksai.backend.entity.ChatRoomMember;
import com.katoksai.backend.entity.Message;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.exception.BusinessException;
import com.katoksai.backend.exception.ResourceNotFoundException;
import com.katoksai.backend.repository.ChatRoomMemberRepository;
import com.katoksai.backend.repository.ChatRoomRepository;
import com.katoksai.backend.repository.MessageRepository;
import com.katoksai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final FriendService friendService;

    public List<ChatRoomResponse> getChatRooms(Long userId) {
        List<ChatRoom> chatRooms = chatRoomRepository.findByUserId(userId);

        return chatRooms.stream()
                .map(chatRoom -> {
                    Message lastMessage = messageRepository.findTopByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(chatRoom.getId())
                            .orElse(null);

                    Integer unreadCount = chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoom.getId(), userId)
                            .map(ChatRoomMember::getUnreadCount)
                            .orElse(0);

                    Integer intimacyScore = getIntimacyScoreForChatRoom(chatRoom, userId);

                    return ChatRoomResponse.from(chatRoom, userId, lastMessage, unreadCount, intimacyScore);
                })
                .sorted((a, b) -> {
                    if (a.getLastMessageAt() == null) return 1;
                    if (b.getLastMessageAt() == null) return -1;
                    return b.getLastMessageAt().compareTo(a.getLastMessageAt());
                })
                .collect(Collectors.toList());
    }

    private Integer getIntimacyScoreForChatRoom(ChatRoom chatRoom, Long userId) {
        if (chatRoom.getType() == ChatRoom.ChatRoomType.DIRECT) {
            for (ChatRoomMember member : chatRoom.getMembers()) {
                if (!member.getUser().getId().equals(userId) && member.getLeftAt() == null) {
                    return friendService.getIntimacyScore(userId, member.getUser().getId());
                }
            }
        }
        return null;
    }

    @Transactional
    public ChatRoomResponse createChatRoom(Long userId, CreateChatRoomRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // For direct chat, check if room already exists
        if (request.getType() == ChatRoom.ChatRoomType.DIRECT && request.getMemberIds().size() == 1) {
            Long otherUserId = request.getMemberIds().get(0);
            return chatRoomRepository.findDirectChatRoom(userId, otherUserId)
                    .map(existingRoom -> {
                        Message lastMessage = messageRepository.findTopByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(existingRoom.getId())
                                .orElse(null);
                        Integer unreadCount = chatRoomMemberRepository.findByChatRoomIdAndUserId(existingRoom.getId(), userId)
                                .map(ChatRoomMember::getUnreadCount)
                                .orElse(0);
                        Integer intimacyScore = friendService.getIntimacyScore(userId, otherUserId);
                        return ChatRoomResponse.from(existingRoom, userId, lastMessage, unreadCount, intimacyScore);
                    })
                    .orElseGet(() -> createNewChatRoom(creator, request));
        }

        return createNewChatRoom(creator, request);
    }

    private ChatRoomResponse createNewChatRoom(User creator, CreateChatRoomRequest request) {
        ChatRoom chatRoom = ChatRoom.builder()
                .name(request.getName())
                .avatar(request.getAvatar())
                .type(request.getType())
                .members(new ArrayList<>())
                .build();

        // Add creator as owner
        ChatRoomMember creatorMember = ChatRoomMember.builder()
                .chatRoom(chatRoom)
                .user(creator)
                .role(ChatRoomMember.MemberRole.OWNER)
                .build();
        chatRoom.addMember(creatorMember);

        // Add other members
        for (Long memberId : request.getMemberIds()) {
            User member = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", memberId));

            ChatRoomMember chatRoomMember = ChatRoomMember.builder()
                    .chatRoom(chatRoom)
                    .user(member)
                    .role(ChatRoomMember.MemberRole.MEMBER)
                    .build();
            chatRoom.addMember(chatRoomMember);
        }

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        log.info("Chat room created: {} by user {}", savedChatRoom.getId(), creator.getId());

        Integer intimacyScore = null;
        if (request.getType() == ChatRoom.ChatRoomType.DIRECT && request.getMemberIds().size() == 1) {
            intimacyScore = friendService.getIntimacyScore(creator.getId(), request.getMemberIds().get(0));
        }

        return ChatRoomResponse.from(savedChatRoom, creator.getId(), null, 0, intimacyScore);
    }

    public ChatRoomResponse getChatRoom(Long chatRoomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", chatRoomId));

        // Check if user is member
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        Message lastMessage = messageRepository.findTopByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(chatRoomId)
                .orElse(null);

        Integer unreadCount = chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .map(ChatRoomMember::getUnreadCount)
                .orElse(0);

        Integer intimacyScore = getIntimacyScoreForChatRoom(chatRoom, userId);

        return ChatRoomResponse.from(chatRoom, userId, lastMessage, unreadCount, intimacyScore);
    }

    @Transactional
    public void leaveChatRoom(Long chatRoomId, Long userId) {
        ChatRoomMember member = chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        member.setLeftAt(LocalDateTime.now());
        chatRoomMemberRepository.save(member);

        log.info("User {} left chat room {}", userId, chatRoomId);
    }

    @Transactional
    public void markAsRead(Long chatRoomId, Long userId) {
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .ifPresent(member -> {
                    member.resetUnreadCount();
                    chatRoomMemberRepository.save(member);
                });
    }

    public List<ChatRoomResponse> searchChatRooms(Long userId, String query) {
        return chatRoomRepository.searchChatRooms(userId, query).stream()
                .map(chatRoom -> {
                    Message lastMessage = messageRepository.findTopByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(chatRoom.getId())
                            .orElse(null);
                    Integer unreadCount = chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoom.getId(), userId)
                            .map(ChatRoomMember::getUnreadCount)
                            .orElse(0);
                    Integer intimacyScore = getIntimacyScoreForChatRoom(chatRoom, userId);
                    return ChatRoomResponse.from(chatRoom, userId, lastMessage, unreadCount, intimacyScore);
                })
                .collect(Collectors.toList());
    }

    public Integer getTotalUnreadCount(Long userId) {
        Integer count = chatRoomMemberRepository.getTotalUnreadCount(userId);
        return count != null ? count : 0;
    }

    public List<Long> getChatRoomMemberIds(Long chatRoomId) {
        return chatRoomMemberRepository.findActiveMembersByChatRoomId(chatRoomId)
                .stream()
                .map(member -> member.getUser().getId())
                .collect(Collectors.toList());
    }
}
