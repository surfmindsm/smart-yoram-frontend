# 관리자 메시지 푸시 알림 구현 가이드

## 개요
관리자 대시보드에서 특정 교인들에게 맞춤형 메시지를 발송하는 기능이 추가되었습니다.
모바일 앱에서는 이 알림을 수신하여 알림 센터에 표시하고, 사용자가 탭하면 적절한 화면으로 이동해야 합니다.

---

## 1. FCM 페이로드 구조

### 전체 페이로드 예시
```json
{
  "message": {
    "token": "device_fcm_token_here",
    "notification": {
      "title": "메시지 제목",
      "body": "메시지 내용"
    },
    "data": {
      "type": "custom_message",
      "notification_type": "custom",
      "church_id": "7",
      "click_action": "FLUTTER_NOTIFICATION_CLICK"
    },
    "android": {
      "priority": "high",
      "notification": {
        "channel_id": "announcements",
        "sound": "default",
        "click_action": "FLUTTER_NOTIFICATION_CLICK"
      }
    },
    "apns": {
      "headers": {
        "apns-priority": "10"
      },
      "payload": {
        "aps": {
          "sound": "default",
          "badge": 1
        }
      }
    }
  }
}
```

---

## 2. 데이터 필드 설명

### notification 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `title` | String | 알림 제목 (관리자가 입력) |
| `body` | String | 알림 내용 (관리자가 입력) |

### data 필드
| 필드 | 타입 | 설명 | 예시 값 |
|------|------|------|---------|
| `type` | String | 알림 유형 구분자 | `"custom_message"` |
| `notification_type` | String | 알림 카테고리 | `"custom"` |
| `church_id` | String | 교회 ID | `"7"` |
| `click_action` | String | 클릭 액션 | `"FLUTTER_NOTIFICATION_CLICK"` |

---

## 3. Flutter 앱 구현 가이드

### 3.1 알림 수신 처리

```dart
// Firebase Messaging 초기화 및 리스너 설정
void initializeFirebaseMessaging() {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    // 앱이 포그라운드 상태일 때
    _handleCustomMessage(message);
  });

  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    // 백그라운드에서 알림을 탭했을 때
    _handleNotificationTap(message);
  });

  // 앱이 종료된 상태에서 알림을 탭하고 앱이 실행된 경우
  FirebaseMessaging.instance.getInitialMessage().then((message) {
    if (message != null) {
      _handleNotificationTap(message);
    }
  });
}

void _handleCustomMessage(RemoteMessage message) {
  // 알림 타입 확인
  final notificationType = message.data['notification_type'];

  if (notificationType == 'custom') {
    // 커스텀 메시지인 경우
    final title = message.notification?.title ?? '알림';
    final body = message.notification?.body ?? '';
    final churchId = message.data['church_id'];

    // 로컬 알림 표시 (앱이 포그라운드일 때)
    _showLocalNotification(
      title: title,
      body: body,
      payload: jsonEncode(message.data),
    );
  }
}

void _handleNotificationTap(RemoteMessage message) {
  final notificationType = message.data['notification_type'];

  if (notificationType == 'custom') {
    // 관리자 메시지 화면으로 이동
    // 또는 메시지 상세 다이얼로그 표시
    Navigator.pushNamed(
      context,
      '/messages',
      arguments: {
        'title': message.notification?.title,
        'body': message.notification?.body,
        'churchId': message.data['church_id'],
      },
    );
  }
}
```

### 3.2 Android 알림 채널 설정

```dart
// Android 알림 채널 생성 (앱 초기화 시 한 번 실행)
Future<void> createNotificationChannel() async {
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'announcements', // channel_id (FCM 페이로드와 동일)
    '공지사항 및 메시지', // 채널 이름
    description: '관리자가 보내는 공지사항 및 맞춤 메시지',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);
}
```

### 3.3 포그라운드 알림 표시

```dart
Future<void> _showLocalNotification({
  required String title,
  required String body,
  String? payload,
}) async {
  const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    'announcements',
    '공지사항 및 메시지',
    channelDescription: '관리자가 보내는 공지사항 및 맞춤 메시지',
    importance: Importance.high,
    priority: Priority.high,
    playSound: true,
    enableVibration: true,
  );

  const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
  );

  const NotificationDetails platformDetails = NotificationDetails(
    android: androidDetails,
    iOS: iosDetails,
  );

  await flutterLocalNotificationsPlugin.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000, // 고유 ID
    title,
    body,
    platformDetails,
    payload: payload,
  );
}
```

---

## 4. iOS 설정

### 4.1 권한 요청
```dart
Future<void> requestNotificationPermissions() async {
  final settings = await FirebaseMessaging.instance.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    print('사용자가 알림 권한을 허용했습니다');
  }
}
```

### 4.2 Info.plist 설정
```xml
<!-- Firebase Cloud Messaging 관련 권한 -->
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

---

## 5. 알림 클릭 처리 플로우

### 5.1 권장 사용자 경험

1. **알림 수신 시**
   - 앱이 포그라운드: 인앱 배너 또는 다이얼로그로 표시
   - 앱이 백그라운드/종료: 시스템 알림 센터에 표시

2. **알림 탭 시**
   - 옵션 A: 메시지 목록 화면으로 이동 (권장)
   - 옵션 B: 메시지 상세 다이얼로그 표시
   - 옵션 C: 홈 화면으로 이동 후 배너로 표시

### 5.2 구현 예시 (옵션 A)
```dart
void _handleNotificationTap(RemoteMessage message) {
  if (message.data['notification_type'] == 'custom') {
    // 메시지 목록 화면으로 이동
    Navigator.of(context).pushNamedAndRemoveUntil(
      '/home',
      (route) => false,
      arguments: {'initialTab': 'messages'},
    );
  }
}
```

---

## 6. 테스트 방법

### 6.1 테스트 시나리오

#### 시나리오 1: 포그라운드 알림
1. 앱을 실행하여 포그라운드 상태로 유지
2. 관리자 대시보드에서 메시지 발송
3. **기대 결과**:
   - 앱 내에서 알림 배너 표시
   - 알림 센터에도 기록됨

#### 시나리오 2: 백그라운드 알림
1. 앱을 백그라운드로 전환 (홈 버튼)
2. 관리자 대시보드에서 메시지 발송
3. **기대 결과**:
   - 시스템 알림 표시
   - 알림 탭 시 앱이 포그라운드로 전환되며 메시지 화면 표시

#### 시나리오 3: 앱 종료 상태
1. 앱을 완전히 종료
2. 관리자 대시보드에서 메시지 발송
3. 알림 탭
4. **기대 결과**:
   - 앱이 실행되며 메시지 화면으로 바로 이동

### 6.2 디버깅 로그
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('📱 [FCM] Foreground message received:');
  print('  - Title: ${message.notification?.title}');
  print('  - Body: ${message.notification?.body}');
  print('  - Data: ${message.data}');
  print('  - Type: ${message.data['notification_type']}');

  _handleCustomMessage(message);
});
```

---

## 7. 필수 패키지

### pubspec.yaml
```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.2.0
```

---

## 8. 백엔드 발송 내역 조회 (선택사항)

앱에서 발송 내역을 조회하고 싶다면 다음 API를 사용할 수 있습니다:

### API 엔드포인트
```
GET /message_send_history?church_id=eq.{church_id}
```

### 응답 예시
```json
[
  {
    "id": "uuid-here",
    "church_id": 7,
    "sender_id": 56,
    "sender_name": "김목사",
    "title": "주일 예배 안내",
    "content": "이번 주 주일 예배는...",
    "recipient_count": 150,
    "app_user_count": 120,
    "devices_sent": 200,
    "sent_at": "2025-12-12T14:30:00Z"
  }
]
```

---

## 9. 주의사항

### 9.1 알림 채널 ID
- Android의 경우 **`announcements`** 채널 ID를 반드시 생성해야 합니다
- 다른 알림(공지사항 등)과 동일한 채널을 사용하여 일관된 사용자 경험 제공

### 9.2 백그라운드 핸들러
- Flutter에서 백그라운드 메시지 처리를 위해 `@pragma('vm:entry-point')` 필요
```dart
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('백그라운드 메시지 처리: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(MyApp());
}
```

### 9.3 iOS 배지 관리
- 알림을 읽었을 때 배지 카운트 초기화 필요
```dart
await FirebaseMessaging.instance.setApplicationIconBadgeNumber(0);
```

### 9.4 데이터 타입
- `church_id`는 문자열로 전달됨 (숫자 변환 필요 시 `int.parse()` 사용)

---

## 10. 문의사항

구현 중 문제가 발생하거나 추가 정보가 필요한 경우:
- 백엔드 Edge Function: `/supabase/functions/send-custom-notification/index.ts`
- 관리자 대시보드 UI: `/src/components/MessageSending.tsx`

---

## 11. 체크리스트

- [ ] Firebase Messaging 패키지 설치
- [ ] Android 알림 채널 `announcements` 생성
- [ ] iOS 알림 권한 요청 구현
- [ ] 포그라운드 알림 핸들러 구현
- [ ] 백그라운드 알림 핸들러 구현
- [ ] 알림 탭 시 화면 이동 로직 구현
- [ ] 3가지 시나리오 테스트 완료
- [ ] 배지 카운트 관리 구현
- [ ] 로컬 알림 표시 구현 (포그라운드)
- [ ] 디버깅 로그 추가

---

## 12. 참고 자료

- [Firebase Cloud Messaging - Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/client)
- [Flutter Local Notifications](https://pub.dev/packages/flutter_local_notifications)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
