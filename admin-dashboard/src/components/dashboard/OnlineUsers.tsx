import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Users, Circle } from 'lucide-react';
import { usePresence, PresenceUser } from '../../hooks/usePresence';
import { Badge } from '../ui';

interface OnlineUsersProps {
  className?: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ className }) => {
  const { onlineUsers, onlineCount, isConnected } = usePresence('church-online-users');

  return (
    <Card className={`${className} border-muted h-full flex flex-col`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            실시간 접속자
          </CardTitle>
          <div className="flex items-center gap-2">
            <Circle
              className={`h-2 w-2 ${
                isConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
              }`}
            />
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              {onlineCount}명 온라인
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {onlineCount === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">현재 접속 중인 사용자가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {onlineUsers.map((user, index) => (
              <div
                key={`${user.user_id}-${index}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary-600" />
                    </div>
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.online_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      접속
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  활성
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </Card>
  );
};

export default OnlineUsers;
