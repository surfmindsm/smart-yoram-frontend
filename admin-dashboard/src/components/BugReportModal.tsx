import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { bugReportAPI } from '../api/bug-reports-api';
import { ISSUE_TYPES } from '../types/bug-reports';
import { useToast } from '../hooks/use-toast';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [issueType, setIssueType] = useState('question');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: '내용을 입력해주세요',
        description: '문의 내용을 입력해야 합니다',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await bugReportAPI.create({
        issue_type: issueType,
        description: description.trim(),
      });

      toast({
        title: '문의가 전달되었습니다',
        description: '소중한 의견 감사합니다. 빠른 시일 내에 검토하겠습니다.',
      });

      // 폼 초기화
      setIssueType('question');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('문의하기 제출 실패:', error);
      toast({
        title: '문의 전달 실패',
        description: '문의 전달 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            문의하기
          </DialogTitle>
          <DialogDescription>
            버그 리포트, 기능 개선 요청, 사용 문의 등을 전달해주세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 문의 유형 */}
          <div className="space-y-2">
            <Label htmlFor="issue_type">문의 유형</Label>
            <select
              id="issue_type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ISSUE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 문의 내용 */}
          <div className="space-y-2">
            <Label htmlFor="description">문의 내용</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문의하실 내용을 자세히 작성해주세요"
              className="min-h-[150px] resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length} / 2000
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">안내사항</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>전달하신 문의는 관리자가 검토합니다</li>
                  <li>처리 상황은 별도로 공유되지 않습니다</li>
                  <li>긴급한 문의는 고객센터로 연락 부탁드립니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? '전달 중...' : '문의 전달'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportModal;
