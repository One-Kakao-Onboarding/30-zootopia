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
        당신은 메시지 스타일 분석 및 작성 전문가입니다.
        사용자의 평소 대화 스타일을 분석하여, 그 스타일에 맞는 답장을 생성해주세요.

        ## 분석 대상: "%s"님의 대화 스타일

        ### 사용자의 과거 메시지들 (스타일 학습용):
        %s

        ### 스타일 분석 포인트:
        1. 이모티콘 사용 빈도와 종류 (💕😆🎉 등)
        2. 말투 (반말/존댓말/혼용)
        3. 문장 종결어 (ㅋㅋ, !!, ~~, 요 등)
        4. 텐션 레벨 (차분함 vs 활발함)
        5. 감정 표현 방식

        ### 현재 상황:
        - 이벤트 유형: %s
        - 상대방과의 친밀도: %d/100
        - 관계 분석: %s

        ### 최근 대화 맥락:
        %s

        ## 생성 규칙:
        - 사용자의 평소 스타일을 최대한 반영하세요
        - 사용자가 이모티콘을 많이 쓰면 답장에도 비슷한 이모티콘을 넣으세요
        - 사용자가 "ㅋㅋ"를 자주 쓰면 답장에도 포함하세요
        - 사용자가 존댓말을 쓰면 존댓말로, 반말을 쓰면 반말로 생성하세요
        - 3가지 변형을 제공하되, 모두 사용자의 기본 스타일을 유지하면서 강도만 조절하세요

        다음 JSON 형식으로 반환해주세요:
        {
            "replies": [
                {
                    "tone": "사용자 스타일 (기본)",
                    "message": "사용자의 평소 스타일로 작성된 답장",
                    "explanation": "사용자의 대화 패턴을 반영한 이유"
                },
                {
                    "tone": "조금 더 격식있게",
                    "message": "살짝 더 격식있는 버전",
                    "explanation": "격식을 높인 이유"
                },
                {
                    "tone": "조금 더 친근하게",
                    "message": "살짝 더 친근한 버전",
                    "explanation": "친근함을 높인 이유"
                }
            ],
            "recommendedIndex": 0,
            "aiInsight": "사용자의 대화 스타일 분석 결과 및 추천 이유"
        }

        JSON만 반환하세요.
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

        // 사용자의 과거 메시지 수집 (스타일 학습용) - 최근 30개
        List<Message> userMessages = messageRepository.findBySenderIdOrderByCreatedAtDesc(userId);
        int styleLimit = Math.min(30, userMessages.size());
        String userStyleMessages = userMessages.subList(0, styleLimit).stream()
                .map(Message::getContent)
                .collect(Collectors.joining("\n"));

        // 현재 채팅방의 최근 대화 (맥락용)
        List<Message> recentMessages = messageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(chatRoomId);
        int startIndex = Math.max(0, recentMessages.size() - 15);
        List<Message> limitedMessages = recentMessages.subList(startIndex, recentMessages.size());
        String recentChat = formatChatHistory(limitedMessages, userId);

        // 관계 분석
        RelationshipAnalysis relationshipAnalysis = analyzeRelationship(chatRoomId, userId, friendId);

        String prompt = String.format(
                REPLY_GENERATION_PROMPT,
                userName,           // 사용자 이름
                userStyleMessages,  // 사용자의 과거 메시지들 (스타일 학습)
                eventType,          // 이벤트 유형
                intimacyScore,      // 친밀도
                relationshipAnalysis.summary(),  // 관계 분석
                recentChat          // 최근 대화 맥락
        );

        String response = openAIClient.chat("", prompt);

        // 사용자 스타일 분석 (fallback용)
        UserStyle userStyle = analyzeUserStyle(userMessages);

        if (response == null) {
            return getDefaultReplyResult(eventType, intimacyScore, userStyle);
        }

        try {
            return objectMapper.readValue(response, ReplyGenerationResult.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse reply generation response", e);
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
        // 사용자 스타일에 맞춘 답장 생성
        String emoji = style.usesEmoji() ? " 💕" : "";
        String laugh = style.usesLaughter() ? " ㅋㅋ" : "";
        String exclaim = style.highTension() ? "!!" : "";
        boolean polite = style.politeness().equals("존댓말");

        String baseMessage, morePoliteMessage, moreFriendlyMessage;

        switch (eventType.toUpperCase()) {
            case "WEDDING" -> {
                if (polite) {
                    // 존댓말 스타일
                    baseMessage = style.highTension()
                            ? "헐 결혼 축하드려요!!" + emoji + " 정말 기쁜 소식이에요! 꼭 갈게요!"
                            : "결혼 축하드려요" + emoji + " 좋은 소식이네요. 꼭 참석할게요.";
                    morePoliteMessage = "결혼을 진심으로 축하드립니다. 행복한 가정 이루시길 바랍니다.";
                    moreFriendlyMessage = "와 결혼 축하드려요!!" + emoji + laugh + " 너무 기뻐요! 꼭 갈게요!";
                } else {
                    // 반말 스타일
                    baseMessage = style.highTension()
                            ? "헐 축하해" + exclaim + emoji + " 드디어" + exclaim + " 꼭 갈게" + exclaim
                            : "축하해" + emoji + laugh + " 꼭 갈게~";
                    morePoliteMessage = "축하해" + emoji + " 결혼 잘 하고 행복하게 살아~";
                    moreFriendlyMessage = "아 진짜" + exclaim + " 대박" + exclaim + emoji + laugh + " 완전 축하해" + exclaim + " 무조건 갈게" + exclaim;
                }
            }
            case "BIRTHDAY" -> {
                if (polite) {
                    baseMessage = style.highTension()
                            ? "생일 축하드려요!!" + emoji + " 좋은 하루 보내세요!"
                            : "생일 축하드려요" + emoji + " 행복한 하루 되세요.";
                    morePoliteMessage = "생신 축하드립니다. 건강하고 행복한 한 해 되시길 바랍니다.";
                    moreFriendlyMessage = "생축이에요!!" + emoji + laugh + " 맛있는 거 드세요!";
                } else {
                    baseMessage = style.highTension()
                            ? "생축" + exclaim + emoji + laugh + " 맛있는 거 먹어" + exclaim
                            : "생일 축하해" + emoji + laugh + " 좋은 하루 보내~";
                    morePoliteMessage = "생일 축하해" + emoji + " 좋은 하루 보내~";
                    moreFriendlyMessage = "야 생축" + exclaim + exclaim + emoji + laugh + " 선물 뭐 갖고싶어" + exclaim;
                }
            }
            case "FUNERAL" -> {
                if (polite) {
                    baseMessage = "삼가 고인의 명복을 빕니다. 힘내세요.";
                    morePoliteMessage = "삼가 故人의 명복을 빕니다. 유가족분들께 깊은 위로의 말씀을 드립니다.";
                    moreFriendlyMessage = "정말 마음이 아프네요.. 힘든 시간 잘 이겨내세요. 필요한 거 있으면 말씀해주세요.";
                } else {
                    baseMessage = "삼가 고인의 명복을 빌어.. 많이 힘들겠다. 필요한 거 있으면 말해.";
                    morePoliteMessage = "삼가 고인의 명복을 빕니다. 힘내.";
                    moreFriendlyMessage = "정말 마음이 아프다.. 옆에 있어줄게. 힘든 거 있으면 다 말해.";
                }
            }
            case "REUNION" -> {
                if (polite) {
                    baseMessage = style.highTension()
                            ? "오랜만이에요!!" + emoji + " 너무 반가워요!"
                            : "오랜만이에요" + emoji + " 잘 지내셨어요?";
                    morePoliteMessage = "오랜만에 연락드려요. 그동안 잘 지내셨나요?";
                    moreFriendlyMessage = "헐 오랜만이에요!!" + emoji + laugh + " 보고싶었어요!";
                } else {
                    baseMessage = style.highTension()
                            ? "오랜만" + exclaim + emoji + laugh + " 어떻게 지냈어" + exclaim
                            : "오랜만이야" + emoji + laugh + " 잘 지냈어?";
                    morePoliteMessage = "오랜만이야" + emoji + " 잘 지내고 있었어?";
                    moreFriendlyMessage = "헐 오랜만" + exclaim + exclaim + emoji + laugh + " 보고싶었어" + exclaim + " 뭐해" + exclaim;
                }
            }
            default -> {
                if (polite) {
                    baseMessage = "네, 확인했어요" + emoji;
                    morePoliteMessage = "네, 확인하였습니다.";
                    moreFriendlyMessage = "넵넵" + exclaim + emoji + laugh;
                } else {
                    baseMessage = "ㅇㅋ 확인" + emoji + laugh;
                    morePoliteMessage = "응 확인했어" + emoji;
                    moreFriendlyMessage = "ㅇㅋㅇㅋ" + exclaim + emoji + laugh;
                }
            }
        }

        // 사용자 스타일 설명
        String styleDesc = String.format("이모지%s, %s, 텐션%s",
                style.usesEmoji() ? "O" : "X",
                style.politeness(),
                style.highTension() ? "높음" : "보통");

        // 추천 인덱스: 기본 스타일(0)을 추천
        int recommendedIndex = 0;

        return new ReplyGenerationResult(
                List.of(
                    new ReplyOption("내 스타일", baseMessage, "평소 대화 패턴(" + styleDesc + ")을 반영한 답장"),
                    new ReplyOption("조금 더 격식있게", morePoliteMessage, "살짝 더 격식을 갖춘 버전"),
                    new ReplyOption("조금 더 친근하게", moreFriendlyMessage, "살짝 더 친근한 버전")
                ),
                recommendedIndex,
                "AI 분석이 불가능하여 기본 답장을 제공합니다. 친밀도(" + intimacy + "점)를 기반으로 추천합니다."
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
