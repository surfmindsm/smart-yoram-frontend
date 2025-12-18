import React, { useState } from 'react';
import { FormDialog, Button, Input, Label, Alert, AlertDescription } from "./ui";
import { Eye, EyeOff } from 'lucide-react';
import { supabaseAuthService } from '../services/supabaseAuthService';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isTemporaryPassword?: boolean;
}

/**
 * PasswordChangeModal - 비밀번호 변경 다이얼로그
 *
 * FormDialog 공통 컴포넌트를 사용하여 리팩토링되었습니다.
 */
const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isTemporaryPassword = false
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await supabaseAuthService.updatePassword(newPassword);
      onSuccess();
      resetForm();
    } catch (err: any) {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = (open: boolean) => {
    if (!open && !isTemporaryPassword) {
      resetForm();
      onClose();
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={isTemporaryPassword ? '비밀번호 변경 필수' : '비밀번호 변경'}
      description={
        isTemporaryPassword
          ? '보안을 위해 임시 비밀번호를 새로운 비밀번호로 변경해주세요.'
          : '새로운 비밀번호를 설정하세요.'
      }
      onSubmit={handleSubmit}
      submitText="비밀번호 변경"
      loading={loading}
      hideCancel={isTemporaryPassword}
      size="md"
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 현재 비밀번호 (임시 비밀번호가 아닌 경우에만 표시) */}
      {!isTemporaryPassword && (
        <div className="space-y-2">
          <Label htmlFor="current-password">현재 비밀번호</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              required
              placeholder="현재 비밀번호를 입력하세요"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 새 비밀번호 */}
      <div className="space-y-2">
        <Label htmlFor="new-password">새 비밀번호</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            required
            placeholder="새 비밀번호를 입력하세요 (최소 6자리)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 새 비밀번호 확인 */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            placeholder="새 비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </FormDialog>
  );
};

export default PasswordChangeModal;