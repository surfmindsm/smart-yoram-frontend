# 스마트요람 모바일 앱 - 관리자 기능 PRD
## Product Requirements Document for Mobile Admin Features

**버전**: 1.0.0
**작성일**: 2025-09-30
**대상 플랫폼**: Flutter (iOS/Android)

---

## 1. 제품 개요 (Product Overview)

### 1.1 제품 설명
스마트 요람 모바일 앱의 관리자 기능은 교회 관리자가 **이동 중에도 긴급한 교회 운영 업무를 처리**할 수 있도록 하는 모바일 전용 관리 도구입니다. 웹 대시보드의 모든 기능을 모바일로 옮기는 것이 아니라, **긴급성과 이동성이 높은 핵심 기능**만을 선별하여 제공합니다.

### 1.2 핵심 가치 제안 (Value Proposition)
- **즉시 대응**: 외출 중에도 긴급한 교회 업무 처리
- **선택적 노출**: 일반 교인에게는 보이지 않는 관리자 전용 메뉴
- **모바일 최적화**: 터치 인터페이스에 최적화된 UX
- **알림 중심**: 푸시 알림으로 빠른 상황 인지

### 1.3 타겟 사용자
- **주 사용자**:
  - 교회 관리자 (role: 'admin')
  - 교회 최고 관리자 (role: 'church_super_admin')
- **부 사용자**:
  - 커뮤니티 관리자 (role: 'community_admin')
  - 시스템 관리자 (role: 'system_admin')
  - 슈퍼 관리자 (role: 'super_admin')
- **제외**: 일반 교인 (role: 'member') - 관리자 기능 미표시

### 1.4 설계 원칙
1. **권한 기반 UI**: role에 따라 메뉴/화면 동적 표시
2. **긴급성 우선**: 즉각 대응이 필요한 기능 중심
3. **단순화**: 복잡한 분석/보고서는 웹에서만
4. **오프라인 지원**: 네트워크 불안정 시 대비

---

## 2. 권한 시스템 (Permission System)

### 2.1 사용자 Role (현재 구현)
```dart
enum UserRole {
  member,              // 일반 교인 - 관리자 기능 접근 불가
  admin,               // 교회 관리자 - 교회 내 모든 관리 기능
  church_super_admin,  // 교회 최고 관리자 - 교회 설정 및 권한 관리
  community_admin,     // 커뮤니티 관리자 - 커뮤니티 기능 관리
  system_admin,        // 시스템 관리자 - 전체 시스템 관리
  super_admin,         // 슈퍼 관리자 - 모든 교회 및 시스템 전체 권한
}

// 향후 확장 예정
// pastor,   // 목회자 - 심방/교인 관리
// staff,    // 직원 - 제한된 관리 기능
```

### 2.2 권한 체크 로직
```dart
// User 모델 (현재 구현 기준)
class User {
  final int id;           // 정수형 ID (UUID 아님)
  final String email;
  final String username;
  final String? fullName;
  final String role;      // 'member' | 'admin' | 'church_super_admin' | 'community_admin' | 'system_admin' | 'super_admin'
  final int churchId;     // 정수형 (9998 = 교회 없음)

  // 권한 체크 헬퍼
  bool get isMember => role == 'member';
  bool get isAdmin => role == 'admin';
  bool get isChurchSuperAdmin => role == 'church_super_admin';
  bool get isCommunityAdmin => role == 'community_admin';
  bool get isSystemAdmin => role == 'system_admin';
  bool get isSuperAdmin => role == 'super_admin';

  // 관리자 접근 권한 (모든 관리자 타입)
  bool get hasAdminAccess =>
    isAdmin ||
    isChurchSuperAdmin ||
    isCommunityAdmin ||
    isSystemAdmin ||
    isSuperAdmin;

  // 교회 레벨 관리 권한
  bool get hasChurchManagementAccess =>
    isAdmin ||
    isChurchSuperAdmin ||
    isSuperAdmin;

  // 커뮤니티 관리 권한
  bool get hasCommunityManagementAccess =>
    isCommunityAdmin ||
    isChurchSuperAdmin ||
    isSuperAdmin;

  // 시스템 레벨 권한
  bool get hasSystemAccess =>
    isSystemAdmin ||
    isSuperAdmin;
}
```

### 2.3 권한별 접근 범위

| Role | 교인 관리 | 심방 관리 | 공지사항 | 출석 조회 | 헌금 통계 | 커뮤니티 관리 | 시스템 설정 | 전체 교회 접근 |
|------|-----------|-----------|----------|-----------|-----------|---------------|-------------|----------------|
| member | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| church_super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 제한적 | ❌ |
| community_admin | ❌ | ❌ | 커뮤니티 공지만 | ❌ | ❌ | ✅ | ❌ | ❌ |
| system_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.4 UI 조건부 렌더링
```dart
// 설정 화면 예시
if (currentUser.hasAdminAccess) {
  // 관리자 메뉴 섹션 표시
  _buildAdminMenuSection()
}

// 권한별 세부 메뉴 제어
Widget _buildAdminMenuSection() {
  final menuItems = <Widget>[];

  // 교회 관리 메뉴 (admin, church_super_admin, system_admin, super_admin)
  if (currentUser.hasChurchManagementAccess) {
    menuItems.addAll([
      _buildMenuTile(
        icon: Icons.people,
        title: '교인 관리',
        onTap: () => Navigator.pushNamed(context, '/admin/members'),
      ),
      _buildMenuTile(
        icon: Icons.prayer_times,
        title: '심방 신청 관리',
        onTap: () => Navigator.pushNamed(context, '/admin/pastoral-care'),
      ),
    ]);
  }

  // 커뮤니티 관리 메뉴 (community_admin, church_super_admin, system_admin, super_admin)
  if (currentUser.hasCommunityManagementAccess) {
    menuItems.add(
      _buildMenuTile(
        icon: Icons.forum,
        title: '커뮤니티 관리',
        onTap: () => Navigator.pushNamed(context, '/admin/community'),
      ),
    );
  }

  // 시스템 관리 메뉴 (system_admin, super_admin)
  if (currentUser.hasSystemAccess) {
    menuItems.add(
      _buildMenuTile(
        icon: Icons.settings_applications,
        title: '시스템 설정',
        onTap: () => Navigator.pushNamed(context, '/admin/system'),
      ),
    );
  }

  return Column(children: menuItems);
}
```

---

## 3. 관리자 기능 우선순위

### 3.1 긴급도 분류
| 우선순위 | 기능 | 이유 |
|---------|------|------|
| 🔴 P0 | 교인 관리 | 신규 가입 승인, 긴급 연락처 확인 |
| 🔴 P0 | 심방 신청 관리 | 긴급 심방 요청 대응 |
| 🟡 P1 | 공지사항 관리 | 긴급 공지 발행 |
| 🟡 P1 | 출석 현황 조회 | 주일 예배 중 실시간 확인 |
| 🟢 P2 | 헌금 통계 조회 | 간단한 집계 확인 |
| 🟢 P2 | 교인 검색 | 교인 정보 빠른 조회 |

### 3.2 제외 기능 (웹 전용)
- ❌ 복잡한 통계 차트 및 보고서
- ❌ 헌금 영수증 발급 (인쇄 필요)
- ❌ 대량 데이터 일괄 처리
- ❌ 교회 설정 변경

---

## 4. 기능 명세 (Feature Specifications)

### 4.1 설정 화면 구조 변경

#### 4.1.1 일반 사용자 화면 (role: 'member')
```
설정
├── 내 정보
│   ├── 프로필 수정
│   └── 비밀번호 변경
├── 교회 정보
│   ├── 교회 소개
│   ├── 연락처
│   └── 위치
├── 앱 설정
│   ├── 알림 설정
│   └── 언어 설정
└── 로그아웃
```

#### 4.1.2 관리자 화면 (role: 'admin')
```
설정
├── 내 정보
│   ├── 프로필 수정
│   └── 비밀번호 변경
├── 📱 관리자 메뉴 ⭐ NEW
│   ├── 👥 교인 관리
│   ├── 🙏 심방 신청 관리
│   ├── 📢 공지사항 관리
│   ├── 📊 출석 현황
│   └── 💰 헌금 통계
├── 교회 정보
├── 앱 설정
└── 로그아웃
```

### 4.2 교인 관리 (P0)

#### 4.2.1 교인 목록
**화면**: `AdminMemberManagementScreen`

**기능**:
- 전체 교인 목록 (페이지네이션)
- 검색: 이름, 전화번호, 이메일
- 필터: 상태(활성/비활성), 등록일
- 정렬: 이름순, 최신순

**UI 요소**:
```dart
- AppBar: "교인 관리"
- SearchBar: 검색 입력
- FilterChips: [전체, 활성, 비활성, 승인대기]
- ListView:
  - MemberCard
    - 프로필 사진
    - 이름, 전화번호
    - 상태 뱃지 (active/inactive/pending)
    - Trailing: 상세 버튼
```

#### 4.2.2 교인 상세 및 수정
**화면**: `AdminMemberDetailScreen`

**기능**:
- 기본 정보 조회
- 정보 수정 (이름, 전화번호, 이메일, 주소)
- 상태 변경 (활성화/비활성화)
- 비밀번호 초기화
- 출석 이력 조회
- 심방 이력 조회

**UI 요소**:
```dart
- AppBar: "교인 상세"
  - Actions: [편집 버튼]
- Body:
  - ProfileSection: 프로필 사진, 이름
  - InfoSection:
    - 전화번호 (클릭 시 전화 걸기)
    - 이메일 (클릭 시 이메일 앱)
    - 주소 (클릭 시 지도 앱)
  - StatusSection:
    - 상태 토글 스위치
    - 마지막 로그인
  - ActionButtons:
    - 비밀번호 초기화
    - 교인 삭제 (경고)
  - HistoryTabs:
    - 출석 이력
    - 심방 이력
```

#### 4.2.3 신규 교인 등록
**화면**: `AdminAddMemberScreen`

**기능**:
- 교인 정보 입력
- 초기 비밀번호 설정
- SMS/이메일 초대 발송

**필수 입력**:
- 이름, 전화번호, 이메일

**선택 입력**:
- 생년월일, 성별, 주소, 프로필 사진

### 4.3 심방 신청 관리 (P0)

#### 4.3.1 심방 신청 목록
**화면**: `AdminPastoralCareListScreen`

**기능**:
- 전체 심방 신청 조회 (모든 교인의 신청)
- 상태별 필터: [전체, 대기, 승인, 진행중, 완료, 취소]
- 긴급도별 필터: [긴급, 보통]
- 정렬: 신청일순, 희망일순

**UI 요소**:
```dart
- AppBar: "심방 신청 관리"
- FilterChips: [대기, 승인, 진행중, 완료]
- ListView:
  - PastoralCareCard
    - 신청자 이름
    - 신청 유형 (심방/상담/기도)
    - 희망 날짜
    - 긴급도 뱃지
    - 상태 뱃지
    - Trailing: 상세 버튼
```

#### 4.3.2 심방 신청 상세
**화면**: `AdminPastoralCareDetailScreen`

**기능**:
- 신청 정보 조회
  - 신청자 정보
  - 신청 내용
  - 희망 날짜/시간
  - 주소 및 지도
- 상태 변경
  - 대기 → 승인
  - 승인 → 진행중
  - 진행중 → 완료
  - 언제든지 → 취소
- 담당 목사 지정
- 예정 날짜/시간 설정
- 관리자 메모 작성

### 4.4 공지사항 관리 (P1)

#### 4.4.1 공지사항 목록
**화면**: `AdminNoticeListScreen`

**기능**:
- 전체 공지사항 조회
- 중요 공지 필터
- 작성일순 정렬

#### 4.4.2 공지사항 작성/수정
**화면**: `AdminNoticeEditorScreen`

**기능**:
- 제목, 내용 입력
- 중요 공지 설정
- 이미지 첨부 (최대 5장)
- 푸시 알림 발송 여부

### 4.5 출석 현황 조회 (P1)

#### 4.5.1 실시간 출석 현황
**화면**: `AdminAttendanceScreen`

**기능**:
- 오늘 출석 현황
  - 총 출석 인원
  - 실시간 체크인 목록
- 날짜별 출석 조회
- 출석률 추이 (간단한 라인 차트)

### 4.6 헌금 통계 조회 (P2)

#### 4.6.1 헌금 통계
**화면**: `AdminOfferingStatsScreen`

**기능**:
- 오늘/이번 주/이번 달 헌금 합계
- 헌금 유형별 집계 (간단한 파이 차트)
- 최근 헌금 목록

---

## 5. 기술 구현 (Technical Implementation)

### 5.1 파일 구조
```
lib/
├── models/
│   └── user.dart (isAdmin getter 추가)
├── utils/
│   └── permission_utils.dart (권한 체크 헬퍼)
├── screens/
│   ├── settings_screen.dart (관리자 메뉴 추가)
│   └── admin/
│       ├── admin_member_management_screen.dart
│       ├── admin_member_detail_screen.dart
│       ├── admin_add_member_screen.dart
│       ├── admin_pastoral_care_list_screen.dart
│       ├── admin_pastoral_care_detail_screen.dart
│       ├── admin_notice_list_screen.dart
│       ├── admin_notice_editor_screen.dart
│       ├── admin_attendance_screen.dart
│       └── admin_offering_stats_screen.dart
├── services/
│   ├── admin_member_service.dart
│   ├── admin_pastoral_care_service.dart
│   ├── admin_notice_service.dart
│   └── admin_stats_service.dart
└── components/
    └── admin/
        ├── member_card.dart
        ├── pastoral_care_card.dart
        └── notice_card.dart
```

### 5.2 권한 체크 유틸리티

**파일**: `lib/utils/permission_utils.dart`

```dart
import 'package:smart_yoram_app/services/auth_service.dart';
import 'package:smart_yoram_app/models/user.dart';

class PermissionUtils {
  static final AuthService _authService = AuthService();

  /// 현재 사용자가 관리자 권한을 가지고 있는지 확인
  static Future<bool> hasAdminAccess() async {
    final userResponse = await _authService.getCurrentUser();
    if (!userResponse.success || userResponse.data == null) {
      return false;
    }

    final user = userResponse.data!;
    return user.role == 'admin';
  }

  /// 관리자 전용 화면 접근 시 권한 체크
  static Future<bool> checkAdminAccessWithDialog(BuildContext context) async {
    final hasAccess = await hasAdminAccess();

    if (!hasAccess) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('접근 권한 없음'),
          content: Text('관리자만 접근 가능한 기능입니다.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('확인'),
            ),
          ],
        ),
      );
    }

    return hasAccess;
  }
}
```

### 5.3 User 모델 확장

**파일**: `lib/models/user.dart` (기존 파일 수정)

```dart
class User {
  final int id;              // 정수형 ID
  final String email;
  final String username;
  final String? fullName;
  final String role;         // 'member' | 'admin' | 'church_super_admin' | 'community_admin' | 'system_admin' | 'super_admin'
  final int churchId;        // 정수형, 9998 = 교회 없음
  final bool isActive;
  final String? phone;
  final String? address;
  final String? profilePhotoUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // 권한 체크 헬퍼
  bool get isMember => role == 'member';
  bool get isAdmin => role == 'admin';
  bool get isChurchSuperAdmin => role == 'church_super_admin';
  bool get isCommunityAdmin => role == 'community_admin';
  bool get isSystemAdmin => role == 'system_admin';
  bool get isSuperAdmin => role == 'super_admin';

  // 관리자 접근 권한 (모든 관리자 타입)
  bool get hasAdminAccess =>
    isAdmin ||
    isChurchSuperAdmin ||
    isCommunityAdmin ||
    isSystemAdmin ||
    isSuperAdmin;

  // 교회 레벨 관리 권한
  bool get hasChurchManagementAccess =>
    isAdmin ||
    isChurchSuperAdmin ||
    isSuperAdmin;

  // 커뮤니티 관리 권한
  bool get hasCommunityManagementAccess =>
    isCommunityAdmin ||
    isChurchSuperAdmin ||
    isSuperAdmin;

  // 시스템 레벨 권한
  bool get hasSystemAccess =>
    isSystemAdmin ||
    isSuperAdmin;

  // 교회 소속 여부
  bool get hasChurch => churchId != 9998;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.fullName,
    required this.role,
    required this.churchId,
    this.isActive = true,
    this.phone,
    this.address,
    this.profilePhotoUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      username: json['username'],
      fullName: json['full_name'],
      role: json['role'] ?? 'member',
      churchId: json['church_id'] ?? 9998,
      isActive: json['is_active'] ?? true,
      phone: json['phone'],
      address: json['address'],
      profilePhotoUrl: json['profile_photo_url'],
      createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : null,
      updatedAt: json['updated_at'] != null
        ? DateTime.parse(json['updated_at'])
        : null,
    );
  }
}
```

---

## 6. 데이터 모델 (Data Models)

### 6.1 교인 관리용 모델
```dart
class Member {
  final int id;
  final String name;
  final String? email;
  final String? phone;
  final String? address;
  final String? birthDate;
  final String? gender;  // 'M' | 'F'
  final int churchId;
  final int? userId;     // users 테이블 참조
  final String? district;
  final String? position;
  final String? baptismDate;
  final String? profilePhotoUrl;
  final bool isActive;
  final DateTime createdAt;

  Member({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.address,
    this.birthDate,
    this.gender,
    required this.churchId,
    this.userId,
    this.district,
    this.position,
    this.baptismDate,
    this.profilePhotoUrl,
    this.isActive = true,
    required this.createdAt,
  });
}
```

### 6.2 심방 신청 모델
```dart
class PastoralCareRequest {
  final int id;
  final int memberId;
  final String memberName;
  final String type;        // '심방' | '상담' | '기도'
  final String content;
  final String? preferredDate;
  final String? preferredTime;
  final String status;      // 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  final bool isUrgent;
  final String? address;
  final String? contactPhone;
  final int? assignedPastorId;
  final String? adminNote;
  final int churchId;
  final DateTime createdAt;
  final DateTime? updatedAt;
}
```

---

## 7. API 명세 (API Specification)

### 7.1 인증 헤더 구조 (실제 구현 기준)
```http
Content-Type: application/json
Authorization: Bearer {REACT_APP_SUPABASE_ANON_KEY}
X-Custom-Auth: temp_token_{user_id}_{timestamp}
```

### 7.2 교인 관리 API

```dart
// GET /functions/v1/members
// 전체 교인 조회
AdminMemberService.getAllMembers({
  page: 1,
  limit: 50,
  search?: string,
  status?: 'active' | 'inactive',
  church_id: int,
})

// POST /functions/v1/members
// 교인 생성
AdminMemberService.createMember({
  name: string,
  email?: string,
  phone: string,
  church_id: int,
  // ... 기타 필드
})

// PUT /functions/v1/members
// 교인 정보 수정
AdminMemberService.updateMember({
  action: 'update',
  id: int,
  member: {
    // 수정할 필드들
  }
})

// DELETE /functions/v1/members
// 교인 삭제
AdminMemberService.deleteMember({
  action: 'delete',
  id: int,
})
```

### 7.3 심방 신청 관리 API

```dart
// GET /functions/v1/pastoral-care
// 전체 심방 신청 조회 (관리자용)
AdminPastoralCareService.getAllRequests({
  church_id: int,
  status?: string,
  is_urgent?: bool,
  page: 1,
  limit: 50,
})

// PUT /functions/v1/pastoral-care
// 상태 변경
AdminPastoralCareService.updateStatus({
  action: 'update_status',
  id: int,
  status: string,
})

// PUT /functions/v1/pastoral-care
// 담당자 지정
AdminPastoralCareService.assignPastor({
  action: 'assign',
  id: int,
  pastor_id: int,
  scheduled_date?: string,
})
```

### 7.4 공지사항 관리 API

```dart
// GET /functions/v1/announcements
// 공지사항 목록
AdminNoticeService.getAllNotices({
  church_id: int,
  is_important?: bool,
})

// POST /functions/v1/announcements
// 공지사항 작성
AdminNoticeService.createNotice({
  action: 'create',
  announcement: {
    title: string,
    content: string,
    is_important: bool,
    church_id: int,
    send_push?: bool,
  }
})
```

### 7.5 통계 API

```dart
// GET /functions/v1/statistics
// 출석 통계
AdminStatsService.getAttendanceStats({
  church_id: int,
  type: 'attendance',
  period: 'day' | 'week' | 'month',
  date?: string,
})

// GET /functions/v1/statistics
// 헌금 통계
AdminStatsService.getOfferingStats({
  church_id: int,
  type: 'offering',
  period: 'day' | 'week' | 'month',
  start_date?: string,
  end_date?: string,
})
```

---

## 8. Supabase Storage 구조

### 8.1 버킷 구조
```
supabase.storage
├── member-photos/           # 교인 프로필 사진
│   └── {member_id}/
│       └── {timestamp}.{ext}
├── community-images/        # 커뮤니티 게시물 이미지
│   └── {year}/{month}/
│       └── {uuid}.{ext}
└── announcements/          # 공지사항 첨부 이미지
    └── {year}/{month}/
        └── {uuid}.{ext}
```

### 8.2 업로드 예시
```dart
// 프로필 사진 업로드
final fileName = 'member-photos/${memberId}/${DateTime.now().millisecondsSinceEpoch}.jpg';
final { data, error } = await supabase.storage
  .from('member-photos')
  .upload(fileName, file);

// Public URL 가져오기
final publicUrl = supabase.storage
  .from('member-photos')
  .getPublicUrl(fileName);
```

---

## 9. 개발 마일스톤 (Development Milestones)

### Phase 1: 권한 시스템 구축 (1일)
- [ ] User 모델에 권한 체크 헬퍼 추가
- [ ] PermissionUtils 유틸리티 작성
- [ ] 설정 화면에 관리자 메뉴 섹션 추가
- [ ] 권한 기반 라우팅 가드 구현

### Phase 2: 교인 관리 (3일)
- [ ] AdminMemberManagementScreen 구현
- [ ] AdminMemberDetailScreen 구현
- [ ] AdminAddMemberScreen 구현
- [ ] AdminMemberService 구현
- [ ] 교인 검색/필터 기능
- [ ] 상태 변경 및 비밀번호 초기화

### Phase 3: 심방 신청 관리 (2일)
- [ ] AdminPastoralCareListScreen 구현
- [ ] AdminPastoralCareDetailScreen 구현
- [ ] AdminPastoralCareService 구현
- [ ] 상태 변경 워크플로우
- [ ] 담당자 지정 기능

### Phase 4: 공지사항 관리 (2일)
- [ ] AdminNoticeListScreen 구현
- [ ] AdminNoticeEditorScreen 구현
- [ ] AdminNoticeService 구현
- [ ] 이미지 업로드 (Supabase Storage)
- [ ] 푸시 알림 연동

### Phase 5: 통계 기능 (1일)
- [ ] AdminAttendanceScreen 구현
- [ ] AdminOfferingStatsScreen 구현
- [ ] 간단한 차트 위젯 (fl_chart 패키지)
- [ ] AdminStatsService 구현

### Phase 6: 테스트 및 최적화 (2일)
- [ ] 단위 테스트 작성
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 에러 핸들링 강화

---

## 10. 성공 지표 (Success Metrics)

### 10.1 기능 지표
- **관리자 활성 사용자**: 등록된 관리자의 80% 이상 주 1회 이상 사용
- **평균 응답 시간**: 심방 신청 승인까지 평균 2시간 이내
- **모바일 처리율**: 전체 관리 작업의 30% 이상 모바일에서 처리

### 10.2 기술 지표
- **API 응답 시간**: p95 < 1초
- **앱 크기**: < 50MB
- **크래시 없는 사용자**: > 99%
- **오프라인 지원**: 기본 조회 기능 100% 지원

### 10.3 사용성 지표
- **첫 사용 성공률**: 튜토리얼 없이 90% 이상 기능 사용 성공
- **에러율**: 관리자 기능 에러 < 0.5%
- **만족도**: 관리자 만족도 4.5/5.0 이상

---

## 11. 리스크 및 대응 (Risks & Mitigation)

### 11.1 보안 리스크
| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|-----------|
| 권한 우회 접근 | 높음 | 낮음 | Edge Function 레벨 검증, temp_token 검증 |
| 민감 정보 노출 | 높음 | 중간 | 로깅 제한, 화면 캡처 방지 |
| 세션 탈취 | 중간 | 낮음 | 짧은 토큰 만료 시간, 재인증 |

### 11.2 기술적 리스크
| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|-----------|
| Edge Function 장애 | 높음 | 낮음 | 에러 핸들링, 재시도 로직 |
| Storage 용량 초과 | 중간 | 중간 | 이미지 압축, 정기 정리 |
| 네트워크 불안정 | 중간 | 높음 | 오프라인 모드, 로컬 캐싱 |

### 11.3 UX 리스크
| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|-----------|
| 복잡한 UI | 중간 | 높음 | 사용자 테스트, 단순화 |
| 일반 사용자 혼란 | 낮음 | 중간 | 명확한 권한 기반 UI |
| 모바일 제약 | 중간 | 높음 | 핵심 기능만 선별, 웹 연동 안내 |

---

## 12. 의존성 패키지 (Dependencies)

```yaml
dependencies:
  # 기존 패키지들...

  # 관리자 기능용 추가 패키지
  fl_chart: ^0.68.0           # 차트 라이브러리
  permission_handler: ^11.0.0  # 권한 관리
  url_launcher: ^6.2.0        # 전화, 이메일 연동
  image_picker: ^1.0.0        # 프로필 사진
  cached_network_image: ^3.3.0 # 이미지 캐싱
```

---

## 13. 참고 자료 (References)

- [Flutter 공식 문서](https://flutter.dev/docs)
- [Supabase Flutter SDK](https://supabase.com/docs/reference/dart/introduction)
- [Material Design 3](https://m3.material.io)
- [Flutter 권한 관리 패턴](https://flutter.dev/docs/development/data-and-backend/state-mgmt/intro)

---

## 14. 부록: 실제 데이터베이스 스키마

### 14.1 users 테이블 (커스텀)
```sql
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(100),
  hashed_password VARCHAR(255),
  church_id INTEGER DEFAULT 9998,  -- 9998 = 교회 없음
  role VARCHAR(50) DEFAULT 'member',  -- 'member' | 'admin' | 'church_super_admin' | 'community_admin' | 'system_admin' | 'super_admin'
  is_active BOOLEAN DEFAULT true,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Role 설명
-- member: 일반 교인
-- admin: 교회 관리자 (특정 교회의 일반 관리 권한)
-- church_super_admin: 교회 최고 관리자 (특정 교회의 모든 권한)
-- community_admin: 커뮤니티 관리자 (커뮤니티 기능만 관리)
-- system_admin: 시스템 관리자 (시스템 전체 관리)
-- super_admin: 슈퍼 관리자 (모든 권한)
```

### 14.2 members 테이블
```sql
CREATE TABLE public.members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  birth_date DATE,
  gender CHAR(1),  -- 'M' | 'F'
  church_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  district VARCHAR(100),
  position VARCHAR(50),
  baptism_date DATE,
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 14.3 churches 테이블
```sql
CREATE TABLE public.churches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  pastor_name VARCHAR(100),
  business_no VARCHAR(20),  -- 사업자등록번호
  subscription_status VARCHAR(50),
  member_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 14.4 attendances 테이블
```sql
CREATE TABLE public.attendances (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  service_date DATE NOT NULL,
  service_type VARCHAR(50),  -- '주일예배' | '수요예배' | '새벽예배'
  check_in_time TIME,
  status VARCHAR(20) DEFAULT 'present',  -- 'present' | 'absent' | 'late'
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 14.5 offerings 테이블
```sql
CREATE TABLE public.offerings (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id),
  amount DECIMAL(10, 0) NOT NULL,
  fund_type VARCHAR(50) NOT NULL,  -- '십일조' | '감사헌금' | '선교헌금' 등
  offered_on DATE NOT NULL,
  note TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  church_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**문서 승인**

| 역할 | 이름 | 날짜 |
|------|------|------|
| Product Owner | | 2025-09-30 |
| Tech Lead | | 2025-09-30 |
| Mobile Developer | | 2025-09-30 |

---

**변경 이력**

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0.0 | 2025-09-30 | 초기 작성 | Smart Yoram Team |