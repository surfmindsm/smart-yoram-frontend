import React from 'react';
import { DeleteConfirmModal as DeleteConfirmModalType } from '../../types/chat';
import { ConfirmDialog } from '../ui';

interface DeleteConfirmModalProps {
  modal: DeleteConfirmModalType;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  deleteProgress?: { current: number; total: number; currentTitle: string };
}

/**
 * DeleteConfirmModal - 채팅 삭제 확인 다이얼로그
 *
 * ConfirmDialog 공통 컴포넌트를 사용하여 리팩토링되었습니다.
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  modal,
  onClose,
  onConfirm,
  isDeleting = false,
  deleteProgress
}) => {
  return (
    <ConfirmDialog
      open={modal.isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="채팅을 삭제하시겠습니까?"
      description={
        <>
          <p className="text-gray-600 mb-2">
            "{modal.chatTitle}" 채팅이 영구적으로 삭제됩니다.
          </p>
          <p className="text-sm text-gray-500">
            {isDeleting ? '삭제 중입니다... 잠시만 기다려주세요.' : '이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?'}
          </p>
        </>
      }
      variant="destructive"
      confirmText="삭제"
      onConfirm={onConfirm}
      loading={isDeleting}
      showProgress={true}
      progress={deleteProgress}
    />
  );
};

export default DeleteConfirmModal;
