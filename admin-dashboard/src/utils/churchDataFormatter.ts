// 교회 데이터를 사용자 친화적으로 포맷팅하는 유틸리티

export function formatChurchData(data: any[]): string {
  if (!data || data.length === 0) {
    return '조회된 데이터가 없습니다.';
  }

  try {
    // 데이터 타입별 포맷팅
    const formattedSections: string[] = [];

    data.forEach((item, index) => {
      // 헌금 데이터 포맷팅
      if (item.donation_type || item.total_amount || item.donor_name || item.amount) {
        if (item.message) {
          // 요약 메시지가 있는 경우
          formattedSections.push(`📊 **헌금 현황**\n${item.message}`);
        } else if (item.total_amount !== undefined) {
          // 월별 헌금 요약
          const formatted = `📊 **${item.donation_type || '헌금'}**
💰 총액: ${formatCurrency(item.total_amount)}원
📝 건수: ${item.donation_count || 0}건
📈 평균: ${formatCurrency(item.avg_amount || 0)}원`;
          formattedSections.push(formatted);
        } else {
          // 개별 헌금 내역
          const formatted = `💸 **개별 헌금**
👤 이름: ${item.donor_name || '익명'}
💰 금액: ${formatCurrency(item.amount)}원
🏷️ 종류: ${item.donation_type || '일반헌금'}
📅 날짜: ${formatDate(item.created_at)}
${item.memo ? `📝 메모: ${item.memo}` : ''}`;
          formattedSections.push(formatted);
        }
      }
      // 교인 정보 포맷팅
      else if (item.name && (item.phone || item.email || item.position)) {
        const formatted = `👤 **${item.name}**
📞 연락처: ${item.phone || '미등록'}
📧 이메일: ${item.email || '미등록'}
🏷️ 직분: ${item.position || '성도'}
🏠 부서: ${item.department || '미지정'}
${item.birth_date ? `🎂 생일: ${formatDate(item.birth_date)}` : ''}`;
        formattedSections.push(formatted);
      }
      // 출석 정보 포맷팅
      else if (item.attendance_date || item.service_name) {
        const formatted = `📅 **출석 기록**
👤 이름: ${item.name || '알 수 없음'}
⛪ 예배: ${item.service_name || ''}
📅 날짜: ${formatDate(item.attendance_date)}
✅ 상태: ${formatAttendanceStatus(item.status)}`;
        formattedSections.push(formatted);
      }
      // 공지사항 포맷팅
      else if (item.title || item.content) {
        const formatted = `📢 **${item.title || '공지사항'}**
📝 내용: ${truncateText(item.content, 100)}
🏷️ 분류: ${item.category || '일반'}
📅 작성일: ${formatDate(item.created_at)}
${item.is_urgent ? '🚨 **긴급**' : ''}`;
        formattedSections.push(formatted);
      }
      // 심방 정보 포맷팅
      else if (item.requester_name || item.visit_type) {
        const formatted = `🏠 **심방 요청**
👤 요청자: ${item.requester_name || '익명'}
📞 연락처: ${item.requester_phone || '미등록'}
🏷️ 유형: ${item.visit_type || '일반심방'}
📝 내용: ${truncateText(item.request_content, 80)}
📊 상태: ${item.status || '대기중'}
⭐ 우선순위: ${item.priority || '보통'}
📅 희망일: ${formatDate(item.preferred_date)}`;
        formattedSections.push(formatted);
      }
      // 기도 요청 포맷팅
      else if (item.prayer_content || item.prayer_type) {
        const formatted = `🙏 **기도 요청**
👤 요청자: ${item.requester_name || '익명'}
🏷️ 유형: ${item.prayer_type || '일반기도'}
📝 내용: ${truncateText(item.prayer_content, 100)}
📊 상태: ${item.status || '활성'}
🔢 기도수: ${item.prayer_count || 0}번
📅 요청일: ${formatDate(item.created_at)}
${item.is_urgent ? '🚨 **긴급**' : ''}`;
        formattedSections.push(formatted);
      }
      // 가족 관계 포맷팅
      else if (item.member_name && item.related_member_name) {
        const formatted = `👨‍👩‍👧‍👦 **가족 관계**
👤 ${item.member_name} ↔️ ${item.related_member_name}
🏷️ 관계: ${item.relationship_type || '가족'}
🏠 가정명: ${item.family_name || ''}
📞 연락처: ${item.member_phone || ''} / ${item.related_phone || ''}`;
        formattedSections.push(formatted);
      }
      // 생일 정보 포맷팅
      else if (item.birth_date && item.birth_month) {
        const formatted = `🎂 **생일 정보**
👤 이름: ${item.name || '알 수 없음'}
📅 생일: ${item.birth_month}월 ${item.birth_day}일
📞 연락처: ${item.phone || '미등록'}
🏷️직분: ${item.position || '성도'}
🏠 부서: ${item.department || '미지정'}`;
        formattedSections.push(formatted);
      }
      // 일반 메시지 포맷팅
      else if (item.message) {
        formattedSections.push(`ℹ️ ${item.message}`);
      }
      // 기타 데이터의 경우 JSON 형태로 표시
      else {
        const keys = Object.keys(item);
        if (keys.length > 0) {
          const formatted = keys.map(key => 
            `**${translateKey(key)}**: ${item[key]}`
          ).join('\n');
          formattedSections.push(`📊 **데이터 ${index + 1}**\n${formatted}`);
        }
      }
    });

    if (formattedSections.length === 0) {
      return '데이터를 표시할 수 없습니다.';
    }

    return formattedSections.join('\n\n---\n\n');
  } catch (error) {
    console.error('데이터 포맷팅 오류:', error);
    return '데이터 처리 중 오류가 발생했습니다.';
  }
}

// 통화 포맷팅 (천 단위 쉼표)
function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') return '0';
  return amount.toLocaleString('ko-KR');
}

// 날짜 포맷팅
function formatDate(dateString: string | Date | null): string {
  if (!dateString) return '미등록';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '잘못된 날짜';
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  } catch {
    return '날짜 오류';
  }
}

// 출석 상태 포맷팅
function formatAttendanceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'present': '✅ 출석',
    'absent': '❌ 결석',
    'late': '⏰ 지각',
    'early_leave': '🚪 조퇴'
  };
  
  return statusMap[status] || status || '알 수 없음';
}

// 텍스트 자르기
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 키 번역
function translateKey(key: string): string {
  const translations: Record<string, string> = {
    'name': '이름',
    'phone': '연락처', 
    'email': '이메일',
    'position': '직분',
    'department': '부서',
    'birth_date': '생일',
    'created_at': '등록일',
    'amount': '금액',
    'donation_type': '헌금종류',
    'donor_name': '헌금자',
    'memo': '메모',
    'status': '상태',
    'title': '제목',
    'content': '내용',
    'category': '분류',
    'is_urgent': '긴급여부',
    'requester_name': '요청자',
    'visit_type': '방문유형',
    'prayer_content': '기도내용',
    'prayer_type': '기도유형'
  };
  
  return translations[key] || key;
}

// ESM 모듈 표시
export default formatChurchData;