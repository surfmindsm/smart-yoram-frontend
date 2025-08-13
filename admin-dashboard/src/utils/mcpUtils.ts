import { ChatMessage } from '../types/chat';

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
    
    // 실제 MCP execute_sql 도구 사용 (임시로 로깅만)
    // 실제 구현에서는 서버사이드에서 MCP 호출해야 함
    console.log('MCP SQL 실행 예정:', {
      query: 'INSERT INTO chat_messages (chat_history_id, content, role, tokens_used) VALUES ($1, $2, $3, $4)',
      params: [chatHistoryId, content, role, tokensUsed || null]
    });
    
    return { success: true };
  } catch (error) {
    console.warn('MCP 메시지 저장 실패:', error);
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
    
    // 실제 MCP execute_sql 도구 사용 (임시로 현재 메시지 반환)
    // 실제 구현에서는 서버사이드에서 MCP 호출해야 함
    console.log('MCP SQL 실행 예정:', {
      query: 'SELECT id, content, role, tokens_used, created_at FROM chat_messages WHERE chat_history_id = $1 ORDER BY created_at ASC',
      params: [chatHistoryId]
    });
    
    // 현재는 로컬 상태의 메시지 반환 (MCP 구현 완료 시 실제 DB 조회로 변경)
    return fallbackMessages;
  } catch (error) {
    console.warn('MCP 메시지 조회 실패:', error);
    return [];
  }
};
