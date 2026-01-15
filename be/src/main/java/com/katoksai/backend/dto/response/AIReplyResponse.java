package com.katoksai.backend.dto.response;

import com.katoksai.backend.service.AIService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIReplyResponse {

    private List<ReplyOptionDto> replies;
    private Integer recommendedIndex;
    private String aiInsight;
    private RelationshipAnalysisDto relationshipAnalysis;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReplyOptionDto {
        private String tone;
        private String message;
        private String explanation;

        public static ReplyOptionDto from(AIService.ReplyOption option) {
            return ReplyOptionDto.builder()
                    .tone(option.tone())
                    .message(option.message())
                    .explanation(option.explanation())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RelationshipAnalysisDto {
        private String relationshipType;
        private String intimacyLevel;
        private String communicationStyle;
        private String summary;

        public static RelationshipAnalysisDto from(AIService.RelationshipAnalysis analysis) {
            return RelationshipAnalysisDto.builder()
                    .relationshipType(analysis.relationshipType())
                    .intimacyLevel(analysis.intimacyLevel())
                    .communicationStyle(analysis.communicationStyle())
                    .summary(analysis.summary())
                    .build();
        }
    }
}
