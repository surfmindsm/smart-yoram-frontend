# AI 대화 데이터베이스 연동 기능 구현 요청

## 개요
AI 교역자와의 대화 시 해당 교회의 모든 데이터베이스 내용을 조회하여 더 정확하고 개인화된 답변을 제공할 수 있도록 하는 기능을 구현하고자 합니다.

## 현재 구현 상태
- ✅ 프론트엔드: 에이전트 생성 시 교회 데이터 소스 선택 UI 구현 완료
- ✅ 프론트엔드: AI 채팅 인터페이스 구현 완료
- ⏳ 백엔드: 교회 데이터 조회 및 컨텍스트 생성 로직 필요

## 요청사항

### 1. 교회 데이터 통합 조회 API 개발

#### 1.1 엔드포인트
```
GET /api/v1/church-data/{church_id}/context
```

#### 1.2 응답 데이터 구조
```json
{
  "church_id": "string",
  "data_sources": {
    "announcements": {
      "enabled": true,
      "data": [
        {
          "id": "uuid",
          "title": "string",
          "content": "string",
          "category": "string",
          "subcategory": "string",
          "created_at": "timestamp",
          "target_audience": ["string"]
        }
      ]
    },
    "attendance": {
      "enabled": true,
      "data": {
        "recent_statistics": [
          {
            "date": "date",
            "service_type": "string",
            "attendance_count": "number",
            "total_members": "number"
          }
        ],
        "trends": {
          "monthly_average": "number",
          "growth_rate": "number"
        }
      }
    },
    "members": {
      "enabled": true,
      "data": {
        "total_count": "number",
        "demographics": {
          "age_groups": {
            "youth": "number",
            "adults": "number",
            "seniors": "number"
          },
          "gender_distribution": {
            "male": "number",
            "female": "number"
          }
        },
        "ministry_participation": [
          {
            "ministry_name": "string",
            "participant_count": "number"
          }
        ]
      }
    },
    "services": {
      "enabled": true,
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "day_of_week": "string",
          "time": "time",
          "location": "string",
          "description": "string"
        }
      ]
    }
  },
  "generated_at": "timestamp"
}
```

### 2. AI 대화 Edge Function 수정

#### 2.1 기존 Edge Function 위치
```
supabase/functions/ai-chat/index.ts
```

#### 2.2 필요한 수정사항

**A. 교회 데이터 조회 로직 추가**
```typescript
// 에이전트 설정에서 churchDataSources 확인
const agent = await getAgentById(agentId);
const churchDataSources = agent.churchDataSources;

// 선택된 데이터 소스가 있는 경우 교회 데이터 조회
let churchContext = '';
if (churchDataSources && churchDataSources.length > 0) {
  const churchData = await fetchChurchData(churchId, churchDataSources);
  churchContext = formatChurchDataForGPT(churchData);
}
```

**B. GPT API 호출 시 컨텍스트 포함**
```typescript
const systemMessage = {
  role: 'system',
  content: `
당신은 ${churchName}의 AI 교역자입니다.
다음은 현재 교회의 실시간 데이터입니다:

${churchContext}

이 정보를 바탕으로 정확하고 개인화된 답변을 제공해주세요.
`
};

const messages = [
  systemMessage,
  ...conversationHistory,
  { role: 'user', content: userMessage }
];
```

### 3. 데이터베이스 스키마 확인 및 최적화

#### 3.1 기존 테이블 확인 필요
- `announcements` 테이블
- `attendance_records` 테이블  
- `members` 테이블
- `church_services` 테이블
- `agents` 테이블의 `churchDataSources` 컬럼

#### 3.2 인덱스 최적화
```sql
-- 교회별 데이터 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_church_created 
ON announcements(church_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_church_date 
ON attendance_records(church_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_members_church_active 
ON members(church_id, is_active);
```

### 4. 캐싱 전략

#### 4.1 Redis 캐싱 구현
```typescript
// 교회 데이터는 10분간 캐시
const cacheKey = `church_context:${churchId}:${dataSourcesHash}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

const freshData = await fetchChurchDataFromDB(churchId, dataSources);
await redis.setex(cacheKey, 600, JSON.stringify(freshData)); // 10분 캐시
```

### 5. 보안 및 권한 관리

#### 5.1 데이터 접근 권한 확인
```typescript
// 에이전트가 해당 교회의 데이터에 접근 권한이 있는지 확인
const hasPermission = await checkChurchAccess(agentId, churchId);
if (!hasPermission) {
  throw new Error('Unauthorized access to church data');
}
```

#### 5.2 민감 정보 필터링
```typescript
// 개인정보는 통계 데이터로만 제공
const sanitizedMemberData = {
  total_count: memberData.length,
  demographics: calculateDemographics(memberData),
  // 개인 식별 정보는 제외
};
```

### 6. 성능 최적화

#### 6.1 데이터 양 제한
- 공지사항: 최근 30일 데이터만 조회
- 출석 현황: 최근 3개월 통계만 포함
- 교인 정보: 개인정보 제외한 통계 데이터만

#### 6.2 병렬 처리
```typescript
// 각 데이터 소스를 병렬로 조회
const [announcements, attendance, members, services] = await Promise.all([
  fetchAnnouncements(churchId),
  fetchAttendanceStats(churchId),
  fetchMemberStats(churchId),
  fetchServices(churchId)
]);
```

### 7. 에러 처리

#### 7.1 graceful degradation
```typescript
try {
  const churchData = await fetchChurchData(churchId, dataSources);
  churchContext = formatChurchDataForGPT(churchData);
} catch (error) {
  console.error('Failed to fetch church data:', error);
  // 교회 데이터 없이도 AI 대화가 가능하도록 처리
  churchContext = '';
}
```

### 8. 모니터링 및 로깅

#### 8.1 성능 모니터링
- 데이터 조회 시간 측정
- 캐시 적중률 모니터링
- GPT API 응답 시간 측정

#### 8.2 사용량 로깅
```typescript
// AI 대화에서 교회 데이터 활용 통계
await logChurchDataUsage({
  church_id: churchId,
  agent_id: agentId,
  data_sources_used: churchDataSources,
  response_time: responseTime,
  timestamp: new Date()
});
```

## 구현 우선순위

1. **Phase 1 (필수)**: 기본 교회 데이터 조회 API 구현
2. **Phase 2 (중요)**: AI Edge Function에 컨텍스트 연동
3. **Phase 3 (최적화)**: 캐싱 및 성능 개선
4. **Phase 4 (고도화)**: 모니터링 및 분석 기능

## 예상 개발 기간
- Phase 1-2: 1-2주
- Phase 3-4: 1주

## 테스트 케이스

### 1. 기능 테스트
- [ ] 교회 데이터 조회 API 정상 동작
- [ ] AI 대화에서 교회 정보 활용 확인
- [ ] 데이터 소스별 선택적 조회 테스트

### 2. 성능 테스트
- [ ] 대용량 데이터 조회 성능 측정
- [ ] 캐싱 효과 검증
- [ ] 동시 접속자 처리 능력 테스트

### 3. 보안 테스트
- [ ] 권한 없는 교회 데이터 접근 차단 확인
- [ ] 개인정보 노출 방지 검증

## 참고사항
- 기존 에이전트 생성 UI에서 `churchDataSources` 필드를 통해 데이터 소스 선택 가능
- AI 채팅 히스토리 저장 기능과 연동하여 대화 컨텍스트 유지
- OpenAI API 키는 반드시 환경변수로 관리 (GitHub 노출 시 자동 무효화됨)
