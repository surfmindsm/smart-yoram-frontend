# 📱 모바일 개발자용: Position 필드 매핑 가이드

## 🎯 개요

교인 직분(position) 필드의 매핑 불일치 문제를 해결하기 위해 백엔드 정책을 수립했습니다.
이 문서는 모바일 앱에서 position 필드를 올바르게 처리하는 방법을 설명합니다.

**핵심 변경사항:**
- DB에는 영문 코드로 저장 (예: `PASTOR`, `ELDER`, `DEACON`)
- 화면에는 한글 레이블로 표시 (예: `목사`, `장로`, `집사`)
- 주소록 필터링은 `position_category` 사용

---

## 📊 1. DB 저장 값 (영문 코드)

### 1.1 직분 코드 목록

| 영문 코드 (DB 저장) | 한글 레이블 (화면 표시) | 주소록 카테고리 |
|-------------------|-------------------|--------------|
| **교역자 계열** |
| `PASTOR` | 목사 | `CLERGY` (교역자) |
| `EVANGELIST` | 전도사 | `CLERGY` (교역자) |
| `EDUCATION_EVANGELIST` | 교육전도사 | `CLERGY` (교역자) |
| `CLERGY` | 교역자 (일반) | `CLERGY` (교역자) |
| **장로 계열** |
| `ELDER` | 장로 | `ELDER` (장로) |
| `RETIRED_ELDER` | 은퇴장로 | `ELDER` (장로) |
| **권사 계열** |
| `DEACONESS` | 권사 | `DEACONESS` (권사) |
| `RETIRED_DEACONESS` | 은퇴권사 | `DEACONESS` (권사) |
| **집사 계열** |
| `DEACON` | 집사 | `DEACON` (집사) |
| `ORDAINED_DEACON` | 안수집사 | `DEACON` (집사) |
| **기타** |
| `TEACHER` | 교사 | `MEMBER` (성도) * |
| `MEMBER` | 성도 (기본값) | `MEMBER` / `YOUTH` / `CHILDREN` ** |

\* 교사는 연령대에 따라 `YOUTH` 또는 `CHILDREN`으로 분류될 수 있음
\*\* 성도는 연령대에 따라 자동 분류: 0-19세=`CHILDREN`, 20-35세=`YOUTH`, 그 외=`MEMBER`

### 1.2 기본값

```sql
position varchar DEFAULT 'MEMBER'
```

---

## 🏷️ 2. 주소록 카테고리 (position_category)

### 2.1 카테고리 목록

주소록 탭에 표시되는 필터 카테고리:

| 카테고리 코드 | 한글 레이블 | 설명 |
|------------|---------|-----|
| `CLERGY` | 교역자 | 목사, 전도사, 교육전도사 등 |
| `ELDER` | 장로 | 장로, 은퇴장로 |
| `DEACONESS` | 권사 | 권사, 은퇴권사 |
| `DEACON` | 집사 | 집사, 안수집사 |
| `YOUTH` | 청년 | 20-35세 연령대 (직분 없거나 MEMBER) |
| `CHILDREN` | 교회학교 | 0-19세 연령대 (직분 없거나 MEMBER) |
| `MEMBER` | 성도 | 그 외 모든 교인 |

### 2.2 주소록 탭 표시 순서

```
전체 | 교역자 | 장로 | 권사 | 집사 | 청년 | 교회학교 | 성도
```

---

## 🔄 3. 매핑 로직

### 3.1 Position → Category 변환 규칙

```dart
// 예시 Dart 코드
String getPositionCategory(String? position, DateTime? birthDate) {
  // 1. 직분 우선 확인
  switch (position) {
    case 'PASTOR':
    case 'EVANGELIST':
    case 'EDUCATION_EVANGELIST':
    case 'CLERGY':
      return 'CLERGY';

    case 'ELDER':
    case 'RETIRED_ELDER':
      return 'ELDER';

    case 'DEACONESS':
    case 'RETIRED_DEACONESS':
      return 'DEACONESS';

    case 'DEACON':
    case 'ORDAINED_DEACON':
      return 'DEACON';
  }

  // 2. 직분이 없거나 MEMBER/TEACHER인 경우 연령대로 분류
  if (birthDate != null) {
    final age = DateTime.now().year - birthDate.year;
    if (age <= 19) return 'CHILDREN';
    if (age >= 20 && age <= 35) return 'YOUTH';
  }

  // 3. 기본값
  return 'MEMBER';
}
```

### 3.2 백엔드 Helper Function

백엔드에 `get_position_category(position, birth_date)` 함수가 제공됩니다.
API 응답에 `position_category` 필드가 자동으로 포함됩니다.

---

## 📱 4. 모바일 앱 수정 가이드

### 4.1 상수 정의 (Dart)

`lib/constants/member_positions.dart` 파일 생성:

```dart
class MemberPosition {
  // 직분 코드 → 한글 레이블
  static const Map<String, String> positionLabels = {
    'PASTOR': '목사',
    'EVANGELIST': '전도사',
    'EDUCATION_EVANGELIST': '교육전도사',
    'CLERGY': '교역자',
    'ELDER': '장로',
    'RETIRED_ELDER': '은퇴장로',
    'DEACONESS': '권사',
    'RETIRED_DEACONESS': '은퇴권사',
    'DEACON': '집사',
    'ORDAINED_DEACON': '안수집사',
    'TEACHER': '교사',
    'MEMBER': '성도',
  };

  // 카테고리 코드 → 한글 레이블
  static const Map<String, String> categoryLabels = {
    'CLERGY': '교역자',
    'ELDER': '장로',
    'DEACONESS': '권사',
    'DEACON': '집사',
    'YOUTH': '청년',
    'CHILDREN': '교회학교',
    'MEMBER': '성도',
  };

  // 주소록 탭 목록 (순서 중요)
  static const List<String> addressBookTabs = [
    '전체',
    '교역자',
    '장로',
    '권사',
    '집사',
    '청년',
    '교회학교',
    '성도',
  ];

  // 일반 사용자용 드롭다운 옵션 (기본 직분만)
  static const List<Map<String, String>> userOptions = [
    {'value': 'MEMBER', 'label': '성도'},
    {'value': 'PASTOR', 'label': '목사'},
    {'value': 'EVANGELIST', 'label': '전도사'},
    {'value': 'ELDER', 'label': '장로'},
    {'value': 'DEACONESS', 'label': '권사'},
    {'value': 'DEACON', 'label': '집사'},
  ];

  // 관리자/상세화면 드롭다운 옵션 (모든 직분 포함)
  static const List<Map<String, String>> detailOptions = [
    {'value': 'MEMBER', 'label': '성도'},
    {'value': 'PASTOR', 'label': '목사'},
    {'value': 'EVANGELIST', 'label': '전도사'},
    {'value': 'EDUCATION_EVANGELIST', 'label': '교육전도사'},
    {'value': 'ELDER', 'label': '장로'},
    {'value': 'RETIRED_ELDER', 'label': '은퇴장로'},
    {'value': 'DEACONESS', 'label': '권사'},
    {'value': 'RETIRED_DEACONESS', 'label': '은퇴권사'},
    {'value': 'DEACON', 'label': '집사'},
    {'value': 'ORDAINED_DEACON', 'label': '안수집사'},
    {'value': 'TEACHER', 'label': '교사'},
  ];

  // 한글 레이블 반환
  static String getLabel(String? code) {
    if (code == null || code.isEmpty) return '성도';
    return positionLabels[code] ?? code;
  }

  // 카테고리 레이블 반환
  static String getCategoryLabel(String? category) {
    if (category == null || category.isEmpty) return '성도';
    return categoryLabels[category] ?? category;
  }
}
```

### 4.2 수정이 필요한 파일

#### ✅ `members_screen.dart` (주소록 탭)

**Before:**
```dart
final List<String> tabs = ['전체', '목사', '장로', '집사', '권사', '전도사', '교사'];
```

**After:**
```dart
import 'package:your_app/constants/member_positions.dart';

final List<String> tabs = ['전체', ...MemberPosition.addressBookTabs.skip(1)];
// 또는
final List<String> tabs = MemberPosition.addressBookTabs;
```

**필터링 로직 수정:**

**Before:**
```dart
// 한글 직분으로 직접 비교
members.where((m) => m.position == '목사')
```

**After:**
```dart
// position_category 사용
members.where((m) => m.positionCategory == 'CLERGY')
```

#### ✅ `member_detail_screen.dart` (상세화면 드롭다운)

**Before:**
```dart
final List<String> _positionOptions = ['교역자', '장로', '권사', '집사', '성도'];
```

**After:**
```dart
import 'package:your_app/constants/member_positions.dart';

// 일반 사용자용: 기본 직분만 표시
final positionOptions = MemberPosition.userOptions;

// 관리자용: 모든 직분 옵션 표시
final adminPositionOptions = MemberPosition.detailOptions;

// DropdownButton 사용 예시 (일반 사용자용)
DropdownButton<String>(
  value: member.position ?? 'MEMBER',
  items: userOptions.map((option) {
    return DropdownMenuItem<String>(
      value: option['value'],
      child: Text(option['label']!),
    );
  }).toList(),
  onChanged: (newValue) {
    // DB에는 영문 코드 저장
    updateMemberPosition(newValue);
  },
)

// 기존 특수 직분 보존 처리 (안수집사, 은퇴장로 등)
List<Map<String, String>> availableOptions = List.from(MemberPosition.userOptions);
if (!userOptions.any((opt) => opt['value'] == currentPosition)) {
  // 현재 직분이 userOptions에 없으면 detailOptions에서 찾아서 추가
  final currentOpt = detailOptions.firstWhere(
    (opt) => opt['value'] == currentPosition,
    orElse: () => {'value': 'MEMBER', 'label': '성도'},
  );
  availableOptions.insert(1, currentOpt);
}
```

#### ✅ `member.dart` (모델 정의)

**Before:**
```dart
class MemberPositionOptions {
  static const List<String> positions = [
    '목사', '장로', '집사', '권사', '전도사', '교사', '부장', '회장',
  ];
}
```

**After:**
```dart
// MemberPositionOptions 클래스 제거
// 대신 member_positions.dart 사용

class Member {
  final int id;
  final String name;
  final String? position;        // DB 저장값: 'PASTOR', 'ELDER' 등
  final String? positionCategory; // 주소록 카테고리: 'CLERGY', 'ELDER' 등
  final DateTime? birthDate;

  // 화면 표시용 헬퍼
  String get positionLabel => MemberPosition.getLabel(position);
  String get categoryLabel => MemberPosition.getCategoryLabel(positionCategory);
}
```

---

## 🔧 5. API 수정 사항

### 5.1 응답 포맷

**GET /api/v1/members**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "김목사",
      "position": "PASTOR",              // ← 영문 코드
      "position_category": "CLERGY",     // ← 주소록 카테고리
      "position_label": "목사",           // ← 한글 레이블
      "birth_date": "1980-01-01"
    },
    {
      "id": 124,
      "name": "이청년",
      "position": "MEMBER",
      "position_category": "YOUTH",      // ← 연령대 기반 자동 분류
      "position_label": "성도",
      "birth_date": "2000-05-15"
    }
  ]
}
```

### 5.2 등록/수정 요청

**POST/PUT /api/v1/members**

```json
{
  "name": "김전도사",
  "position": "EVANGELIST",  // ← 영문 코드로 전송
  "birth_date": "1985-03-20"
}
```

---

## 🚨 6. 마이그레이션 작업

### 6.1 기존 한글 데이터 변환

백엔드 마이그레이션이 다음과 같이 자동 변환합니다:

| 기존 (한글) | 변환 후 (영문) |
|----------|------------|
| '목사' | `PASTOR` |
| '전도사' | `EVANGELIST` |
| '장로' | `ELDER` |
| '권사' | `DEACONESS` |
| '집사' | `DEACON` |
| '교사' | `TEACHER` |
| '성도' | `MEMBER` |
| 'member' (DB 기본값) | `MEMBER` |
| '교역자' | `CLERGY` |

**실행 시점:** 2025-11-09 이후

### 6.2 모바일 앱 호환성

1. **마이그레이션 전**
   - API는 한글 position 반환
   - 앱은 한글로 처리

2. **마이그레이션 후**
   - API는 영문 코드 + 한글 레이블 모두 반환
   - 앱은 영문 코드 사용 (하위 호환성 유지)

---

## 📝 7. 체크리스트

### 7.1 필수 수정 사항

- [ ] `lib/constants/member_positions.dart` 파일 생성
- [ ] `members_screen.dart` 탭 목록 수정
- [ ] `members_screen.dart` 필터링 로직 수정 (position → position_category)
- [ ] `member_detail_screen.dart` 드롭다운 옵션 수정
- [ ] `member.dart` 모델 수정 (position_category 필드 추가)
- [ ] API 파싱 로직 업데이트 (position_category 필드 처리)

### 7.2 테스트 시나리오

#### ✅ 시나리오 1: 전도사 직분 교인 편집
```
1. 주소록 → "교역자" 탭 클릭
2. "김전도사" 선택 (position = 'EVANGELIST')
3. 편집 버튼 클릭
4. 드롭다운에 "전도사" 옵션 있음 ✅
5. "목사"로 변경 후 저장
6. DB에 position = 'PASTOR' 저장됨
7. 주소록 "교역자" 탭에 계속 표시됨 ✅
```

#### ✅ 시나리오 2: 청년부 성도 필터링
```
1. 주소록 → "청년" 탭 클릭
2. position = 'MEMBER'이고 birth_date가 1990-2005년생인 교인들 표시됨
3. position_category = 'YOUTH'로 필터링 ✅
```

#### ✅ 시나리오 3: 새 교인 등록
```
1. 교인 추가 화면
2. 직분 드롭다운에서 "권사" 선택
3. 저장 시 position = 'DEACONESS' 전송 ✅
4. API는 position_category = 'DEACONESS' 반환
5. 주소록 "권사" 탭에 표시됨 ✅
```

---

## ❓ 8. FAQ

### Q1. 기존 앱 버전과의 호환성은?

**A:** API가 `position`, `position_label`, `position_category`를 모두 반환하므로,
기존 앱은 `position_label`을 사용하여 하위 호환성 유지 가능.
단, 필터링 오류를 방지하려면 앱 업데이트 권장.

### Q2. '교역자' 직분을 선택할 수 있나요?

**A:** 네. 드롭다운에는 없지만, 관리자가 특정 사용자를 일반 교역자(`CLERGY`)로 지정할 수 있습니다.
목사나 전도사가 아닌 교역자를 위한 옵션입니다.

### Q3. '청년', '교회학교'는 직분인가요?

**A:** 아닙니다. 연령대 기반 **카테고리**입니다.
`position`이 `MEMBER`이거나 `TEACHER`인 경우, `birth_date`를 기준으로 자동 분류됩니다.

### Q4. 한글 직분을 영문으로 변환하는 함수가 필요한가요?

**A:** 레거시 지원이 필요하다면:

```dart
String labelToCode(String label) {
  const map = {
    '목사': 'PASTOR',
    '전도사': 'EVANGELIST',
    '장로': 'ELDER',
    '권사': 'DEACONESS',
    '집사': 'DEACON',
    '성도': 'MEMBER',
  };
  return map[label] ?? 'MEMBER';
}
```

하지만 앱 업데이트 후에는 불필요합니다.

---

## 📞 9. 문의

백엔드 정책 관련 문의:
- 관리자 대시보드: `src/constants/memberPositions.ts` 참조
- 마이그레이션: `supabase/migrations/20251109000000_standardize_member_positions.sql` 참조

문제 발생 시 백엔드 팀에 연락 주세요.

---

**작성일:** 2025-11-09
**버전:** 1.0
**적용 대상:** Smart Yoram 모바일 앱
