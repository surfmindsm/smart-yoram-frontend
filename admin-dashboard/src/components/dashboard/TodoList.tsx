import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Badge, Button } from "../ui";
import {
  Calendar,
  Cake,
  Heart,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  phone?: string;
  birthdate?: string;
  daysUntil?: number;
  department?: string;
  church_organizations?: {
    name: string;
  };
}

interface PastoralCare {
  id: string;
  requester_name: string;
  requester_phone?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  preferred_date?: string;
  request_type: string;
  address?: string;
  members?: {
    id: number;
    name: string;
    phone?: string;
    department?: string;
    church_organizations?: {
      name: string;
    };
  };
}

interface ImportantDate {
  id: number;
  title: string;
  event_type: string;
  event_date: string;
  notes?: string;
  daysUntil: number;
  members?: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface TodoListProps {
  todayBirthdays: Member[];
  upcomingBirthdays: Member[];
  todayPastoralCare: PastoralCare[];
  upcomingPastoralCare: PastoralCare[];
  upcomingImportantDates: ImportantDate[];
  loading?: boolean;
  onMemberClick?: (member: Member) => void;
  onPastoralCareClick?: (care: PastoralCare) => void;
  onImportantDateClick?: (event: ImportantDate) => void;
  onPastoralCareNavigate?: () => void;
}

const TodoList: React.FC<TodoListProps> = ({
  todayBirthdays,
  upcomingBirthdays,
  todayPastoralCare,
  upcomingPastoralCare,
  upcomingImportantDates,
  loading = false,
  onMemberClick,
  onPastoralCareClick,
  onImportantDateClick,
  onPastoralCareNavigate
}) => {
  const navigate = useNavigate();
  const [showAllBirthdays, setShowAllBirthdays] = React.useState(false);
  const [showAllPastoralCare, setShowAllPastoralCare] = React.useState(false);
  const [showAllImportantDates, setShowAllImportantDates] = React.useState(false);

  const ITEMS_LIMIT = 5;

  const totalItems =
    todayBirthdays.length +
    upcomingBirthdays.length +
    todayPastoralCare.length +
    upcomingPastoralCare.length +
    upcomingImportantDates.length;

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `(${date.getMonth() + 1}월 ${date.getDate()}일)`;
  };

  const getDdayText = (days: number) => {
    if (days === 0) return '오늘';
    return `${days}일 후`;
  };

  // 부서 표시 헬퍼 함수 (department만 표시)
  const getDepartment = (item?: { department?: string }) => {
    return item?.department || null;
  };

  // 날짜로부터 D-day 계산 함수
  const calculateDday = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays > 0) return `${diffDays}일 후`;
    return null;
  };

  // 생일 목록 통합 (오늘 + 다가오는 생일)
  const allBirthdays = [...todayBirthdays, ...upcomingBirthdays];

  // 심방 목록 통합 (오늘 + 다가오는 심방)
  const allPastoralCare = [...todayPastoralCare, ...upcomingPastoralCare];

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            불러오는 중...
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">예정된 일정이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 생일 */}
            {allBirthdays.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => navigate('/member-management')}>
                  <Cake className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold">생일</h4>
                  <Badge variant="secondary" className="ml-auto bg-gray-100">
                    {allBirthdays.length}명
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(showAllBirthdays ? allBirthdays : allBirthdays.slice(0, ITEMS_LIMIT)).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onMemberClick?.(member)}
                    >
                      <p className="text-sm font-medium">{member.name}</p>
                      {getDepartment(member) && (
                        <p className="text-xs text-muted-foreground">{getDepartment(member)}</p>
                      )}
                      {member.daysUntil !== undefined && (
                        <p className="text-xs text-muted-foreground ml-auto">
                          {member.daysUntil === 0 ? '오늘' : getDdayText(member.daysUntil)}
                        </p>
                      )}
                      {member.daysUntil === undefined && (
                        <p className="text-xs text-muted-foreground ml-auto">오늘</p>
                      )}
                    </div>
                  ))}
                </div>
                {allBirthdays.length > ITEMS_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowAllBirthdays(!showAllBirthdays)}
                  >
                    {showAllBirthdays ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        더보기 ({allBirthdays.length - ITEMS_LIMIT}명)
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* 심방 */}
            {allPastoralCare.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => navigate('/pastoral-care')}>
                  <Heart className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold">심방</h4>
                  <Badge variant="secondary" className="ml-auto bg-gray-100">
                    {allPastoralCare.length}건
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(showAllPastoralCare ? allPastoralCare : allPastoralCare.slice(0, ITEMS_LIMIT)).map((care) => (
                    <div
                      key={care.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onPastoralCareClick?.(care)}
                    >
                      <p className="text-sm font-medium">
                        {care.members?.name || care.requester_name}
                      </p>
                      {getDepartment(care.members) && (
                        <p className="text-xs text-muted-foreground">{getDepartment(care.members)}</p>
                      )}
                      <p className="text-xs text-muted-foreground ml-auto">
                        {calculateDday(care.scheduled_date || care.preferred_date)}
                      </p>
                    </div>
                  ))}
                </div>
                {allPastoralCare.length > ITEMS_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowAllPastoralCare(!showAllPastoralCare)}
                  >
                    {showAllPastoralCare ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        더보기 ({allPastoralCare.length - ITEMS_LIMIT}건)
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* 중요 일정 */}
            {upcomingImportantDates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => navigate('/important-dates')}>
                  <Bell className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold">일정</h4>
                  <Badge variant="secondary" className="ml-auto bg-gray-100">
                    {upcomingImportantDates.length}건
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(showAllImportantDates ? upcomingImportantDates : upcomingImportantDates.slice(0, ITEMS_LIMIT)).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onImportantDateClick?.(event)}
                    >
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.event_date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.event_date)}
                        </p>
                      )}
                      {event.daysUntil !== undefined && (
                        <p className="text-xs text-muted-foreground ml-auto">
                          {getDdayText(event.daysUntil)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {upcomingImportantDates.length > ITEMS_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => setShowAllImportantDates(!showAllImportantDates)}
                  >
                    {showAllImportantDates ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        더보기 ({upcomingImportantDates.length - ITEMS_LIMIT}건)
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodoList;
