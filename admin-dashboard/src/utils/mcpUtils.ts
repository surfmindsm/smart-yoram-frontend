import { ChatMessage } from '../types/chat';

// 데이터베이스 조회 결과 타입
export interface DatabaseQueryResult {
  success: boolean;
  data: any[];
  error?: string;
}

// 에이전트가 사용할 수 있는 테이블 목록
export const AVAILABLE_TABLES = {
  members: 'users',
  families: 'families', 
  family_relationships: 'family_relationships',
  announcements: 'announcements',
  worship_services: 'worship_services',
  attendance_records: 'attendance_records',
  pastoral_visits: 'pastoral_visits',
  prayer_requests: 'prayer_requests',
  calendar_events: 'calendar_events'
} as const;

// MCP 도구들의 타입 선언
declare global {
  interface Window {
    mcp0_execute_sql: (params: { project_id: string; query: string; params?: any[] }) => Promise<any>;
    mcp0_apply_migration: (params: { project_id: string; name: string; query: string }) => Promise<any>;
  }
}

/**
 * MCP를 통한 메시지 저장
 */
export const saveMessageViaMCP = async (
  chatHistoryId: string, 
  content: string, 
  role: 'user' | 'assistant', 
  tokensUsed?: number
) => {
  try {
    console.log('💾 MCP로 메시지 저장:', { chatHistoryId, role, content: content.substring(0, 50) + '...' });
    
    const query = 'INSERT INTO chat_messages (chat_history_id, content, role, tokens_used, created_at) VALUES ($1, $2, $3, $4, NOW())';
    const params = [chatHistoryId, content, role, tokensUsed || null];
    
    console.log('🔍 MCP SQL 실행:', { query, params });

    // Supabase Edge Function을 통한 메시지 저장
    try {
      const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          chatHistoryId,
          content,
          role,
          tokensUsed
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ MCP 메시지 저장 성공:', result);
        return { success: true };
      } else {
        console.warn('⚠️ MCP 백엔드 API 오류:', response.status);
        return { success: false };
      }
    } catch (mcpError) {
      console.warn('⚠️ MCP 백엔드 API 호출 실패:', mcpError);
      return { success: false };
    }
    
    return { success: false };
  } catch (error) {
    console.warn('❌ MCP 메시지 저장 전체 실패:', error);
    return { success: false };
  }
};

/**
 * MCP를 통한 메시지 조회
 */
export const loadMessagesViaMCP = async (
  chatHistoryId: string, 
  fallbackMessages: ChatMessage[] = []
): Promise<ChatMessage[]> => {
  try {
    console.log('📚 MCP로 메시지 조회:', chatHistoryId);
    
    const query = 'SELECT id, content, role, tokens_used, created_at FROM chat_messages WHERE chat_history_id = $1 ORDER BY created_at ASC';
    const params = [chatHistoryId];
    
    console.log('🔍 MCP SQL 실행:', { query, params });

    // 🔥 실제 Supabase MCP 서버를 통한 DB 조회 
    try {
      // 백엔드 API를 통해 MCP 호출 (서버사이드에서 MCP 실행)
      const response = await fetch('/api/v1/mcp/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistoryId: chatHistoryId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ MCP 조회 성공:', result);
        
        if (result.messages && Array.isArray(result.messages)) {
          // DB 결과를 ChatMessage 형식으로 변환
          const messages: ChatMessage[] = result.messages.map((row: any) => ({
            id: row.id || `msg-${Date.now()}`,
            content: row.content,
            role: row.role as 'user' | 'assistant',
            timestamp: new Date(row.created_at),
            tokensUsed: row.tokens_used
          }));
          
          console.log('📚 MCP 히스토리 변환 완료:', messages.length, '개 메시지');
          return messages;
        }
      } else {
        console.warn('⚠️ MCP 백엔드 API 응답 오류:', response.status);
      }
    } catch (mcpError) {
      console.warn('⚠️ MCP 백엔드 API 호출 실패, 직접 호출 시도:', mcpError);
    }

    // 폴백: 직접 백엔드 MCP API 호출 시도
    try {
      console.log('🔄 직접 백엔드 MCP API 호출 시도...');
      
      const response = await fetch('/api/v1/mcp/load-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistoryId,
          project_id: 'adzhdsajdamrflvybhxq'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.messages && Array.isArray(result.messages)) {
          const messages: ChatMessage[] = result.messages.map((row: any) => ({
            id: row.id || `msg-${Date.now()}`,
            content: row.content,
            role: row.role as 'user' | 'assistant',
            timestamp: new Date(row.created_at),
            tokensUsed: row.tokens_used
          }));
          
          console.log('✅ 직접 MCP API 호출 성공:', messages.length, '개 메시지');
          return messages;
        }
      }
    } catch (directMcpError) {
      console.warn('⚠️ 직접 MCP API 호출도 실패:', directMcpError);
    }
    
    // MCP 실패 시 폴백으로 현재 세션 메시지 사용
    console.log('🔄 폴백 메시지 사용:', fallbackMessages.length, '개');
    return fallbackMessages;
    
  } catch (error) {
    console.warn('❌ MCP 메시지 조회 전체 실패:', error);
    
    // 🔄 임시 해결책: fallbackMessages가 비어있으면 현재 대화 시도
    if (fallbackMessages.length === 0) {
      console.log('🔍 대화 캐시에서 히스토리 검색 시도...');
      // 현재는 빈 배열 반환하여 현재 세션 메시지 사용하도록 함
      return [];
    }
    
    return fallbackMessages;
  }
};

/**
 * MCP를 통한 스마트 데이터베이스 조회
 * 사용자 질문을 분석해서 적절한 테이블들을 조회하고 결과를 반환
 */
export const queryDatabaseViaMCP = async (
  userQuestion: string,
  churchId: number = 1
): Promise<DatabaseQueryResult> => {
  try {
    console.log('🔍 스마트 DB 조회 시작:', userQuestion);
    
    // 질문 분석 및 쿼리 생성
    const queryInfo = analyzeQuestionAndBuildQuery(userQuestion, churchId);
    
    if (!queryInfo.query) {
      return {
        success: false,
        data: [],
        error: '질문을 분석할 수 없습니다.'
      };
    }
    
    console.log('📝 생성된 쿼리:', queryInfo.query);
    
    // Supabase Edge Function을 통한 스마트 DB 쿼리
    const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/query-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify({
        question: userQuestion,
        agentType: 'smart-assistant'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ DB 조회 결과:', result);
    
    return {
      success: true,
      data: Array.isArray(result) ? result : [result],
      error: undefined
    };
    
  } catch (error) {
    console.error('❌ MCP DB 조회 실패:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : '데이터베이스 조회 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 사용자 질문을 분석해서 적절한 SQL 쿼리 생성
 */
function analyzeQuestionAndBuildQuery(question: string, churchId: number): { query: string; tables: string[] } {
  const lowerQuestion = question.toLowerCase();
  const koreanQuestion = question;
  
  // 생일 관련 질문
  if (lowerQuestion.includes('생일') || lowerQuestion.includes('birthday') || lowerQuestion.includes('8월')) {
    const month = extractMonth(question);
    let query = `
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.birth_date,
        u.position,
        u.department,
        EXTRACT(MONTH FROM u.birth_date) as birth_month,
        EXTRACT(DAY FROM u.birth_date) as birth_day
      FROM users u 
      WHERE u.church_id = ${churchId}
    `;
    
    if (month) {
      query += ` AND EXTRACT(MONTH FROM u.birth_date) = ${month}`;
    }
    
    query += ` ORDER BY EXTRACT(MONTH FROM u.birth_date), EXTRACT(DAY FROM u.birth_date)`;
    
    return { query, tables: ['users'] };
  }
  
  // 가족 관계 질문
  if (lowerQuestion.includes('가족') || lowerQuestion.includes('family') || koreanQuestion.includes('관계')) {
    const query = `
      SELECT 
        u1.name as member_name,
        u2.name as related_member_name,
        fr.relationship_type,
        f.family_name,
        u1.phone as member_phone,
        u2.phone as related_phone
      FROM families f
      JOIN users u1 ON f.id = u1.family_id
      JOIN family_relationships fr ON u1.id = fr.member_id
      JOIN users u2 ON fr.related_member_id = u2.id
      WHERE f.church_id = ${churchId}
      ORDER BY f.family_name, u1.name
    `;
    
    return { query, tables: ['families', 'users', 'family_relationships'] };
  }
  
  // 출석 관련 질문
  if (lowerQuestion.includes('출석') || lowerQuestion.includes('attendance')) {
    const query = `
      SELECT 
        u.name,
        ws.service_name,
        ar.attendance_date,
        ar.status,
        COUNT(*) OVER (PARTITION BY u.id) as total_attendance
      FROM attendance_records ar
      JOIN users u ON ar.member_id = u.id
      JOIN worship_services ws ON ar.worship_service_id = ws.id
      WHERE u.church_id = ${churchId}
      ORDER BY ar.attendance_date DESC
      LIMIT 100
    `;
    
    return { query, tables: ['attendance_records', 'users', 'worship_services'] };
  }
  
  // 공지사항 관련 질문
  if (lowerQuestion.includes('공지') || lowerQuestion.includes('announcement') || lowerQuestion.includes('알림')) {
    const query = `
      SELECT 
        title,
        content,
        category,
        subcategory,
        created_at,
        is_urgent,
        target_audience
      FROM announcements 
      WHERE church_id = ${churchId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    return { query, tables: ['announcements'] };
  }
  
  // 심방 관련 질문
  if (lowerQuestion.includes('심방') || lowerQuestion.includes('pastoral') || lowerQuestion.includes('방문')) {
    const query = `
      SELECT 
        pv.requester_name,
        pv.requester_phone,
        pv.visit_type,
        pv.request_content,
        pv.status,
        pv.priority,
        pv.preferred_date,
        pv.created_at
      FROM pastoral_visits pv
      WHERE pv.church_id = ${churchId}
      ORDER BY pv.created_at DESC
      LIMIT 50
    `;
    
    return { query, tables: ['pastoral_visits'] };
  }
  
  // 기도 요청 관련 질문
  if (lowerQuestion.includes('기도') || lowerQuestion.includes('prayer')) {
    const query = `
      SELECT 
        pr.requester_name,
        pr.prayer_type,
        pr.prayer_content,
        pr.is_urgent,
        pr.status,
        pr.prayer_count,
        pr.created_at
      FROM prayer_requests pr
      WHERE pr.church_id = ${churchId} AND pr.is_public = true
      ORDER BY pr.created_at DESC
      LIMIT 30
    `;
    
    return { query, tables: ['prayer_requests'] };
  }
  
  // 일반적인 교인 정보 질문
  if (lowerQuestion.includes('교인') || lowerQuestion.includes('성도') || lowerQuestion.includes('member')) {
    const query = `
      SELECT 
        u.name,
        u.phone,
        u.email,
        u.birth_date,
        u.position,
        u.department,
        u.join_date,
        f.family_name
      FROM users u
      LEFT JOIN families f ON u.family_id = f.id
      WHERE u.church_id = ${churchId}
      ORDER BY u.name
      LIMIT 100
    `;
    
    return { query, tables: ['users', 'families'] };
  }
  
  // 기본 교인 정보 조회
  return {
    query: `
      SELECT 
        u.name,
        u.phone,
        u.position,
        u.department
      FROM users u
      WHERE u.church_id = ${churchId}
      ORDER BY u.name
      LIMIT 50
    `,
    tables: ['users']
  };
}

/**
 * 질문에서 월 정보 추출
 */
function extractMonth(question: string): number | null {
  const monthRegex = /(\d+)월/;
  const match = question.match(monthRegex);
  if (match) {
    const month = parseInt(match[1]);
    return month >= 1 && month <= 12 ? month : null;
  }
  
  const englishMonths = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
  };
  
  const lowerQuestion = question.toLowerCase();
  for (const [monthName, monthNum] of Object.entries(englishMonths)) {
    if (lowerQuestion.includes(monthName)) {
      return monthNum;
    }
  }
  
  return null;
}
