package com.katoksai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelationshipStatsResponse {

    private Long bestieCount;
    private Long closeCount;
    private Long acquaintanceCount;
    private Long distantCount;
    private Long totalFriends;
    private List<FriendResponse> ranking;
}
