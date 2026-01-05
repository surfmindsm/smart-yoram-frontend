# 모바일 교인 관리 API 가이드

## 개요
이 문서는 모바일 앱에서 교인(Members) 관리 기능을 구현하기 위한 상세 가이드입니다. Supabase Edge Function (`members`)을 사용하여 교인 조회, 추가, 수정, 삭제 기능을 구현할 수 있습니다.

---

## 📋 목차
1. [인증 설정](#1-인증-설정)
2. [교인 목록 조회](#2-교인-목록-조회)
3. [교인 추가](#3-교인-추가)
4. [교인 수정](#4-교인-수정)
5. [교인 삭제](#5-교인-삭제)
6. [에러 처리](#6-에러-처리)
7. [전체 필드 목록](#7-전체-필드-목록)

---

## 1. 인증 설정

### 헤더 설정
모든 API 요청에는 인증 헤더가 필요합니다.

```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-Custom-Auth': `temp_token_${userId}_${Date.now()}`,
  // 또는
  'Authorization': `Bearer temp_token_${userId}_${Date.now()}`
}
```

### Supabase URL
```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'
const MEMBERS_ENDPOINT = `${SUPABASE_URL}/functions/v1/members`
```

---

## 2. 교인 목록 조회

### 2.1 기본 조회

**요청**
```http
GET /functions/v1/members?page=1&limit=50
```

**TypeScript 예제**
```typescript
async function getMembers(params: {
  page?: number
  limit?: number
  search?: string
  position?: string
  department?: string
  status?: string
}) {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 50).toString(),
    ...(params.search && { search: params.search }),
    ...(params.position && { position: params.position }),
    ...(params.department && { department: params.department }),
    ...(params.status && { status: params.status })
  })

  const response = await fetch(
    `${MEMBERS_ENDPOINT}?${queryParams}`,
    { headers }
  )

  return await response.json()
}
```

**응답 예시**
```json
{
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "name_eng": "Hong Gildong",
      "phone": "010-1234-5678",
      "email": "hong@example.com",
      "gender": "male",
      "birthdate": "1990-05-15",
      "birthdate_type": "solar",
      "position": "집사",
      "department": "청년부",
      "organization_id": 5,
      "organization_name": "찬양팀",
      "status": "active",
      "address": "서울시 강남구",
      "job_category": "IT",
      "marital_status": "married",
      "spouse_name": "김영희",
      "created_at": "2024-01-01T00:00:00Z",
      "inviter_name": "박목사"
    }
  ],
  "count": 150,
  "page": 1,
  "limit": 50,
  "total_pages": 3
}
```

### 2.2 검색 및 필터링

**이름/전화번호 검색**
```typescript
const result = await getMembers({ search: '홍길동' })
```

**직분 필터**
```typescript
const result = await getMembers({ position: '집사' })
```

**부서 필터**
```typescript
const result = await getMembers({ department: '청년부' })
```

**상태 필터**
```typescript
const result = await getMembers({ status: 'active' })
```

**복합 검색**
```typescript
const result = await getMembers({
  search: '홍',
  position: '집사',
  department: '청년부',
  page: 1,
  limit: 20
})
```

### 2.3 페이지네이션

```typescript
interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

function parsePagination(response: any): PaginationInfo {
  return {
    currentPage: response.page,
    totalPages: response.total_pages,
    totalCount: response.count,
    hasNext: response.page < response.total_pages,
    hasPrev: response.page > 1
  }
}
```

---

## 3. 교인 추가

### 3.1 기본 추가

**요청**
```http
POST /functions/v1/members
Content-Type: application/json
```

**최소 필드 예제**
```typescript
async function createMember(memberData: {
  name: string
  phone?: string
  email?: string
  gender?: 'male' | 'female'
  status?: 'active' | 'inactive' | 'resting'
}) {
  const response = await fetch(MEMBERS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: memberData.name,
      phone: memberData.phone,
      email: memberData.email,
      gender: memberData.gender,
      status: memberData.status || 'active'
    })
  })

  return await response.json()
}
```

**전체 필드 예제**
```typescript
async function createMemberFull(memberData: any) {
  const response = await fetch(MEMBERS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      // 기본 정보
      name: memberData.name,
      name_eng: memberData.name_eng,
      phone: memberData.phone,
      email: memberData.email,
      gender: memberData.gender,
      birthdate: memberData.birthdate,
      birthdate_type: memberData.birthdate_type || 'solar',

      // 사역 정보
      position: memberData.position,
      position_main: memberData.position_main,
      position_detail: memberData.position_detail,
      department: memberData.department,
      organization_id: memberData.organization_id,
      appointed_on: memberData.appointed_on,
      ordination_church: memberData.ordination_church,
      ministry_start_date: memberData.ministry_start_date,
      neighboring_church: memberData.neighboring_church,
      position_decision: memberData.position_decision,
      daily_activity: memberData.daily_activity,
      inviter3_member_id: memberData.inviter3_member_id,

      // 직업 정보
      job_category: memberData.job_category,
      job_detail: memberData.job_detail,
      job_position: memberData.job_position,
      job_title: memberData.job_title,
      workplace: memberData.workplace,
      workplace_phone: memberData.workplace_phone,

      // 주소 정보
      address: memberData.address,
      postal_code: memberData.postal_code,
      region_1: memberData.region_1,
      region_2: memberData.region_2,
      region_3: memberData.region_3,

      // 개인 및 가족 정보
      marital_status: memberData.marital_status,
      spouse_name: memberData.spouse_name,
      married_on: memberData.married_on,
      member_type: memberData.member_type,
      age_group: memberData.age_group,
      spiritual_grade: memberData.spiritual_grade,
      confirmation_date: memberData.confirmation_date,
      sub_district: memberData.sub_district,
      last_contact_date: memberData.last_contact_date,

      // 자유 필드 (커스텀)
      custom_field_1: memberData.custom_field_1,
      custom_field_2: memberData.custom_field_2,
      custom_field_3: memberData.custom_field_3,
      custom_field_4: memberData.custom_field_4,
      custom_field_5: memberData.custom_field_5,
      custom_field_6: memberData.custom_field_6,
      custom_field_7: memberData.custom_field_7,
      custom_field_8: memberData.custom_field_8,
      custom_field_9: memberData.custom_field_9,
      custom_field_10: memberData.custom_field_10,
      custom_field_11: memberData.custom_field_11,
      custom_field_12: memberData.custom_field_12,

      // 특별 사항
      special_notes: memberData.special_notes,

      // 상태
      status: memberData.status || 'active'
    })
  })

  if (!response.ok) {
    throw new Error(`교인 추가 실패: ${response.statusText}`)
  }

  return await response.json()
}
```

**응답 예시**
```json
{
  "id": 123,
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "status": "active",
  "church_id": 1,
  "created_at": "2025-01-03T12:00:00Z"
}
```

### 3.2 교인 추가 폼 구성 예시

**React Native 예제**
```typescript
import React, { useState } from 'react'
import { View, TextInput, Button, ScrollView } from 'react-native'

export function AddMemberScreen() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    birthdate: '',
    position: '',
    department: ''
  })

  const handleSubmit = async () => {
    try {
      const result = await createMember(formData)
      console.log('교인 추가 성공:', result)
      // 성공 처리
    } catch (error) {
      console.error('교인 추가 실패:', error)
      // 에러 처리
    }
  }

  return (
    <ScrollView>
      <TextInput
        placeholder="이름 *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <TextInput
        placeholder="전화번호"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />
      <TextInput
        placeholder="이메일"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      {/* 추가 필드들... */}
      <Button title="교인 추가" onPress={handleSubmit} />
    </ScrollView>
  )
}
```

---

## 4. 교인 수정

### 4.1 기본 수정

**요청**
```http
PUT /functions/v1/members/{member_id}
Content-Type: application/json
```

**TypeScript 예제**
```typescript
async function updateMember(
  memberId: number,
  updates: Partial<MemberUpdateData>
) {
  const response = await fetch(`${MEMBERS_ENDPOINT}/${memberId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    throw new Error(`교인 수정 실패: ${response.statusText}`)
  }

  return await response.json()
}
```

**사용 예시**
```typescript
// 전화번호만 수정
await updateMember(123, {
  phone: '010-9999-8888'
})

// 여러 필드 수정
await updateMember(123, {
  phone: '010-9999-8888',
  email: 'newemail@example.com',
  position: '권사',
  department: '장년부'
})

// 주소 정보 수정
await updateMember(123, {
  address: '서울시 강남구 테헤란로 123',
  postal_code: '06159',
  region_1: '서울',
  region_2: '강남구',
  region_3: '삼성동'
})

// 프로필 사진 URL 수정
await updateMember(123, {
  profile_photo_url: 'https://your-storage-url.com/photos/member123.jpg'
})
```

### 4.2 이메일 변경 시 주의사항

이메일을 변경하면 관련 테이블(auth.users, users)도 자동으로 동기화됩니다.

```typescript
// 이메일 변경
await updateMember(123, {
  email: 'newemail@example.com'
})
// → members, auth.users, users 테이블 모두 업데이트됨
```

### 4.3 수정 폼 구성 예시

**React Native 예제**
```typescript
import React, { useState, useEffect } from 'react'
import { View, TextInput, Button, ScrollView, Alert } from 'react-native'

export function EditMemberScreen({ route, navigation }) {
  const { memberId } = route.params
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMemberData()
  }, [memberId])

  const loadMemberData = async () => {
    // 기존 교인 정보 로드 로직
    // GET 요청으로 상세 정보를 가져올 수 있습니다
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const result = await updateMember(memberId, formData)
      Alert.alert('성공', '교인 정보가 수정되었습니다')
      navigation.goBack()
    } catch (error) {
      Alert.alert('오류', '교인 정보 수정에 실패했습니다')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView>
      <TextInput
        placeholder="이름"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <TextInput
        placeholder="전화번호"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />
      <TextInput
        placeholder="이메일"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      {/* 추가 필드들... */}
      <Button
        title="수정 완료"
        onPress={handleUpdate}
        disabled={loading}
      />
    </ScrollView>
  )
}
```

---

## 5. 교인 삭제

### 5.1 삭제 API

**⚠️ 중요:** 삭제는 **완전 삭제(Hard Delete)**이며, 관련된 모든 데이터가 함께 삭제됩니다!

**요청**
```http
DELETE /functions/v1/members?id={member_id}
```

**주의:** PUT과 달리 DELETE는 쿼리 파라미터로 ID를 전달합니다!

**TypeScript 예제**
```typescript
async function deleteMember(memberId: number) {
  const response = await fetch(
    `${MEMBERS_ENDPOINT}?id=${memberId}`,
    {
      method: 'DELETE',
      headers
    }
  )

  if (!response.ok) {
    throw new Error(`교인 삭제 실패: ${response.statusText}`)
  }

  return await response.json()
}
```

**응답 예시**
```json
{
  "success": true,
  "message": "교인 정보가 완전히 삭제되었습니다 (개인정보 포함).",
  "data": {
    "id": 123,
    "name": "홍길동",
    "email": "hong@example.com",
    "church_id": 1
  }
}
```

### 5.2 삭제 시 함께 제거되는 데이터

교인 삭제 시 다음 데이터가 자동으로 함께 삭제됩니다:

1. **member_contacts** - 추가 연락처 정보
2. **sacraments** - 성례(세례, 입교) 기록
3. **transfers** - 전입/출 기록
4. **member_vehicles** - 차량 정보
5. **auth.users** - 인증 계정 (이메일이 있는 경우)
6. **users** - 사용자 프로필

### 5.3 삭제 확인 UI 예시

**React Native 예제**
```typescript
import React from 'react'
import { Alert } from 'react-native'

export function MemberDetailScreen({ route, navigation }) {
  const { memberId, memberName } = route.params

  const handleDelete = () => {
    Alert.alert(
      '교인 삭제',
      `정말로 "${memberName}" 교인을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 영구적으로 삭제됩니다.`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMember(memberId)
              Alert.alert('성공', '교인이 삭제되었습니다')
              navigation.goBack()
            } catch (error) {
              Alert.alert('오류', '교인 삭제에 실패했습니다')
              console.error(error)
            }
          }
        }
      ]
    )
  }

  return (
    // ... UI 컴포넌트
    <Button title="교인 삭제" onPress={handleDelete} color="red" />
  )
}
```

### 5.4 삭제 권한 및 제한

- 일반 사용자: 자신의 교회 교인만 삭제 가능
- Super Admin (church_id = 0): 모든 교회 교인 삭제 가능
- 삭제는 즉시 실행되며 휴지통 기능이 없습니다

---

## 6. 에러 처리

### 6.1 공통 에러

```typescript
interface ApiError {
  error: string
  details?: string
  code?: string
}

async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall()

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.error || '알 수 없는 오류가 발생했습니다')
    }

    return await response.json()
  } catch (error) {
    console.error('API 호출 오류:', error)
    throw error
  }
}
```

### 6.2 인증 에러 처리

```typescript
// 401 Unauthorized
{
  "error": "Missing authentication"
}

// 401 Unauthorized - 토큰 만료
{
  "error": "Token expired"
}

// 401 Unauthorized - 잘못된 토큰
{
  "error": "Invalid token structure"
}
```

**처리 예시**
```typescript
if (response.status === 401) {
  // 토큰 갱신 또는 재로그인
  await refreshToken()
  // 또는
  navigation.navigate('Login')
}
```

### 6.3 검증 에러

```typescript
// 400 Bad Request
{
  "error": "Member ID is required"
}

// 400 Bad Request
{
  "error": "Invalid JSON in request body"
}
```

### 6.4 서버 에러

```typescript
// 500 Internal Server Error
{
  "error": "Failed to create member",
  "details": "duplicate key value violates unique constraint",
  "code": "23505"
}
```

**처리 예시**
```typescript
try {
  await createMember(memberData)
} catch (error) {
  if (error.message.includes('duplicate')) {
    Alert.alert('오류', '이미 등록된 교인입니다')
  } else {
    Alert.alert('오류', '교인 추가에 실패했습니다')
  }
}
```

---

## 7. 전체 필드 목록

### 7.1 기본 정보
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `name` | string | ✅ | ✅ | ✅ | 이름 | "홍길동" |
| `name_eng` | string | ❌ | ✅ | ✅ | 영문 이름 | "Hong Gildong" |
| `phone` | string | ❌ | ✅ | ✅ | 전화번호 | "010-1234-5678" |
| `email` | string | ❌ | ✅ | ✅ | 이메일 | "hong@example.com" |
| `gender` | string | ❌ | ✅ | ✅ | 성별 | "male", "female" |
| `birthdate` | string | ❌ | ✅ | ✅ | 생년월일 | "1990-05-15" |
| `birthdate_type` | string | ❌ | ✅ | ✅ | 생일 구분 | "solar", "lunar" |

### 7.2 사역 정보
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `position` | string | ❌ | ✅ | ✅ | 직분 | "집사", "권사", "장로" |
| `position_main` | string | ❌ | ✅ | ✅ | 주 직분 | "담임목사" |
| `position_detail` | string | ❌ | ✅ | ✅ | 직분 상세 | "청년부 담당" |
| `department` | string | ❌ | ✅ | ✅ | 소속 부서 | "청년부", "장년부" |
| `organization_id` | number | ❌ | ✅ | ✅ | 조직 ID | 5 |
| `appointed_on` | string | ❌ | ✅ | ✅ | 임명일 | "2020-01-01" |
| `ordination_church` | string | ❌ | ✅ | ✅ | 안수교회 | "○○교회" |
| `ministry_start_date` | string | ❌ | ✅ | ✅ | 사역 시작일 | "2018-03-01" |
| `neighboring_church` | string | ❌ | ✅ | ✅ | 이웃 교회 | "△△교회" |
| `position_decision` | string | ❌ | ✅ | ✅ | 직분 결정 사항 | "정회원" |
| `daily_activity` | string | ❌ | ✅ | ✅ | 일상 활동 | "예배 참석, 기도회" |
| `inviter3_member_id` | number | ❌ | ✅ | ❌ | 인도자 ID (생성만 가능) | 10 |

### 7.3 직업 정보
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `job_category` | string | ❌ | ✅ | ✅ | 직업 분류 | "IT", "교육", "의료" |
| `job_detail` | string | ❌ | ✅ | ✅ | 직업 상세 | "소프트웨어 개발자" |
| `job_position` | string | ❌ | ✅ | ✅ | 직책 | "팀장", "과장" |
| `job_title` | string | ❌ | ✅ | ✅ | 직함 | "시니어 개발자" |
| `workplace` | string | ❌ | ✅ | ✅ | 직장명 | "○○회사" |
| `workplace_phone` | string | ❌ | ✅ | ✅ | 직장 전화번호 | "02-1234-5678" |

### 7.4 주소 정보
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `address` | string | ❌ | ✅ | ✅ | 주소 | "서울시 강남구" |
| `postal_code` | string | ❌ | ✅ | ✅ | 우편번호 | "06159" |
| `region_1` | string | ❌ | ✅ | ✅ | 지역1 (시/도) | "서울" |
| `region_2` | string | ❌ | ✅ | ✅ | 지역2 (구/군) | "강남구" |
| `region_3` | string | ❌ | ✅ | ✅ | 지역3 (동/읍/면) | "삼성동" |

### 7.5 개인 및 가족 정보
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `marital_status` | string | ❌ | ✅ | ✅ | 결혼 상태 | "married", "single" |
| `spouse_name` | string | ❌ | ✅ | ✅ | 배우자 이름 | "김영희" |
| `married_on` | string | ❌ | ✅ | ✅ | 결혼일 | "2015-05-10" |
| `member_type` | string | ❌ | ✅ | ✅ | 교인 유형 | "정회원", "준회원" |
| `age_group` | string | ❌ | ✅ | ✅ | 연령대 | "청년", "장년", "노년" |
| `spiritual_grade` | string | ❌ | ✅ | ✅ | 신앙 등급 | "초신자", "성장기" |
| `confirmation_date` | string | ❌ | ✅ | ✅ | 입교일 | "2010-03-15" |
| `sub_district` | string | ❌ | ✅ | ✅ | 구역 | "1구역" |
| `last_contact_date` | string | ❌ | ✅ | ✅ | 마지막 연락일 | "2025-01-01" |

### 7.6 자유 필드 (커스텀)
| 필드명 | 타입 | 필수 | POST | PUT | 설명 |
|--------|------|------|------|-----|------|
| `custom_field_1` ~ `custom_field_12` | string | ❌ | ✅ | ✅ | 교회별 커스텀 필드 |

### 7.7 특별 사항
| 필드명 | 타입 | 필수 | POST | PUT | 설명 | 예시 |
|--------|------|------|------|-----|------|------|
| `special_notes` | string | ❌ | ✅ | ✅ | 특별 사항 | "알러지 있음" |
| `status` | string | ❌ | ✅ | ✅ | 상태 | "active", "inactive", "resting" |

### 7.8 프로필 사진
| 필드명 | 타입 | 필수 | POST | PUT | 설명 |
|--------|------|------|------|-----|------|
| `profile_photo_url` | string | ❌ | ❌ | ✅ | 프로필 사진 URL (수정만 가능) |

### 7.9 읽기 전용 (자동 생성)
| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | number | 교인 ID |
| `church_id` | number | 소속 교회 ID (자동 설정) |
| `created_at` | string | 생성일시 |
| `updated_at` | string | 수정일시 |
| `inviter_name` | string | 인도자 이름 (조회 시 포함) |
| `organization_name` | string | 조직 이름 (조회 시 포함) |

---

## 8. TypeScript 타입 정의

**중요:** 이 API는 **snake_case** 필드명을 사용합니다!

```typescript
// 교인 생성 데이터
interface MemberCreateData {
  // 기본 정보
  name: string
  name_eng?: string
  phone?: string
  email?: string
  gender?: 'male' | 'female'
  birthdate?: string
  birthdate_type?: 'solar' | 'lunar'

  // 사역 정보
  position?: string
  position_main?: string
  position_detail?: string
  department?: string
  organization_id?: number
  appointed_on?: string
  ordination_church?: string
  ministry_start_date?: string
  neighboring_church?: string
  position_decision?: string
  daily_activity?: string
  inviter3_member_id?: number  // POST만 가능

  // 직업 정보
  job_category?: string
  job_detail?: string
  job_position?: string
  job_title?: string
  workplace?: string
  workplace_phone?: string

  // 주소 정보
  address?: string
  postal_code?: string
  region_1?: string
  region_2?: string
  region_3?: string

  // 개인 및 가족 정보
  marital_status?: 'married' | 'single' | 'divorced' | 'widowed'
  spouse_name?: string
  married_on?: string
  member_type?: string
  age_group?: string
  spiritual_grade?: string
  confirmation_date?: string
  sub_district?: string
  last_contact_date?: string

  // 자유 필드
  custom_field_1?: string
  custom_field_2?: string
  custom_field_3?: string
  custom_field_4?: string
  custom_field_5?: string
  custom_field_6?: string
  custom_field_7?: string
  custom_field_8?: string
  custom_field_9?: string
  custom_field_10?: string
  custom_field_11?: string
  custom_field_12?: string

  // 특별 사항
  special_notes?: string
  status?: 'active' | 'inactive' | 'resting'
}

// 교인 수정 데이터
interface MemberUpdateData {
  // MemberCreateData의 모든 필드 + 추가 필드
  name?: string
  name_eng?: string
  phone?: string
  email?: string
  gender?: 'male' | 'female'
  birthdate?: string
  birthdate_type?: 'solar' | 'lunar'
  profile_photo_url?: string  // PUT만 가능

  // 사역 정보 (inviter3_member_id 제외)
  position?: string
  position_main?: string
  position_detail?: string
  department?: string
  organization_id?: number
  appointed_on?: string
  ordination_church?: string
  ministry_start_date?: string
  neighboring_church?: string
  position_decision?: string
  daily_activity?: string
  // inviter3_member_id는 수정 불가

  // 직업, 주소, 개인 정보 등 (생략)
  // ... (MemberCreateData와 동일)

  status?: 'active' | 'inactive' | 'resting'
}

// 교인 정보 (조회 결과)
interface Member {
  id: number
  church_id: number
  name: string
  name_eng?: string
  phone?: string
  email?: string
  gender?: 'male' | 'female'
  birthdate?: string
  birthdate_type?: string
  profile_photo_url?: string

  // 사역 정보
  position?: string
  position_main?: string
  position_detail?: string
  department?: string
  organization_id?: number
  inviter3_member_id?: number

  // 조회 시 추가되는 필드
  inviter_name?: string      // enrichment
  organization_name?: string  // enrichment

  // 직업, 주소, 개인 정보 등
  job_category?: string
  address?: string
  marital_status?: string
  spouse_name?: string

  // 자유 필드
  custom_field_1?: string
  // ... custom_field_2 ~ 12

  special_notes?: string
  status: string
  created_at: string
  updated_at?: string
}

// 교인 목록 응답
interface MembersListResponse {
  data: Member[]
  count: number
  page: number
  limit: number
  total_pages: number
}
```

---

## 9. 실전 사용 예시

### 9.1 교인 목록 화면

```typescript
import React, { useState, useEffect } from 'react'
import { View, FlatList, TextInput, Text, TouchableOpacity } from 'react-native'

export function MembersListScreen() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [page, search])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const result = await getMembers({ page, search, limit: 20 })
      setMembers(result.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <TextInput
        placeholder="이름 또는 전화번호 검색"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Text>{item.name}</Text>
            <Text>{item.phone}</Text>
            <Text>{item.position} - {item.department}</Text>
          </TouchableOpacity>
        )}
        onEndReached={() => setPage(page + 1)}
        refreshing={loading}
        onRefresh={loadMembers}
      />
    </View>
  )
}
```

### 9.2 교인 상세/수정 화면

```typescript
import React, { useState, useEffect } from 'react'
import { View, ScrollView, TextInput, Button, Alert } from 'react-native'

export function MemberDetailScreen({ route, navigation }) {
  const { memberId } = route.params
  const [member, setMember] = useState<Member | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    loadMember()
  }, [memberId])

  const loadMember = async () => {
    // 목록에서 찾거나 별도 API로 조회
    const result = await getMembers({ page: 1, limit: 1 })
    const found = result.data.find(m => m.id === memberId)
    setMember(found)
  }

  const handleSave = async () => {
    try {
      await updateMember(memberId, member)
      Alert.alert('성공', '교인 정보가 수정되었습니다')
      setEditing(false)
    } catch (error) {
      Alert.alert('오류', '수정에 실패했습니다')
    }
  }

  if (!member) return null

  return (
    <ScrollView>
      <TextInput
        placeholder="이름"
        value={member.name}
        editable={editing}
        onChangeText={(text) => setMember({ ...member, name: text })}
      />
      <TextInput
        placeholder="전화번호"
        value={member.phone}
        editable={editing}
        onChangeText={(text) => setMember({ ...member, phone: text })}
      />
      {/* 추가 필드들... */}

      {editing ? (
        <Button title="저장" onPress={handleSave} />
      ) : (
        <Button title="수정" onPress={() => setEditing(true)} />
      )}
    </ScrollView>
  )
}
```

---

## 10. 주의사항

### 10.1 church_id 자동 설정
- 교인 추가 시 `church_id`는 사용자의 교회 정보에서 자동으로 설정됩니다
- 직접 `church_id`를 보내도 무시되고 인증 토큰의 사용자 정보를 기반으로 설정됩니다

### 10.2 토큰 만료
- 임시 토큰은 24시간 유효합니다
- 만료 시 401 에러가 발생하며 재로그인이 필요합니다

### 10.3 교회 필터링
- 일반 사용자는 자신의 교회 교인만 조회/수정 가능합니다
- Super Admin (church_id = 0)만 모든 교회 교인을 조회할 수 있습니다

### 10.4 이메일 변경 시 동기화
- 이메일을 변경하면 `auth.users`와 `users` 테이블도 자동으로 업데이트됩니다
- 기존 이메일로 초대받지 않은 교인의 경우 동기화가 건너뛰어집니다

### 10.5 DELETE vs PUT URL 차이 ⚠️

**중요:** DELETE와 PUT의 URL 구조가 다릅니다!

```typescript
// PUT - URL path에 ID 포함
PUT /functions/v1/members/123

// DELETE - 쿼리 파라미터로 ID 전달
DELETE /functions/v1/members?id=123
```

---

## 11. 자주 묻는 질문 (FAQ)

### Q1. 교인 상세 정보는 어떻게 조회하나요?
A. 현재 Edge Function에는 단일 교인 조회 API가 없습니다. 목록 조회 후 클라이언트에서 필터링하거나, 향후 별도 API를 추가할 예정입니다.

### Q2. 프로필 사진은 어떻게 업로드하나요?
A.
1. 먼저 Supabase Storage에 이미지를 업로드합니다
2. 업로드된 이미지의 공개 URL을 받습니다
3. `PUT /members/{id}` 요청으로 `profile_photo_url` 필드를 업데이트합니다

**주의:** 프로필 사진 URL은 교인 생성(POST) 시에는 설정할 수 없고, 수정(PUT)으로만 가능합니다.

### Q3. 교인을 완전히 삭제할 수 있나요?
A. 네, DELETE 메서드를 사용하면 관련 데이터(contacts, vehicles, sacraments 등)와 함께 완전히 삭제됩니다. 자세한 내용은 [5. 교인 삭제](#5-교인-삭제) 섹션을 참고하세요.

**주의:** DELETE는 쿼리 파라미터(`?id=123`)를 사용하며, 복구가 불가능합니다!

### Q4. 페이지네이션 없이 전체 교인을 가져올 수 있나요?
A. `limit` 파라미터를 크게 설정하면 가능하지만 성능상 권장하지 않습니다. 페이지네이션을 사용하세요.

### Q5. 커스텀 필드는 어떻게 사용하나요?
A. `custom_field_1` ~ `custom_field_12` 필드에 교회별로 필요한 정보를 자유롭게 저장할 수 있습니다.

### Q6. 인도자 정보는 수정할 수 없나요?
A. 네, `inviter3_member_id`는 교인 생성(POST) 시에만 설정 가능하고, 수정(PUT)으로는 변경할 수 없습니다.

### Q7. 관계 테이블(연락처, 차량 등)은 어떻게 관리하나요?
A. `members` Edge Function은 members 테이블만 처리합니다.
- member_contacts (추가 연락처)
- member_vehicles (차량 정보)
- sacraments (성례 기록)
- transfers (전입/출 기록)

이러한 관계 테이블은 Supabase Client를 직접 사용하거나 별도 API로 처리해야 합니다.

---

## 문의 및 지원

이 가이드에 대한 문의사항이나 추가 기능 요청은 개발팀에게 연락해 주세요.

**마지막 업데이트**: 2025-01-03
**API 버전**: v1.0
