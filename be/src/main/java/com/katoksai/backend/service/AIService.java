package com.katoksai.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.katoksai.backend.dto.response.MessageResponse;
import com.katoksai.backend.entity.Friendship;
import com.katoksai.backend.entity.Message;
import com.katoksai.backend.entity.User;
import com.katoksai.backend.entity.UserSettings;
import com.katoksai.backend.repository.FriendshipRepository;
import com.katoksai.backend.repository.MessageRepository;
import com.katoksai.backend.repository.UserRepository;
import com.katoksai.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final OpenAIClient openAIClient;
    private final MessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final String RELATIONSHIP_ANALYSIS_PROMPT = """
        당신은 인간관계 분석 전문가입니다. 주어진 채팅 기록을 분석하여 두 사람의 관계를 파악해주세요.

        분석 결과를 다음 JSON 형식으로 반환해주세요:
        {
            "relationshipType": "친구/지인/동료/가족/연인/모르는사이 중 하나",
            "intimacyLevel": "매우친함/친함/보통/서먹함/낯섦 중 하나",
            "communicationStyle": "격식체/반말/혼용 중 하나",
            "lastContactPeriod": "최근 연락 간격 추정 (예: 매일, 주1회, 월1회, 6개월이상)",
            "keyTopics": ["주요 대화 주제들"],
            "emotionalTone": "긍정적/중립적/부정적 중 하나",
            "summary": "관계에 대한 한줄 요약"
        }

        JSON만 반환하고 다른 설명은 하지 마세요.
        """;

    private static final String REPLY_GENERATION_PROMPT = """
        당신은 카카오톡 메시지 스타일 모방 전문가입니다.

        ## 핵심 임무
        "%s"님이 **이 친구에게** 보낸 실제 메시지들을 분석하고, 3가지 스타일의 답장을 작성하세요.

        **절대로 "결혼 축하해! 행복하게 잘 살아~" 같은 뻔한 템플릿 금지!**

        ### [핵심] 이 친구에게 보낸 "%s"님의 실제 메시지들:
        ```
        %s
        ```

        ### 상황:
        - 이벤트: %s
        - 친밀도: %d/100
        - 관계: %s

        ### 최근 대화 맥락:
        %s

        ## 반드시 아래 3가지 타입의 답장을 생성하세요:
        1. **정중한** - 예의 바르고 부드러운 톤, 이모지 적절히 사용
        2. **친근한** - 친한 친구처럼 텐션 높게, 이모지와 느낌표 많이 사용
        3. **공식적** - 격식 있고 간결하게, 이모지 없이

        ## 중요 규칙
        - 위 사용자 메시지에서 반말 쓰면 → 반말로 작성
        - 위 사용자 메시지에서 존댓말 쓰면 → 존댓말로 작성
        - 각 타입별로 확실히 다른 느낌이 나야 함

        JSON만 반환 (tone은 반드시 "정중한", "친근한", "공식적" 중 하나):
        {
            "replies": [
                {
                    "tone": "정중한",
                    "message": "정중하고 예의 바른 답장"
                },
                {
                    "tone": "친근한",
                    "message": "친한 친구처럼 친근한 답장"
                },
                {
                    "tone": "공식적",
                    "message": "격식 있고 간결한 답장"
                }
            ],
            "recommendedIndex": 0,
            "aiInsight": "추천 이유 한 줄 설명"
        }
        """;

    private static final String WEDDING_AUTO_REPLY_PROMPT = """
        당신은 친구 관계 분석 및 메시지 작성 전문가입니다.
        아래 대화 내용을 분석하여 두 사람의 친밀도를 평가하고, 결혼식 참석 여부를 결정해주세요.

        분석 기준:
        1. 대화 빈도와 길이
        2. 대화 주제의 깊이 (일상적 안부 vs 개인적 고민 공유)
        3. 이모티콘/감정 표현의 사용
        4. 서로에 대한 관심도
        5. 마지막 대화 시점

        친밀도 판단:
        - 친한 친구 (점수 70-100): 자주 연락, 개인적 이야기 공유, 서로 챙김
        - 보통 친구 (점수 40-69): 가끔 연락, 일상적 대화
        - 멀어진 친구 (점수 20-39): 드문 연락, 형식적 대화
        - 거의 모르는 사이 (점수 0-19): 연락 거의 없음

        참석 결정 기준:
        - 친밀도 60점 이상: 참석
        - 친밀도 40-59점: 축의금만 전달 (불참)
        - 친밀도 40점 미만: 정중히 거절

        다음 JSON 형식으로 반환해주세요:
        {
            "intimacyScore": 0-100 사이 점수,
            "intimacyReason": "친밀도 판단 이유 (대화 내용 기반)",
            "willAttend": true/false,
            "attendanceReason": "참석/불참 결정 이유",
            "replyMessage": "결혼 축하 답장 메시지 (한국어, 자연스럽게)",
            "summary": "분석 요약"
        }

        JSON만 반환하고 다른 설명은 하지 마세요.
        """;

    private static final String EVENT_DETECTION_PROMPT = """
        당신은 메시지 분석 전문가입니다. 다음 메시지에서 특별한 이벤트가 감지되는지 분석해주세요.

        감지 가능한 이벤트:
        - WEDDING: 결혼, 청첩장, 웨딩 관련
        - BIRTHDAY: 생일 관련
        - FUNERAL: 부고, 장례, 조문 관련
        - REUNION: 동창회, 모임, 오랜만의 연락
        - GENERAL: 특별한 이벤트 없음

        메시지: "%s"

        다음 JSON 형식으로 반환해주세요:
        {
            "eventType": "이벤트 유형",
            "confidence": 0.0~1.0 사이의 확신도,
            "keywords": ["감지된 키워드들"],
            "context": "이벤트에 대한 추가 컨텍스트"
        }

        JSON만 반환하고 다른 설명은 하지 마세요.
        """;

    /**
     * 채팅 기록 기반 관계 분석
     */
    public RelationshipAnalysis analyzeRelationship(Long chatRoomId, Long userId, Long friendId) {
        // 채팅 기록 가져오기
        List<Message> messages = messageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoomId);

        if (messages.isEmpty()) {
            return getDefaultRelationshipAnalysis();
        }

        // 채팅 기록 포맷팅
        String chatHistory = formatChatHistory(messages, userId);

        // 기존 친밀도 정보 가져오기
        Integer currentIntimacy = friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friendship::getIntimacyScore)
                .orElse(50);

        String userMessage = String.format(
                "현재 친밀도 점수: %d/100\n\n채팅 기록:\n%s",
                currentIntimacy, chatHistory
        );

        String response = openAIClient.chat(RELATIONSHIP_ANALYSIS_PROMPT, userMessage);

        if (response == null) {
            return getDefaultRelationshipAnalysis();
        }

        try {
            return objectMapper.readValue(response, RelationshipAnalysis.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse relationship analysis response", e);
            return getDefaultRelationshipAnalysis();
        }
    }

    /**
     * 이벤트에 맞는 자동 답장 생성 - 사용자의 대화 스타일을 학습하여 생성
     */
    public ReplyGenerationResult generateReply(
            Long chatRoomId,
            Long userId,
            Long friendId,
            String eventType
    ) {
        // 사용자 이름 가져오기
        String userName = userRepository.findById(userId)
                .map(User::getName)
                .orElse("사용자");

        // 친밀도 가져오기
        Integer intimacyScore = friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friendship::getIntimacyScore)
                .orElse(50);

        // 해당 채팅방에서 사용자의 과거 메시지 수집 (개인화된 스타일 학습용) - 최근 30개
        List<Message> userMessages = messageRepository.findByChatRoomIdAndSenderIdOrderByCreatedAtDesc(chatRoomId, userId);
        int styleLimit = Math.min(30, userMessages.size());
        String userStyleMessages = userMessages.subList(0, styleLimit).stream()
                .map(Message::getContent)
                .collect(Collectors.joining("\n"));

        log.info("Analyzing {} messages from chatRoom {} for user {}", userMessages.size(), chatRoomId, userName);

        // 현재 채팅방의 최근 대화 (맥락용)
        List<Message> recentMessages = messageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoomId);
        int startIndex = Math.max(0, recentMessages.size() - 15);
        List<Message> limitedMessages = recentMessages.subList(startIndex, recentMessages.size());
        String recentChat = formatChatHistory(limitedMessages, userId);

        // 관계 분석
        RelationshipAnalysis relationshipAnalysis = analyzeRelationship(chatRoomId, userId, friendId);

        String prompt = String.format(
                REPLY_GENERATION_PROMPT,
                userName,           // 사용자 이름 (첫 번째)
                userName,           // 사용자 이름 (두 번째)
                userStyleMessages.isEmpty() ? "(메시지 없음)" : userStyleMessages,  // 이 친구에게 보낸 메시지들
                eventType,          // 이벤트 유형
                intimacyScore,      // 친밀도
                relationshipAnalysis.summary(),  // 관계 분석
                recentChat.isEmpty() ? "(대화 없음)" : recentChat          // 최근 대화 맥락
        );

        log.info("=== AI Reply Generation ===");
        log.info("User: {}, Event: {}, Intimacy: {}", userName, eventType, intimacyScore);
        log.info("User messages count: {}", userMessages.size());
        log.info("Recent chat: {}", recentChat.length() > 100 ? recentChat.substring(0, 100) + "..." : recentChat);

        String response = openAIClient.chat("", prompt);

        log.info("OpenAI response: {}", response != null ? response.substring(0, Math.min(200, response.length())) + "..." : "NULL");

        // 사용자 스타일 분석 (fallback용)
        UserStyle userStyle = analyzeUserStyle(userMessages);

        if (response == null) {
            log.warn("OpenAI returned null, using fallback");
            return getDefaultReplyResult(eventType, intimacyScore, userStyle);
        }

        try {
            // JSON 추출 (마크다운 코드 블록 제거)
            String jsonResponse = extractJson(response);
            log.info("Extracted JSON: {}", jsonResponse.substring(0, Math.min(200, jsonResponse.length())) + "...");

            ReplyGenerationResult result = objectMapper.readValue(jsonResponse, ReplyGenerationResult.class);
            log.info("Successfully parsed AI response with {} replies", result.replies() != null ? result.replies().size() : 0);
            return result;
        } catch (JsonProcessingException e) {
            log.error("Failed to parse reply generation response: {}", e.getMessage());
            log.error("Raw response was: {}", response);
            return getDefaultReplyResult(eventType, intimacyScore, userStyle);
        }
    }

    /**
     * 사용자의 메시지에서 스타일 분석
     */
    private UserStyle analyzeUserStyle(List<Message> messages) {
        if (messages.isEmpty()) {
            return new UserStyle(false, false, false, "보통");
        }

        String allContent = messages.stream()
                .map(Message::getContent)
                .collect(Collectors.joining(" "));

        // 이모티콘 사용 여부 (이모지 유니코드 범위 체크)
        boolean usesEmoji = allContent.codePoints()
                .anyMatch(cp -> (cp >= 0x1F300 && cp <= 0x1F9FF) || (cp >= 0x2600 && cp <= 0x26FF));

        // ㅋㅋ, ㅎㅎ 등 사용 여부
        boolean usesLaughter = allContent.contains("ㅋㅋ") || allContent.contains("ㅎㅎ");

        // 느낌표 많이 사용 (하이텐션)
        long exclamationCount = allContent.chars().filter(ch -> ch == '!').count();
        boolean highTension = exclamationCount > messages.size() * 2;

        // 존댓말 사용 여부
        String politeness = "반말";
        if (allContent.contains("요") || allContent.contains("습니다") || allContent.contains("세요")) {
            politeness = "존댓말";
        }

        return new UserStyle(usesEmoji, usesLaughter, highTension, politeness);
    }

    private record UserStyle(boolean usesEmoji, boolean usesLaughter, boolean highTension, String politeness) {}

    /**
     * AI 기반 이벤트 감지 (기존 패턴 매칭 + AI 분석)
     */
    public EventDetectionResult detectEvent(String messageContent) {
        String prompt = String.format(EVENT_DETECTION_PROMPT, messageContent);
        String response = openAIClient.chat("", prompt);

        if (response == null) {
            return new EventDetectionResult("GENERAL", 0.0, List.of(), "분석 실패");
        }

        try {
            return objectMapper.readValue(response, EventDetectionResult.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse event detection response", e);
            return new EventDetectionResult("GENERAL", 0.0, List.of(), "파싱 실패");
        }
    }

    /**
     * 결혼 초대 메시지에 대한 자동 답장 생성
     * 대화 내용을 분석하여 친밀도를 평가하고 참석 여부를 결정
     */
    public WeddingAutoReplyResult generateWeddingAutoReply(Long chatRoomId, Long userId, Long friendId) {
        // 채팅 기록 가져오기
        List<Message> messages = messageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoomId);

        if (messages.isEmpty()) {
            return getDefaultWeddingReply();
        }

        // 채팅 기록 포맷팅
        String chatHistory = formatChatHistory(messages, userId);

        // 친구 이름 가져오기
        String friendName = userRepository.findById(friendId)
                .map(User::getName)
                .orElse("친구");

        String userMessage = String.format(
                "분석 대상: 나와 %s의 대화\n\n대화 기록:\n%s",
                friendName, chatHistory
        );

        String response = openAIClient.chat(WEDDING_AUTO_REPLY_PROMPT, userMessage);

        if (response == null) {
            return getDefaultWeddingReply();
        }

        try {
            return objectMapper.readValue(response, WeddingAutoReplyResult.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse wedding auto reply response: {}", e.getMessage());
            return getDefaultWeddingReply();
        }
    }

    private WeddingAutoReplyResult getDefaultWeddingReply() {
        return new WeddingAutoReplyResult(
                50,
                "대화 기록 분석 불가",
                false,
                "분석 실패로 인해 기본 응답",
                "결혼 축하해! 행복하게 잘 살아~",
                "AI 분석이 불가능하여 기본 답장을 생성했습니다"
        );
    }

    /**
     * 친밀도 점수에 따른 자동 답장 생성 (설정 기반)
     */
    public AutoReplyResult generateAutoReply(
            Long chatRoomId,
            Long userId,
            Long friendId,
            String eventType
    ) {
        // 사용자 설정 확인
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElse(null);

        if (settings == null || settings.getReplyMode() != UserSettings.ReplyMode.AUTO) {
            return new AutoReplyResult(false, null, "자동 답장이 비활성화되어 있습니다");
        }

        // 친밀도 확인
        Integer intimacyScore = friendshipRepository.findByUserIdAndFriendId(userId, friendId)
                .map(Friendship::getIntimacyScore)
                .orElse(100); // 기본값은 자동 답장 안 함

        // 자동 답장 임계값 확인
        if (intimacyScore > settings.getAutoReplyThreshold()) {
            return new AutoReplyResult(
                    false,
                    null,
                    String.format("친밀도(%d)가 자동 답장 임계값(%d)보다 높습니다",
                            intimacyScore, settings.getAutoReplyThreshold())
            );
        }

        // 답장 생성
        ReplyGenerationResult replies = generateReply(chatRoomId, userId, friendId, eventType);

        if (replies.replies() == null || replies.replies().isEmpty()) {
            return new AutoReplyResult(false, null, "답장 생성에 실패했습니다");
        }

        // 추천 답장 선택
        int recommendedIndex = replies.recommendedIndex() != null ? replies.recommendedIndex() : 0;
        ReplyOption selectedReply = replies.replies().get(recommendedIndex);

        return new AutoReplyResult(
                true,
                selectedReply.message(),
                String.format("친밀도 %d점, %s 어조로 자동 답장 생성",
                        intimacyScore, selectedReply.tone())
        );
    }

    private String formatChatHistory(List<Message> messages, Long currentUserId) {
        return messages.stream()
                .map(msg -> {
                    String sender = msg.getSender().getId().equals(currentUserId) ? "나" : msg.getSender().getName();
                    return String.format("[%s] %s: %s",
                            msg.getCreatedAt().toString(), sender, msg.getContent());
                })
                .collect(Collectors.joining("\n"));
    }

    /**
     * OpenAI 응답에서 JSON 추출 (마크다운 코드 블록 제거)
     */
    private String extractJson(String response) {
        if (response == null) return "";

        String trimmed = response.trim();

        // ```json ... ``` 형식 처리
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        // ``` ... ``` 형식 처리
        else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }

        // { 로 시작하는 부분 찾기
        int jsonStart = trimmed.indexOf('{');
        int jsonEnd = trimmed.lastIndexOf('}');

        if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
            return trimmed.substring(jsonStart, jsonEnd + 1);
        }

        return trimmed.trim();
    }

    private RelationshipAnalysis getDefaultRelationshipAnalysis() {
        return new RelationshipAnalysis(
                "지인",
                "보통",
                "혼용",
                "알 수 없음",
                List.of(),
                "중립적",
                "분석할 대화 기록이 부족합니다"
        );
    }

    private ReplyGenerationResult getDefaultReplyResult(String eventType, int intimacy, UserStyle style) {
        boolean polite = style.politeness().equals("존댓말");

        String politeMessage, friendlyMessage, formalMessage;

        switch (eventType.toUpperCase()) {
            case "WEDDING" -> {
                if (polite) {
                    politeMessage = "와 정말 축하해요! 너무 기쁜 소식이에요 😊 당연히 갈게요! 청첩장 보내주세요~";
                    friendlyMessage = "헐 대박!! 축하해요!! 🎉💕 꼭 갈게요 진짜!! 신랑/신부 누구예요?!";
                    formalMessage = "결혼 축하드립니다. 그날 일정 확인해보고 연락드릴게요.";
                } else {
                    politeMessage = "와 정말 축하해! 너무 기쁜 소식이다 😊 당연히 갈게! 청첩장 보내줘~";
                    friendlyMessage = "헐 대박!! 축하해 친구야!! 🎉💕 꼭 갈게 진짜!! 신랑/신부 누구야?!";
                    formalMessage = "결혼 축하해. 그날 일정 확인해보고 연락할게.";
                }
            }
            case "BIRTHDAY" -> {
                if (polite) {
                    politeMessage = "생일 축하드려요! 좋은 하루 보내세요 🎂";
                    friendlyMessage = "생일 축하해요!! 🎉🎈 올해도 건강하고 행복하세요!";
                    formalMessage = "생일 축하드립니다. 좋은 한 해 되세요.";
                } else {
                    politeMessage = "생일 축하해! 좋은 하루 보내 🎂";
                    friendlyMessage = "생일 축하해!! 🎉🎈 올해도 건강하고 행복하자!";
                    formalMessage = "생일 축하해. 좋은 한 해 보내.";
                }
            }
            case "FUNERAL" -> {
                politeMessage = "정말 안타깝네요. 삼가 고인의 명복을 빕니다.";
                friendlyMessage = "많이 힘들겠다... 옆에 있어줄게. 필요한 거 있으면 말해.";
                formalMessage = "깊은 위로의 말씀을 전합니다. 삼가 고인의 명복을 빕니다.";
            }
            case "REUNION" -> {
                if (polite) {
                    politeMessage = "오랜만이에요! 잘 지내셨어요? 반가워요 😊";
                    friendlyMessage = "헐 진짜 오랜만이에요!! 어떻게 지냈어요?! 😄";
                    formalMessage = "오랜만이네요. 잘 지내셨나요?";
                } else {
                    politeMessage = "오랜만이야! 잘 지냈어? 반가워 😊";
                    friendlyMessage = "헐 진짜 오랜만!! 어떻게 지냈어?! 😄";
                    formalMessage = "오랜만이네. 잘 지냈어?";
                }
            }
            default -> {
                if (polite) {
                    politeMessage = "네, 확인했어요 😊";
                    friendlyMessage = "오키오키!! 👍";
                    formalMessage = "네, 확인했습니다.";
                } else {
                    politeMessage = "응 알겠어! 확인했어 😊";
                    friendlyMessage = "오키오키!! 👍";
                    formalMessage = "응, 확인했어.";
                }
            }
        }

        return new ReplyGenerationResult(
                List.of(
                    new ReplyOption("정중한", politeMessage, null),
                    new ReplyOption("친근한", friendlyMessage, null),
                    new ReplyOption("공식적", formalMessage, null)
                ),
                0,
                "대화 분석을 기반으로 추천합니다"
        );
    }

    // DTO Records
    public record RelationshipAnalysis(
            String relationshipType,
            String intimacyLevel,
            String communicationStyle,
            String lastContactPeriod,
            List<String> keyTopics,
            String emotionalTone,
            String summary
    ) {}

    public record ReplyGenerationResult(
            List<ReplyOption> replies,
            Integer recommendedIndex,
            String aiInsight
    ) {}

    public record ReplyOption(
            String tone,
            String message,
            String explanation
    ) {}

    public record EventDetectionResult(
            String eventType,
            Double confidence,
            List<String> keywords,
            String context
    ) {}

    public record AutoReplyResult(
            boolean shouldAutoReply,
            String message,
            String reason
    ) {}

    public record WeddingAutoReplyResult(
            Integer intimacyScore,
            String intimacyReason,
            Boolean willAttend,
            String attendanceReason,
            String replyMessage,
            String summary
    ) {}
}
