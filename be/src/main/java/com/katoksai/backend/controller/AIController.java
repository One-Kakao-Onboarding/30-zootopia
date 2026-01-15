package com.katoksai.backend.controller;

import com.katoksai.backend.dto.request.GenerateReplyRequest;
import com.katoksai.backend.dto.response.AIReplyResponse;
import com.katoksai.backend.dto.response.ApiResponse;
import com.katoksai.backend.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "AI 분석 및 답장 생성 API")
public class AIController {

    private final AIService aiService;

    @PostMapping("/analyze-relationship")
    @Operation(summary = "관계 분석", description = "채팅 기록을 바탕으로 두 사람의 관계를 분석합니다.")
    public ResponseEntity<ApiResponse<AIReplyResponse.RelationshipAnalysisDto>> analyzeRelationship(
            @RequestParam Long userId,
            @RequestParam Long chatRoomId,
            @RequestParam Long friendId) {

        AIService.RelationshipAnalysis analysis = aiService.analyzeRelationship(chatRoomId, userId, friendId);
        AIReplyResponse.RelationshipAnalysisDto response = AIReplyResponse.RelationshipAnalysisDto.from(analysis);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/generate-reply")
    @Operation(summary = "답장 생성", description = "이벤트와 관계 분석을 바탕으로 적절한 답장 옵션을 생성합니다.")
    public ResponseEntity<ApiResponse<AIReplyResponse>> generateReply(
            @RequestParam Long userId,
            @RequestBody GenerateReplyRequest request) {

        // 관계 분석
        AIService.RelationshipAnalysis relationshipAnalysis = aiService.analyzeRelationship(
                request.getChatRoomId(), userId, request.getFriendId());

        // 답장 생성
        AIService.ReplyGenerationResult result = aiService.generateReply(
                request.getChatRoomId(),
                userId,
                request.getFriendId(),
                request.getEventType()
        );

        AIReplyResponse response = AIReplyResponse.builder()
                .replies(result.replies().stream()
                        .map(AIReplyResponse.ReplyOptionDto::from)
                        .collect(Collectors.toList()))
                .recommendedIndex(result.recommendedIndex())
                .aiInsight(result.aiInsight())
                .relationshipAnalysis(AIReplyResponse.RelationshipAnalysisDto.from(relationshipAnalysis))
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/detect-event")
    @Operation(summary = "이벤트 감지", description = "메시지에서 특별한 이벤트(결혼/생일/부고 등)를 감지합니다.")
    public ResponseEntity<ApiResponse<AIService.EventDetectionResult>> detectEvent(
            @RequestBody Map<String, String> request) {

        String message = request.get("message");
        AIService.EventDetectionResult result = aiService.detectEvent(message);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/auto-reply")
    @Operation(summary = "자동 답장 생성", description = "설정에 따라 자동 답장을 생성합니다. 친밀도가 임계값 이하일 때만 동작합니다.")
    public ResponseEntity<ApiResponse<AIService.AutoReplyResult>> generateAutoReply(
            @RequestParam Long userId,
            @RequestBody GenerateReplyRequest request) {

        AIService.AutoReplyResult result = aiService.generateAutoReply(
                request.getChatRoomId(),
                userId,
                request.getFriendId(),
                request.getEventType()
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
