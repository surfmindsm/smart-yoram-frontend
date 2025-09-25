import React from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Switch,
  Checkbox,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
} from './index'

export function ShadcnExample() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shadcn UI Components 테스트</CardTitle>
          <CardDescription>
            새로 생성된 shadcn 스타일 컴포넌트들을 테스트해보세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="이름을 입력하세요" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">역할</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="역할을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="member">회원</SelectItem>
                <SelectItem value="guest">게스트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea id="description" placeholder="설명을 입력하세요" />
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">약관에 동의합니다</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">알림 받기</Label>
          </div>

          <div className="flex space-x-2">
            <Badge>기본</Badge>
            <Badge variant="secondary">보조</Badge>
            <Badge variant="destructive">위험</Badge>
            <Badge variant="outline">외곽선</Badge>
          </div>

          <Alert>
            <AlertTitle>알림</AlertTitle>
            <AlertDescription>
              이것은 알림 메시지 예제입니다.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="space-x-2">
          <Button>저장</Button>
          <Button variant="outline">취소</Button>
          <Button variant="destructive">삭제</Button>
        </CardFooter>
      </Card>
    </div>
  )
}