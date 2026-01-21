import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseAuthService } from '../services/supabaseAuthService';

export interface PresenceUser {
  user_id: string;
  user_name: string;
  church_id?: number;
  online_at: string;
}

export const usePresence = (channelName: string = 'online-users') => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserChurchId, setCurrentUserChurchId] = useState<number | null>(null);

  // Presence 상태 동기화 핸들러
  const handlePresenceSync = useCallback((channelInstance: RealtimeChannel) => {
    const state = channelInstance.presenceState();
    const users: PresenceUser[] = [];

    // presenceState는 { [key: string]: PresenceUser[] } 형태
    Object.values(state).forEach((presences: any) => {
      presences.forEach((presence: PresenceUser) => {
        users.push(presence);
      });
    });

    // 현재 사용자의 교회 ID와 동일한 사용자만 필터링
    const filteredUsers = currentUserChurchId
      ? users.filter(user => user.church_id === currentUserChurchId)
      : users;

    setOnlineUsers(filteredUsers);
  }, [currentUserChurchId]);

  // Presence 채널 초기화
  useEffect(() => {
    let channelInstance: RealtimeChannel | null = null;
    let isSubscribed = false;

    const initPresence = async () => {
      try {
        // 현재 사용자 정보 가져오기
        const currentUser = await supabaseAuthService.getCurrentUser();

        if (!currentUser?.user) {
          console.log('사용자 정보가 없어 Presence를 초기화하지 않습니다.');
          return;
        }

        // 현재 사용자의 교회 ID 저장
        setCurrentUserChurchId(currentUser.user.church_id || null);

        // Realtime 채널 생성
        channelInstance = supabase.channel(channelName, {
          config: {
            presence: {
              key: currentUser.user.id.toString(),
            },
          },
        });

        // Presence 이벤트 리스너 등록
        channelInstance
          .on('presence', { event: 'sync' }, () => {
            if (channelInstance) {
              handlePresenceSync(channelInstance);
            }
          })
          .on('presence', { event: 'join' }, () => {
            if (channelInstance) {
              handlePresenceSync(channelInstance);
            }
          })
          .on('presence', { event: 'leave' }, () => {
            if (channelInstance) {
              handlePresenceSync(channelInstance);
            }
          });

        // 채널 구독 및 자신의 presence 전송
        const status = await channelInstance.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // 자신의 presence 상태 전송
            await channelInstance?.track({
              user_id: currentUser.user.id.toString(),
              user_name: currentUser.user.name || currentUser.user.email || '알 수 없음',
              church_id: currentUser.user.church_id,
              online_at: new Date().toISOString(),
            });

            setIsConnected(true);
            isSubscribed = true;
          }
        });

        setChannel(channelInstance);
      } catch (error) {
        console.error('Presence 초기화 오류:', error);
      }
    };

    initPresence();

    // 정리 함수
    return () => {
      if (channelInstance && isSubscribed) {
        channelInstance.untrack();
        channelInstance.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [channelName, handlePresenceSync]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isConnected,
    channel,
  };
};
