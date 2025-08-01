# Push Notifications UI Documentation

## Overview
관리자 대시보드에서 푸시 알림을 발송하고 관리하는 UI 구현 가이드입니다.

## Component Structure

### PushNotifications Component
위치: `/src/components/PushNotifications.tsx`

```typescript
interface NotificationHistory {
  id: number;
  type: string;
  title: string;
  body: string;
  target_type: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  sent_at: string;
  created_at: string;
  status?: string;
}
```

## UI Features

### 1. 탭 구조
- **알림 발송 (Send)**: 새로운 알림 작성 및 발송
- **발송 이력 (History)**: 발송된 알림 이력 조회

### 2. 알림 발송 UI

#### 대상 선택
```tsx
<RadioGroup value={targetType} onValueChange={setTargetType}>
  <RadioGroupItem value="all" /> 전체 교인
  <RadioGroupItem value="group" /> 그룹 선택
  <RadioGroupItem value="individual" /> 개별 선택
</RadioGroup>
```

#### 알림 내용 작성
- 알림 유형 선택 (공지사항, 예배 알림 등)
- 제목 입력
- 내용 입력 (Textarea)
- 이미지 URL (선택사항)
- 링크 URL (선택사항)

#### 교인 선택 다이얼로그
```tsx
<Dialog open={isMemberDialogOpen}>
  <DialogContent>
    {members.map((member) => (
      <Checkbox
        checked={selectedMembers.includes(member.id)}
        onCheckedChange={() => handleMemberSelect(member.id)}
      />
    ))}
  </DialogContent>
</Dialog>
```

### 3. 발송 이력 UI

#### 이력 카드
각 알림 이력은 카드 형태로 표시:
- 제목 및 내용
- 상태 배지 (발송 완료, 일부 실패 등)
- 알림 유형 배지
- 발송 통계 (성공, 실패, 읽음 수)
- 발송 시간

#### 상태 배지
```tsx
const getStatusBadge = (item: NotificationHistory) => {
  switch (status) {
    case 'success':
      return <Badge variant="success">발송 완료</Badge>;
    case 'failed':
      return <Badge variant="destructive">발송 실패</Badge>;
    case 'partial':
      return <Badge variant="warning">일부 실패</Badge>;
    case 'no_recipients':
      return <Badge variant="secondary">대상 없음</Badge>;
    case 'pending':
      return <Badge variant="outline">대기중</Badge>;
  }
};
```

## User Interactions

### 1. 알림 발송 플로우
1. 대상 선택 (전체/그룹/개별)
2. 개별 선택 시 교인 선택 다이얼로그 표시
3. 알림 내용 작성
4. 발송 버튼 클릭
5. 결과 토스트 메시지 표시

### 2. 결과 표시
```tsx
// 상세한 발송 결과 표시
if (result.message) {
  description = result.message; // "성공: 3명, 실패: 1명, 기기 없음: 1명"
}

toast({
  title: result.success ? '발송 완료' : '발송 결과',
  description,
  variant: result.success ? 'default' : 'destructive',
});
```

### 3. 에러 처리
- 제목/내용 미입력 시 경고
- 대상 미선택 시 경고
- API 에러 시 상세 메시지 표시

## Styling

### 1. 카드 레이아웃
```tsx
<Card>
  <CardHeader>
    <CardTitle>알림 대상 선택</CardTitle>
    <CardDescription>푸시 알림을 받을 대상을 선택하세요</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 컨텐츠 */}
  </CardContent>
</Card>
```

### 2. 상태별 색상
- 성공: `text-green-600`
- 실패: `text-red-500`
- 경고: `text-yellow-600`
- 기본: `text-gray-500`

### 3. 아이콘 사용
```tsx
import { Send, History, Users, Bell, Clock } from 'lucide-react';

<Send className="mr-2 h-4 w-4" /> // 발송 버튼
<History className="mr-2 h-4 w-4" /> // 이력 탭
<Bell className="mx-auto h-12 w-12" /> // 빈 상태
<Clock className="mr-1 h-3 w-3" /> // 시간 표시
```

## API Integration

### 1. API 엔드포인트
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api.com/api/v1';

// 전체 발송
`${API_BASE_URL}/notifications/send-to-church`

// 개별 발송
`${API_BASE_URL}/notifications/send`

// 다중 발송
`${API_BASE_URL}/notifications/send-batch`

// 이력 조회
`${API_BASE_URL}/notifications/history`
```

### 2. 인증 헤더
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
}
```

### 3. 에러 처리
```typescript
try {
  const response = await fetch(endpoint, options);
  if (response.ok) {
    const result = await response.json();
    // 성공 처리
  } else {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to send notification');
  }
} catch (error: any) {
  toast({
    title: '오류',
    description: error.message || '푸시 알림 발송에 실패했습니다.',
    variant: 'destructive',
  });
}
```

## State Management

### 1. Component State
```typescript
const [activeTab, setActiveTab] = useState('send');
const [targetType, setTargetType] = useState('all');
const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
const [members, setMembers] = useState<Member[]>([]);
const [history, setHistory] = useState<NotificationHistory[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [formData, setFormData] = useState({
  title: '',
  body: '',
  type: 'announcement',
  image_url: '',
  link_url: '',
});
```

### 2. Data Fetching
```typescript
useEffect(() => {
  if (activeTab === 'history') {
    fetchHistory();
  }
}, [activeTab]);

useEffect(() => {
  if (targetType === 'individual' || targetType === 'group') {
    fetchMembers();
  }
}, [targetType]);
```

## Accessibility

1. **Label Association**
   ```tsx
   <Label htmlFor="title">제목</Label>
   <Input id="title" />
   ```

2. **Loading States**
   ```tsx
   <Button disabled={isLoading}>
     {isLoading ? '발송 중...' : '알림 발송'}
   </Button>
   ```

3. **Empty States**
   ```tsx
   {history.length === 0 ? (
     <Card>
       <CardContent className="text-center py-8">
         <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
         <p className="text-gray-500">발송한 알림이 없습니다</p>
       </CardContent>
     </Card>
   ) : (
     // 이력 표시
   )}
   ```

## Performance Optimization

1. **Debounced Search** (Future)
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce(searchMembers, 300),
     []
   );
   ```

2. **Virtualized List** (Future)
   ```typescript
   // 대량의 교인 목록 처리 시
   import { VirtualList } from '@tanstack/react-virtual';
   ```

3. **Lazy Loading**
   ```typescript
   const PushNotifications = lazy(() => import('./PushNotifications'));
   ```

## Testing Considerations

1. **Mock Data**
   ```typescript
   const mockMembers = [
     { id: 1, name: '홍길동', phone: '010-1234-5678', department: '청년부' },
     { id: 2, name: '김철수', phone: '010-2345-6789', department: '장년부' },
   ];
   ```

2. **Test Scenarios**
   - 알림 발송 성공
   - 일부 실패
   - 전체 실패
   - 기기 없는 사용자
   - Rate limit 초과

## Future Enhancements

1. **템플릿 기능**
   - 자주 사용하는 알림 템플릿 저장
   - 템플릿 선택 UI

2. **예약 발송**
   - 날짜/시간 선택기
   - 예약된 알림 관리

3. **상세 통계**
   - 시간대별 읽음률
   - 알림 유형별 성과
   - 사용자별 반응

4. **Rich Editor**
   - WYSIWYG 에디터
   - 이모지 지원
   - 서식 지원

5. **대량 발송 최적화**
   - 진행률 표시
   - 취소 기능
   - 일시정지/재개