# P2P 채팅 푸시 알림 - 앱 개발자 가이드

## 백엔드 작업 완료 내역

### ✅ 완료된 작업 (2025-12-01)

Supabase 백엔드에서 P2P 채팅 푸시 알림을 위한 모든 설정이 완료되었습니다.

#### 1. Edge Function 배포
- **Function 이름**: `send-chat-notification`
- **API 방식**: FCM HTTP v1 API (최신 버전)
- **기능**: P2P 채팅 메시지 전송 시 자동으로 푸시 알림 발송

#### 2. Database 자동화
- **Trigger**: `p2p_chat_messages` 테이블에 새 메시지 INSERT 시 자동 실행
- **처리 흐름**:
  ```
  새 메시지 INSERT
    ↓
  Database Trigger 자동 실행
    ↓
  Edge Function 호출
    ↓
  FCM v1 API로 푸시 발송
    ↓
  앱에서 알림 수신
  ```

#### 3. 생성된 데이터베이스 테이블

**`device_tokens` 테이블** - FCM 토큰 저장용

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | BIGSERIAL | Primary Key |
| user_id | INTEGER | 사용자 ID (users 테이블 참조) |
| fcm_token | TEXT | Firebase Cloud Messaging 토큰 |
| platform | TEXT | 'android' 또는 'ios' |
| device_id | TEXT | 디바이스 고유 ID (선택) |
| app_version | TEXT | 앱 버전 (선택) |
| is_active | BOOLEAN | 토큰 활성화 여부 (기본값: true) |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

**제약 조건**:
- UNIQUE(user_id, fcm_token): 동일 사용자의 동일 토큰은 중복 저장 불가

---

## 앱에서 구현해야 할 작업

### 📋 필수 구현 사항

#### 1. FCM 토큰 저장

앱 시작 시 또는 로그인 시 FCM 토큰을 `device_tokens` 테이블에 저장해야 합니다.

**Dart/Flutter 예시 코드:**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io' show Platform;

class FCMService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final SupabaseClient _supabase = Supabase.instance.client;

  /// FCM 초기화 및 토큰 저장
  Future<void> initialize() async {
    // 권한 요청
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ 푸시 알림 권한 승인됨');

      // FCM 토큰 가져오기
      String? token = await _fcm.getToken();
      if (token != null) {
        await _saveTokenToDatabase(token);
      }

      // 토큰 갱신 리스너
      _fcm.onTokenRefresh.listen((newToken) {
        _saveTokenToDatabase(newToken);
      });
    } else {
      print('❌ 푸시 알림 권한 거부됨');
    }
  }

  /// FCM 토큰을 Supabase device_tokens 테이블에 저장
  Future<void> _saveTokenToDatabase(String token) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        print('⚠️ 로그인된 사용자가 없습니다');
        return;
      }

      // device_tokens 테이블에 upsert
      await _supabase.from('device_tokens').upsert({
        'user_id': user.id,
        'fcm_token': token,
        'platform': Platform.isAndroid ? 'android' : 'ios',
        'is_active': true,
        'updated_at': DateTime.now().toIso8601String(),
      });

      print('✅ FCM 토큰 저장 성공: ${token.substring(0, 20)}...');
    } catch (e) {
      print('❌ FCM 토큰 저장 실패: $e');
    }
  }

  /// 로그아웃 시 토큰 비활성화
  Future<void> deactivateToken() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      String? token = await _fcm.getToken();
      if (token == null) return;

      await _supabase
          .from('device_tokens')
          .update({'is_active': false})
          .eq('user_id', user.id)
          .eq('fcm_token', token);

      print('✅ FCM 토큰 비활성화 완료');
    } catch (e) {
      print('❌ FCM 토큰 비활성화 실패: $e');
    }
  }
}
```

**호출 위치:**

```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await Supabase.initialize(...);

  // FCM 초기화
  final fcmService = FCMService();
  await fcmService.initialize();

  runApp(MyApp());
}
```

---

#### 2. 알림 수신 및 처리

**포그라운드 알림 처리:**

```dart
class FCMService {
  void setupForegroundNotificationHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📩 포그라운드 알림 수신: ${message.notification?.title}');

      // 로컬 알림 표시 (flutter_local_notifications 사용)
      if (message.notification != null) {
        _showLocalNotification(
          title: message.notification!.title ?? '',
          body: message.notification!.body ?? '',
          data: message.data,
        );
      }
    });
  }

  void _showLocalNotification({
    required String title,
    required String body,
    required Map<String, dynamic> data,
  }) {
    // flutter_local_notifications를 사용하여 로컬 알림 표시
    // 구현 생략 (기존 알림 코드 사용)
  }
}
```

**백그라운드 알림 처리:**

```dart
// main.dart 최상단 (main 함수 밖)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📩 백그라운드 알림 수신: ${message.notification?.title}');
}

void main() async {
  // ...
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  // ...
}
```

---

#### 3. 알림 탭 시 채팅방으로 이동

**알림 데이터 구조:**

백엔드에서 전송하는 알림 데이터:

```json
{
  "notification": {
    "title": "보낸 사람 이름",
    "body": "메시지 내용" 또는 "[이미지]"
  },
  "data": {
    "type": "chat_message",
    "notification_type": "custom",
    "room_id": "123",
    "sender_id": "456",
    "message_id": "789",
    "post_title": "게시글 제목",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

**알림 탭 처리:**

```dart
class FCMService {
  final GlobalKey<NavigatorState> navigatorKey;

  FCMService(this.navigatorKey);

  void setupNotificationTapHandler() {
    // 앱이 종료된 상태에서 알림을 탭하여 실행
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _handleNotificationTap(message);
      }
    });

    // 앱이 백그라운드에 있을 때 알림 탭
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleNotificationTap(message);
    });
  }

  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];

    print('🔔 알림 탭: $data');

    if (type == 'chat_message') {
      final roomId = int.tryParse(data['room_id'] ?? '');
      if (roomId != null) {
        // 채팅방으로 이동
        navigatorKey.currentState?.pushNamed(
          '/chat-room',
          arguments: {
            'room_id': roomId,
            'sender_id': int.tryParse(data['sender_id'] ?? ''),
            'post_title': data['post_title'],
          },
        );
      }
    }
  }
}
```

**전체 초기화 코드:**

```dart
// main.dart
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await Supabase.initialize(...);

  // FCM 설정
  final fcmService = FCMService(navigatorKey);
  await fcmService.initialize();
  fcmService.setupForegroundNotificationHandler();
  fcmService.setupNotificationTapHandler();

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey, // ⭐ 중요: Navigator Key 등록
      routes: {
        '/chat-room': (context) => ChatRoomScreen(),
        // ...
      },
      // ...
    );
  }
}
```

---

## 테스트 방법

### 1. FCM 토큰 저장 확인

Supabase Dashboard → Table Editor → `device_tokens` 테이블 확인:

- 로그인한 사용자의 `user_id`
- FCM 토큰이 저장되어 있는지
- `is_active`가 `true`인지

### 2. 푸시 알림 테스트

**방법 1: 실제 채팅 메시지 전송**
1. 두 개의 디바이스 준비 (또는 하나는 시뮬레이터)
2. 각각 다른 사용자로 로그인
3. 한 쪽에서 채팅 메시지 전송
4. 다른 쪽에서 푸시 알림 수신 확인

**방법 2: SQL 테스트 메시지**

Supabase SQL Editor에서:

```sql
-- 실제 존재하는 room_id와 sender_id로 변경
INSERT INTO p2p_chat_messages
(room_id, sender_id, sender_name, message, message_type)
VALUES (1, 123, '테스트 사용자', '푸시 알림 테스트 메시지', 'text');
```

**Edge Function 로그 확인:**
https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions/send-chat-notification

성공 로그:
```
✅ FCM 알림 발송 성공 (user_id: 456, platform: android)
```

---

## 문제 해결

### ❌ 알림이 오지 않는 경우

#### 1. FCM 토큰 확인
```sql
SELECT * FROM device_tokens WHERE user_id = 받는_사람_user_id;
```
- `fcm_token`이 비어있거나 NULL인 경우 → 앱에서 토큰 저장 로직 확인
- `is_active`가 false인 경우 → true로 변경 또는 재로그인

#### 2. Edge Function 로그 확인
Supabase Dashboard → Edge Functions → send-chat-notification → Logs

- 오류 메시지가 있는지 확인
- "FCM 토큰이 없습니다" 메시지가 있다면 → device_tokens 테이블 확인

#### 3. Firebase Console 확인
- Cloud Messaging API가 활성화되어 있는지
- Service Account가 올바른지
- 앱의 패키지 이름이 Firebase 프로젝트와 일치하는지

#### 4. 앱 권한 확인
```dart
NotificationSettings settings = await FirebaseMessaging.instance.requestPermission();
print('권한 상태: ${settings.authorizationStatus}');
```
- iOS: 알림 권한이 거부되었다면 → 설정 앱에서 수동으로 활성화
- Android: 알림 채널 설정 확인

---

## 추가 기능 (선택사항)

### 1. 읽지 않은 메시지 배지 카운트

```dart
// 읽지 않은 메시지 수를 앱 아이콘 배지에 표시
FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
  alert: true,
  badge: true,
  sound: true,
);
```

### 2. 알림 사운드 커스터마이징

```dart
// android/app/src/main/res/raw/custom_sound.mp3 추가 후
const AndroidNotificationDetails androidPlatformChannelSpecifics =
    AndroidNotificationDetails(
  'chat_channel',
  'Chat Notifications',
  importance: Importance.max,
  priority: Priority.high,
  sound: RawResourceAndroidNotificationSound('custom_sound'),
);
```

### 3. 토큰 만료 처리

```dart
// FCM 토큰이 만료되면 자동 갱신
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
  print('🔄 FCM 토큰 갱신: $newToken');
  await _saveTokenToDatabase(newToken);
});
```

---

## 요약

### ✅ 백엔드 완료 (관리자 패널)
- FCM v1 API Edge Function 배포
- Database Trigger 설정
- device_tokens 테이블 생성

### 📱 앱에서 구현 필요
1. **FCM 토큰 저장** (필수)
   - 로그인 시 `device_tokens` 테이블에 저장
   - 토큰 갱신 리스너 등록

2. **알림 수신 처리** (필수)
   - 포그라운드/백그라운드 알림 핸들러
   - 로컬 알림 표시

3. **알림 탭 처리** (필수)
   - room_id를 파싱하여 채팅방으로 이동
   - Navigator Key 사용

### 🧪 테스트
- `device_tokens` 테이블에 토큰이 저장되는지 확인
- 실제 메시지 전송하여 알림 수신 테스트
- Edge Function 로그로 디버깅

---

## 연락처

문제가 발생하거나 질문이 있으면:
- Edge Function 로그: https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions
- Database 테이블: https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/editor

작업 완료일: 2025-12-01
