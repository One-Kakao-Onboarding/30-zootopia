package com.katoksai.backend.config;

import com.katoksai.backend.entity.*;
import com.katoksai.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final MessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;

    @Override
    @Transactional
    public void run(String... args) {
        createDefaultUsers();
        createMockConversations();
    }

    private void createDefaultUsers() {
        List<DefaultUser> defaultUsers = List.of(
                new DefaultUser("malang", "말랑", "말랑말랑~ 💕"),
                new DefaultUser("rui", "루이", "루이에요~ ✨"),
                new DefaultUser("kirby", "커비", "뿌요뿌요!! 🌟"),
                new DefaultUser("lea", "레아", "반갑습니다.")
        );

        for (DefaultUser defaultUser : defaultUsers) {
            if (!userRepository.existsByUserId(defaultUser.userId)) {
                User user = User.builder()
                        .userId(defaultUser.userId)
                        .password("")
                        .name(defaultUser.name)
                        .statusMessage(defaultUser.statusMessage)
                        .status(User.UserStatus.OFFLINE)
                        .build();

                User savedUser = userRepository.save(user);

                UserSettings settings = UserSettings.builder()
                        .user(savedUser)
                        .build();
                userSettingsRepository.save(settings);

                log.info("Default user created: {} ({})", defaultUser.name, defaultUser.userId);
            } else {
                log.info("Default user already exists: {}", defaultUser.userId);
            }
        }
    }

    private void createMockConversations() {
        // 기존 데이터 삭제 후 새로 생성
        if (chatRoomRepository.count() > 0) {
            log.info("Clearing existing mock data...");
            messageRepository.deleteAll();
            chatRoomMemberRepository.deleteAll();
            chatRoomRepository.deleteAll();
            friendshipRepository.deleteAll();
            log.info("Existing data cleared.");
        }

        User malang = userRepository.findByUserId("malang").orElse(null);
        User rui = userRepository.findByUserId("rui").orElse(null);
        User kirby = userRepository.findByUserId("kirby").orElse(null);
        User lea = userRepository.findByUserId("lea").orElse(null);

        if (malang == null || rui == null || kirby == null || lea == null) {
            log.warn("Cannot create mock conversations - users not found");
            return;
        }

        // ============================================
        // 1. 루이 & 말랑 (살갑고 친밀한 베프) - 친밀도 95
        // ============================================
        ChatRoom ruiMalangRoom = createDirectChatRoom(rui, malang);
        createFriendship(rui, malang, 95);

        List<MockMessage> ruiMalangMessages = List.of(
                new MockMessage(rui, "말랑아아아아아 💕💕"),
                new MockMessage(malang, "루이야아아 뭐해뭐해?? 😆"),
                new MockMessage(rui, "심심해서 연락했지 ㅎㅎㅎ 🥺"),
                new MockMessage(malang, "ㅋㅋㅋㅋ 나도 지금 심심했어!! 💗"),
                new MockMessage(rui, "우리 이번 주말에 만나자!! 🙌"),
                new MockMessage(malang, "오오오 좋아좋아!! 어디서 볼까?? 🤔"),
                new MockMessage(rui, "우리 맨날 가던 카페 어때?? ☕✨"),
                new MockMessage(malang, "거기 케이크 맛있었지!! 가자가자 🍰💕"),
                new MockMessage(rui, "ㅋㅋㅋㅋ 역시 말랑이 취향 👍"),
                new MockMessage(malang, "에이 뭘 ㅋㅋㅋ 루이도 좋아하잖아 😙"),
                new MockMessage(rui, "아 맞다!! 나 얘기할 거 있어 👀"),
                new MockMessage(malang, "뭔데뭔데?? 궁금해 ㅋㅋ"),
                new MockMessage(rui, "만나서 얘기해줄게 비밀이야 🤫"),
                new MockMessage(malang, "에이 궁금하게!! 빨리 말해줘 ㅠㅠ 😫"),
                new MockMessage(rui, "안돼 ㅋㅋㅋ 만나면 알려줄게 기대해 🎁"),
                new MockMessage(malang, "알겠어 ㅋㅋ 기다릴게 😊"),
                new MockMessage(rui, "ㅋㅋ 그럼 토요일 2시에 보자!! 🕐"),
                new MockMessage(malang, "응응!! 기다릴게 빠이빠이 👋💗")
        );

        for (MockMessage msg : ruiMalangMessages) {
            createMessage(ruiMalangRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 1: 루이 & 말랑 (베프) - intimacy 95");

        // ============================================
        // 2. 루이 & 커비 (텐션 높은 친구) - 친밀도 75
        // ============================================
        ChatRoom ruiKirbyRoom = createDirectChatRoom(rui, kirby);
        createFriendship(rui, kirby, 75);

        List<MockMessage> ruiKirbyMessages = List.of(
                new MockMessage(kirby, "루이"),
                new MockMessage(rui, "커비야 왜왜왜?? ㅋㅋㅋ 😆"),
                new MockMessage(kirby, "나 면접 붙음"),
                new MockMessage(rui, "헐헐 뭔데?? 나도 궁금해!! 🙌"),
                new MockMessage(kirby, "저번에 본 그 회사"),
                new MockMessage(rui, "와아아아 진짜?!?! 대박대박!! 축하해 커비야!! 🎉💕"),
                new MockMessage(kirby, "ㄳ"),
                new MockMessage(kirby, "노력은 안 배신하네"),
                new MockMessage(rui, "ㅋㅋㅋㅋㅋ 커비답다 ㅋㅋㅋ 😂"),
                new MockMessage(kirby, "고기 먹으러 가자"),
                new MockMessage(rui, "이번 주 금요일 어때?? ✨"),
                new MockMessage(kirby, "금요일 ㅇㅋ"),
                new MockMessage(kirby, "삼겹살 가자"),
                new MockMessage(rui, "ㅋㅋㅋㅋ 나도 기대돼!! 🥳"),
                new MockMessage(kirby, "ㅇㅇ"),
                new MockMessage(rui, "진짜 축하해 커비 💖 화이팅!!"),
                new MockMessage(kirby, "ㄳ 형도")
        );

        for (MockMessage msg : ruiKirbyMessages) {
            createMessage(ruiKirbyRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 2: 루이 & 커비 (텐션) - intimacy 75");

        // ============================================
        // 3. 루이 & 레아 (차분한 지인) - 친밀도 45
        // ============================================
        ChatRoom ruiLeaRoom = createDirectChatRoom(rui, lea);
        createFriendship(rui, lea, 45);

        List<MockMessage> ruiLeaMessages = List.of(
                new MockMessage(lea, "루이님, 안녕하세요."),
                new MockMessage(rui, "안녕하세요 레아님~ 😊"),
                new MockMessage(lea, "오랜만에 연락드려요. 잘 지내셨나요?"),
                new MockMessage(rui, "네네 잘 지내고 있어요! 레아님은요?? ✨"),
                new MockMessage(lea, "저도 덕분에 잘 지내고 있습니다."),
                new MockMessage(lea, "다름이 아니라 연락드린 이유가 있어서요."),
                new MockMessage(rui, "네 뭔데요?? 궁금해요 ㅎㅎ"),
                new MockMessage(lea, "다음 달에 독서 모임을 열려고 하는데요."),
                new MockMessage(lea, "혹시 시간 되시면 함께하시면 좋겠습니다."),
                new MockMessage(rui, "오오 재밌겠네요!! 무슨 책 읽어요?? 📚"),
                new MockMessage(lea, "이번에는 심리학 관련 책을 읽을 예정이에요."),
                new MockMessage(lea, "정확한 도서명은 다음 주에 공지할 계획입니다."),
                new MockMessage(rui, "좋아요 좋아요!! 저도 관심 있어요 💕"),
                new MockMessage(lea, "참여해 주시면 감사하겠습니다."),
                new MockMessage(lea, "일정이 확정되면 다시 연락드릴게요."),
                new MockMessage(rui, "네네 기다릴게요!! 연락 주세요 😄"),
                new MockMessage(lea, "네, 좋은 하루 보내세요."),
                new MockMessage(rui, "레아님도 좋은 하루 보내세요!! ✨")
        );

        for (MockMessage msg : ruiLeaMessages) {
            createMessage(ruiLeaRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 3: 루이 & 레아 (차분) - intimacy 45");

        // ============================================
        // 4. 말랑 & 커비 (살갑+텐션) - 친밀도 70
        // ============================================
        ChatRoom malangKirbyRoom = createDirectChatRoom(malang, kirby);
        createFriendship(malang, kirby, 70);

        List<MockMessage> malangKirbyMessages = List.of(
                new MockMessage(malang, "커비야아아 💗"),
                new MockMessage(kirby, "말랑"),
                new MockMessage(malang, "뭐해?? 😆"),
                new MockMessage(kirby, "집"),
                new MockMessage(malang, "ㅋㅋㅋㅋ 심심하지 않아?? 💪"),
                new MockMessage(kirby, "게임 새로 샀음"),
                new MockMessage(malang, "오오 뭔데뭔데?? 나도 껴줘!! 😍"),
                new MockMessage(kirby, "발로란트"),
                new MockMessage(kirby, "같이 할래"),
                new MockMessage(malang, "좋아좋아!! 언제?? 🎯"),
                new MockMessage(kirby, "오늘 8시"),
                new MockMessage(malang, "8시 콜!! 💕"),
                new MockMessage(kirby, "ㅇㅋ"),
                new MockMessage(malang, "ㅋㅋㅋ 기대할게 커비야 💕"),
                new MockMessage(kirby, "ㅇㅇ 이따"),
                new MockMessage(malang, "응응 이따 봐!! 🥰")
        );

        for (MockMessage msg : malangKirbyMessages) {
            createMessage(malangKirbyRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 4: 말랑 & 커비 (살갑+텐션) - intimacy 70");

        // ============================================
        // 5. 말랑 & 레아 (살갑+차분) - 친밀도 40
        // ============================================
        ChatRoom malangLeaRoom = createDirectChatRoom(malang, lea);
        createFriendship(malang, lea, 40);

        List<MockMessage> malangLeaMessages = List.of(
                new MockMessage(lea, "말랑님, 안녕하세요."),
                new MockMessage(malang, "안녕하세요 레아님~! 😊"),
                new MockMessage(lea, "지난번 모임 때는 감사했습니다."),
                new MockMessage(malang, "아니에요 저도 재밌었어요 ㅎㅎ 💕"),
                new MockMessage(lea, "다들 좋은 분들이셔서 편했어요."),
                new MockMessage(malang, "맞아요 맞아요 다들 친절하셨어요 ✨"),
                new MockMessage(lea, "다음에도 기회가 되면 또 뵙고 싶네요."),
                new MockMessage(malang, "저도요!! 또 연락해요 레아님 😄"),
                new MockMessage(lea, "네, 그러면 좋겠습니다."),
                new MockMessage(lea, "참, 혹시 추천해주신 책 읽어보셨나요?"),
                new MockMessage(malang, "아직 못 읽었어요 ㅠㅠ 바빠서 😅"),
                new MockMessage(lea, "괜찮아요. 시간 나실 때 읽어보세요."),
                new MockMessage(lea, "천천히 읽으셔도 됩니다."),
                new MockMessage(malang, "네네 꼭 읽을게요!! 감사해요 💗"),
                new MockMessage(lea, "그럼 좋은 하루 보내세요, 말랑님."),
                new MockMessage(malang, "레아님도요!! 안녕히 계세요~! 👋")
        );

        for (MockMessage msg : malangLeaMessages) {
            createMessage(malangLeaRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 5: 말랑 & 레아 (살갑+차분) - intimacy 40");

        // ============================================
        // 6. 커비 & 레아 (텐션+차분) - 친밀도 35
        // ============================================
        ChatRoom kirbyLeaRoom = createDirectChatRoom(kirby, lea);
        createFriendship(kirby, lea, 35);

        List<MockMessage> kirbyLeaMessages = List.of(
                new MockMessage(kirby, "레아"),
                new MockMessage(lea, "안녕하세요, 커비님."),
                new MockMessage(kirby, "안녕"),
                new MockMessage(lea, "잘 지내셨어요?"),
                new MockMessage(kirby, "ㅇㅇ 그럭저럭"),
                new MockMessage(lea, "다행이에요."),
                new MockMessage(kirby, "모임 있다던데"),
                new MockMessage(lea, "네, 다음 주에 있어요."),
                new MockMessage(kirby, "갈거임?"),
                new MockMessage(lea, "네, 참석할 예정이에요."),
                new MockMessage(kirby, "ㅇㅋ 나도 감"),
                new MockMessage(lea, "네, 그때 뵙겠습니다."),
                new MockMessage(kirby, "그래"),
                new MockMessage(lea, "좋은 하루 보내세요."),
                new MockMessage(kirby, "ㅇㅇ 레아도")
        );

        for (MockMessage msg : kirbyLeaMessages) {
            createMessage(kirbyLeaRoom, msg.sender, msg.content);
        }

        log.info("Created mock conversation 6: 커비 & 레아 (텐션+차분) - intimacy 35");

        // ============================================
        // 추가 대화: 루이 & 말랑 일상 대화 2
        // ============================================
        List<MockMessage> ruiMalangMessages2 = List.of(
                new MockMessage(malang, "루이야 뭐해?? 😊"),
                new MockMessage(rui, "응 집에서 쉬고 있어 ㅎㅎ 넌?? 💕"),
                new MockMessage(malang, "나도 집이야 ㅋㅋ 심심해서 연락했어 🥺"),
                new MockMessage(rui, "ㅋㅋㅋ 나도 방금 연락하려던 참 😆"),
                new MockMessage(malang, "오 찐친 텔레파시 ㅋㅋㅋ 💗"),
                new MockMessage(rui, "아 오늘 점심 뭐 먹었어?? 🍽️"),
                new MockMessage(malang, "나 파스타 먹었어!! 완전 맛있었어 😋"),
                new MockMessage(rui, "오오 어디서?? 나도 파스타 땡기는데!! 🍝"),
                new MockMessage(malang, "집 앞에 새로 생긴 데!! 다음에 같이 가자 💕"),
                new MockMessage(rui, "좋아좋아!! 완전 기대돼 ㅎㅎ ✨"),
                new MockMessage(malang, "ㅋㅋ 그럼 이번 주에 시간 맞춰보자!! 😆"),
                new MockMessage(rui, "응응!! 카톡해 줘 💗"),
                new MockMessage(malang, "알겠어!! 그때 보자 루이야 😊"),
                new MockMessage(rui, "ㅇㅇ 그때 봐 말랑아!! 👋💕")
        );

        for (MockMessage msg : ruiMalangMessages2) {
            createMessage(ruiMalangRoom, msg.sender, msg.content);
        }

        // ============================================
        // 추가 대화: 커비 결혼 소식 (루이에게)
        // ============================================
        List<MockMessage> kirbyWeddingMessages = List.of(
                new MockMessage(kirby, "루이"),
                new MockMessage(kirby, "나 결혼함"),
                new MockMessage(rui, "헉 뭔데뭔데?? 😮"),
                new MockMessage(rui, "헐?!?!?!?! 진짜야?!?! 😱💕"),
                new MockMessage(kirby, "ㅇㅇ"),
                new MockMessage(rui, "와아아아 축하해 커비야!! 언제야?? 🎊"),
                new MockMessage(kirby, "5월 25일 토요일"),
                new MockMessage(kirby, "와라"),
                new MockMessage(rui, "당연하지!! 무조건 갈게!! 💕"),
                new MockMessage(kirby, "ㄳ"),
                new MockMessage(rui, "에이 ㅋㅋ 당연히 가야지!! 청첩장 보내줘!! 💌"),
                new MockMessage(kirby, "보낼게")
        );

        for (MockMessage msg : kirbyWeddingMessages) {
            createMessage(ruiKirbyRoom, msg.sender, msg.content);
        }

        // ============================================
        // 추가 대화: 레아 결혼 소식 (말랑에게)
        // ============================================
        List<MockMessage> leaWeddingMessages = List.of(
                new MockMessage(lea, "말랑님, 안녕하세요."),
                new MockMessage(lea, "갑작스럽게 연락드려서 죄송합니다."),
                new MockMessage(malang, "아니에요~ 무슨 일이세요?? 😊"),
                new MockMessage(lea, "다름이 아니라 좋은 소식이 있어서요."),
                new MockMessage(lea, "제가 결혼을 하게 되었습니다."),
                new MockMessage(malang, "헐 진짜요?? 축하드려요!! 🎉💕"),
                new MockMessage(lea, "감사합니다. 7월 12일에 식을 올릴 예정이에요."),
                new MockMessage(lea, "바쁘시겠지만 시간 되시면 참석해 주시면 감사하겠습니다."),
                new MockMessage(malang, "물론이죠!! 꼭 갈게요 레아님!! 😊✨"),
                new MockMessage(lea, "정말 감사합니다. 청첩장은 따로 보내드릴게요."),
                new MockMessage(malang, "네네 기다릴게요!! 다시 한번 축하드려요 💗"),
                new MockMessage(lea, "감사합니다, 말랑님. 좋은 하루 보내세요.")
        );

        for (MockMessage msg : leaWeddingMessages) {
            createMessage(malangLeaRoom, msg.sender, msg.content);
        }

        log.info("All mock conversations created successfully!");
    }

    private ChatRoom createDirectChatRoom(User user1, User user2) {
        ChatRoom chatRoom = ChatRoom.builder()
                .name(user1.getName() + ", " + user2.getName())
                .type(ChatRoom.ChatRoomType.DIRECT)
                .build();
        chatRoom = chatRoomRepository.save(chatRoom);

        ChatRoomMember member1 = ChatRoomMember.builder()
                .chatRoom(chatRoom)
                .user(user1)
                .role(ChatRoomMember.MemberRole.MEMBER)
                .build();
        chatRoomMemberRepository.save(member1);

        ChatRoomMember member2 = ChatRoomMember.builder()
                .chatRoom(chatRoom)
                .user(user2)
                .role(ChatRoomMember.MemberRole.MEMBER)
                .build();
        chatRoomMemberRepository.save(member2);

        return chatRoom;
    }

    private void createFriendship(User user1, User user2, int intimacyScore) {
        // 양방향 친구 관계 생성
        if (!friendshipRepository.existsByUserAndFriend(user1, user2)) {
            Friendship friendship1 = Friendship.builder()
                    .user(user1)
                    .friend(user2)
                    .intimacyScore(intimacyScore)
                    .status(Friendship.FriendshipStatus.ACCEPTED)
                    .build();
            friendshipRepository.save(friendship1);
        }

        if (!friendshipRepository.existsByUserAndFriend(user2, user1)) {
            Friendship friendship2 = Friendship.builder()
                    .user(user2)
                    .friend(user1)
                    .intimacyScore(intimacyScore)
                    .status(Friendship.FriendshipStatus.ACCEPTED)
                    .build();
            friendshipRepository.save(friendship2);
        }
    }

    private void createMessage(ChatRoom chatRoom, User sender, String content) {
        Message message = Message.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .content(content)
                .type(Message.MessageType.TEXT)
                .build();
        messageRepository.save(message);

        // Small delay to ensure message ordering
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private record DefaultUser(String userId, String name, String statusMessage) {}
    private record MockMessage(User sender, String content) {}
}
