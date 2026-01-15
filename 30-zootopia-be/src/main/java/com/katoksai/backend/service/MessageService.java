package com.katoksai.backend.service;

import com.katoksai.backend.dto.request.SendMessageRequest;
import com.katoksai.backend.dto.response.MessageResponse;
import com.katoksai.backend.entity.ChatRoom;
import com.katoksai.backend.entity.Message;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.exception.BusinessException;
import com.katoksai.backend.exception.ResourceNotFoundException;
import com.katoksai.backend.entity.UserSettings;
import com.katoksai.backend.repository.ChatRoomMemberRepository;
import com.katoksai.backend.repository.ChatRoomRepository;
import com.katoksai.backend.repository.MessageRepository;
import com.katoksai.backend.repository.UserRepository;
import com.katoksai.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final FriendService friendService;
    private final AIService aiService;
    private final WebSocketService webSocketService;

    // Event detection patterns
    private static final Pattern WEDDING_PATTERN = Pattern.compile("결혼|웨딩|청첩장|식장|신랑|신부|혼인", Pattern.CASE_INSENSITIVE);
    private static final Pattern BIRTHDAY_PATTERN = Pattern.compile("생일|생축|태어난|birthday", Pattern.CASE_INSENSITIVE);
    private static final Pattern FUNERAL_PATTERN = Pattern.compile("장례|부고|돌아가|상가|조문|빈소", Pattern.CASE_INSENSITIVE);
    private static final Pattern REUNION_PATTERN = Pattern.compile("동창|모임|오랜만|reunion", Pattern.CASE_INSENSITIVE);
    // 답장/응답 패턴 (이런 패턴이 포함되면 이벤트 감지 제외)
    private static final Pattern REPLY_PATTERN = Pattern.compile("축하해|축하드|축하합|감사|고마워|명복|위로|잘됐|좋겠|부럽|갈게|참석|ㅊㅋ", Pattern.CASE_INSENSITIVE);

    @Transactional
    public MessageResponse sendMessage(Long chatRoomId, Long senderId, SendMessageRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", chatRoomId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        // Check if user is member
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, senderId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        // Detect events (자동 답장 메시지는 이벤트 감지 제외)
        Message.EventType eventType = Boolean.TRUE.equals(request.getIsAutoReply())
                ? null
                : detectEvent(request.getContent());
        boolean eventDetected = eventType != null;
        String aiInsight = eventDetected ? generateAiInsight(eventType, chatRoom, senderId) : null;

        Message message = Message.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(request.getContent())
                .type(request.getType())
                .eventType(eventType)
                .eventDetected(eventDetected)
                .aiInsight(aiInsight)
                .isAutoReply(request.getIsAutoReply())
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update chat room timestamp
        chatRoom.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(chatRoom);

        // Increment unread count for other members
        chatRoomMemberRepository.incrementUnreadCountForOtherMembers(chatRoomId, senderId);

        // Update intimacy score
        updateIntimacyOnMessage(chatRoom, senderId);

        log.info("Message sent in chat room {}: {} by user {}", chatRoomId, savedMessage.getId(), senderId);

        // Note: WebSocket broadcast is handled by the controllers (MessageController, WebSocketController)

        // 결혼 이벤트 감지 시 자동 답장 처리 (1:1 채팅방에서만, 자동 답장이 아닌 경우만)
        if (eventType == Message.EventType.WEDDING
                && chatRoom.getType() == ChatRoom.ChatRoomType.DIRECT
                && !Boolean.TRUE.equals(request.getIsAutoReply())) {
            processWeddingAutoReply(chatRoom, senderId);
        }

        return MessageResponse.from(savedMessage);
    }

    /**
     * 결혼 초대 메시지에 대한 자동 답장 처리
     * 사용자 설정에서 replyMode가 AUTO인 경우에만 자동 답장
     */
    private void processWeddingAutoReply(ChatRoom chatRoom, Long senderId) {
        // 상대방 찾기 (메시지 받는 사람 = 자동 답장을 보낼 사람)
        chatRoom.getMembers().stream()
                .filter(m -> !m.getUser().getId().equals(senderId) && m.getLeftAt() == null)
                .findFirst()
                .ifPresent(recipientMember -> {
                    Long recipientId = recipientMember.getUser().getId();

                    try {
                        // 사용자 설정 확인 - AUTO 모드인 경우에만 자동 답장
                        UserSettings settings = userSettingsRepository.findByUserId(recipientId).orElse(null);
                        log.info("User {} settings: replyMode={}", recipientId,
                                settings != null ? settings.getReplyMode() : "null (no settings)");
                        if (settings == null || settings.getReplyMode() != UserSettings.ReplyMode.AUTO) {
                            log.info("User {} has replyMode={}, skipping auto-reply", recipientId,
                                    settings != null ? settings.getReplyMode() : "null");
                            return;
                        }

                        log.info("Processing wedding auto-reply for user {} in chat room {}", recipientId, chatRoom.getId());

                        // AI 서비스로 답장 생성
                        AIService.WeddingAutoReplyResult result = aiService.generateWeddingAutoReply(
                                chatRoom.getId(), recipientId, senderId
                        );

                        if (result != null && result.replyMessage() != null) {
                            // 자동 답장 메시지 저장
                            Message autoReply = Message.builder()
                                    .chatRoom(chatRoom)
                                    .sender(recipientMember.getUser())
                                    .content(result.replyMessage())
                                    .type(Message.MessageType.TEXT)
                                    .isAutoReply(true)
                                    .aiInsight(String.format("친밀도: %d점 | %s | %s",
                                            result.intimacyScore(),
                                            result.willAttend() ? "참석 예정" : "불참 예정",
                                            result.attendanceReason()))
                                    .build();

                            Message savedAutoReply = messageRepository.save(autoReply);

                            // 발신자의 읽지 않은 메시지 수 증가
                            chatRoomMemberRepository.incrementUnreadCountForOtherMembers(
                                    chatRoom.getId(), recipientId
                            );

                            // Broadcast auto-reply via WebSocket
                            MessageResponse autoReplyResponse = MessageResponse.from(savedAutoReply);
                            List<Long> autoReplyMemberIds = chatRoom.getMembers().stream()
                                    .filter(m -> m.getLeftAt() == null)
                                    .map(m -> m.getUser().getId())
                                    .collect(Collectors.toList());
                            webSocketService.sendMessageToRoom(chatRoom.getId(), autoReplyResponse, autoReplyMemberIds);

                            log.info("Wedding auto-reply sent: chatRoom={}, from={}, intimacy={}, willAttend={}",
                                    chatRoom.getId(), recipientId, result.intimacyScore(), result.willAttend());
                        }
                    } catch (Exception e) {
                        log.error("Failed to process wedding auto-reply: {}", e.getMessage(), e);
                    }
                });
    }

    private Message.EventType detectEvent(String content) {
        // 답장/응답 패턴이 포함된 메시지는 이벤트 감지 제외
        // (예: "결혼 축하해!" 같은 축하 메시지는 이벤트로 감지하지 않음)
        if (REPLY_PATTERN.matcher(content).find()) {
            return null;
        }
        if (WEDDING_PATTERN.matcher(content).find()) return Message.EventType.WEDDING;
        if (BIRTHDAY_PATTERN.matcher(content).find()) return Message.EventType.BIRTHDAY;
        if (FUNERAL_PATTERN.matcher(content).find()) return Message.EventType.FUNERAL;
        if (REUNION_PATTERN.matcher(content).find()) return Message.EventType.REUNION;
        return null;
    }

    private String generateAiInsight(Message.EventType eventType, ChatRoom chatRoom, Long senderId) {
        // Get the other user in direct chat
        if (chatRoom.getType() == ChatRoom.ChatRoomType.DIRECT) {
            Long otherUserId = chatRoom.getMembers().stream()
                    .filter(m -> !m.getUser().getId().equals(senderId) && m.getLeftAt() == null)
                    .findFirst()
                    .map(m -> m.getUser().getId())
                    .orElse(null);

            if (otherUserId != null) {
                Integer intimacyScore = friendService.getIntimacyScore(senderId, otherUserId);
                if (intimacyScore != null && intimacyScore < 30) {
                    return switch (eventType) {
                        case WEDDING -> "오랜만의 연락입니다. 신중한 답변이 필요합니다.";
                        case BIRTHDAY -> "친밀도가 낮은 관계입니다. 간단한 축하 메시지를 추천합니다.";
                        case FUNERAL -> "조심스러운 위로의 말씀이 필요합니다.";
                        case REUNION -> "오랜만에 연락이 왔습니다. 반가운 인사를 추천합니다.";
                        default -> null;
                    };
                }
            }
        }

        return switch (eventType) {
            case WEDDING -> "결혼 관련 메시지가 감지되었습니다.";
            case BIRTHDAY -> "생일 관련 메시지가 감지되었습니다.";
            case FUNERAL -> "부고 관련 메시지가 감지되었습니다.";
            case REUNION -> "모임/동창 관련 메시지가 감지되었습니다.";
            default -> null;
        };
    }

    private void updateIntimacyOnMessage(ChatRoom chatRoom, Long senderId) {
        if (chatRoom.getType() == ChatRoom.ChatRoomType.DIRECT) {
            chatRoom.getMembers().stream()
                    .filter(m -> !m.getUser().getId().equals(senderId) && m.getLeftAt() == null)
                    .findFirst()
                    .ifPresent(otherMember -> {
                        // Increase intimacy score slightly for both users
                        friendService.updateIntimacy(senderId, otherMember.getUser().getId(), 1);
                        friendService.updateIntimacy(otherMember.getUser().getId(), senderId, 1);
                    });
        }
    }

    public List<MessageResponse> getMessages(Long chatRoomId, Long userId, int page, int size) {
        // Check if user is member
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findByChatRoomId(chatRoomId, pageable);

        return messages.getContent().stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getAllMessages(Long chatRoomId, Long userId) {
        // Check if user is member
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        return messageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoomId).stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getMessagesSince(Long chatRoomId, Long userId, LocalDateTime since) {
        // Check if user is member
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new BusinessException("채팅방에 참여하지 않은 사용자입니다"));

        return messageRepository.findMessagesSince(chatRoomId, since).stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));

        if (!message.getSender().getId().equals(userId)) {
            throw new BusinessException("본인의 메시지만 삭제할 수 있습니다");
        }

        message.setIsDeleted(true);
        messageRepository.save(message);
        log.info("Message deleted: {} by user {}", messageId, userId);
    }
}
