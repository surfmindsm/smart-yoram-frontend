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
    <Card className={className}>
      <CardHeader>
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
      <CardContent>
        {onlineCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">현재 접속 중인 사용자가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {onlineUsers.map((user, index) => (
              <div
                key={`${user.user_id}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
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
    </Card>
  );
};

export default OnlineUsers;
