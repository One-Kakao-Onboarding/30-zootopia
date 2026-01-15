package com.katoksai.backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.katoksai.backend.config.OpenAIConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAIClient {

    private final WebClient openAIWebClient;
    private final OpenAIConfig openAIConfig;

    /**
     * Send a chat completion request to OpenAI
     */
    public String chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, openAIConfig.getModel());
    }

    /**
     * Send a chat completion request to OpenAI with specific model
     */
    public String chat(String systemPrompt, String userMessage, String model) {
        try {
            ChatRequest request = new ChatRequest(
                    model,
                    List.of(
                            new ChatMessage("system", systemPrompt),
                            new ChatMessage("user", userMessage)
                    ),
                    openAIConfig.getMaxTokens(),
                    0.7
            );

            ChatResponse response = openAIWebClient.post()
                    .uri("/chat/completions")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ChatResponse.class)
                    .timeout(Duration.ofMillis(openAIConfig.getTimeout()))
                    .block();

            if (response != null && response.choices() != null && !response.choices().isEmpty()) {
                String content = response.choices().get(0).message().content();
                log.debug("OpenAI response: {}", content);
                return content;
            }

            log.warn("Empty response from OpenAI");
            return null;

        } catch (Exception e) {
            log.error("Failed to call OpenAI API", e);
            return null;
        }
    }

    /**
     * Async chat completion
     */
    public Mono<String> chatAsync(String systemPrompt, String userMessage) {
        ChatRequest request = new ChatRequest(
                openAIConfig.getModel(),
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userMessage)
                ),
                openAIConfig.getMaxTokens(),
                0.7
        );

        return openAIWebClient.post()
                .uri("/chat/completions")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .timeout(Duration.ofMillis(openAIConfig.getTimeout()))
                .map(response -> {
                    if (response.choices() != null && !response.choices().isEmpty()) {
                        return response.choices().get(0).message().content();
                    }
                    return null;
                })
                .onErrorResume(e -> {
                    log.error("Failed to call OpenAI API async", e);
                    return Mono.empty();
                });
    }

    // Request/Response DTOs
    public record ChatRequest(
            String model,
            List<ChatMessage> messages,
            @JsonProperty("max_tokens") Integer maxTokens,
            double temperature
    ) {
        // Constructor that handles 0 or negative maxTokens by setting to null (no limit)
        public ChatRequest(String model, List<ChatMessage> messages, int maxTokens, double temperature) {
            this(model, messages, maxTokens > 0 ? maxTokens : null, temperature);
        }
    }

    public record ChatMessage(
            String role,
            String content
    ) {}

    public record ChatResponse(
            String id,
            String object,
            long created,
            String model,
            List<Choice> choices,
            Usage usage
    ) {}

    public record Choice(
            int index,
            ChatMessage message,
            @JsonProperty("finish_reason") String finishReason
    ) {}

    public record Usage(
            @JsonProperty("prompt_tokens") int promptTokens,
            @JsonProperty("completion_tokens") int completionTokens,
            @JsonProperty("total_tokens") int totalTokens
    ) {}
}
