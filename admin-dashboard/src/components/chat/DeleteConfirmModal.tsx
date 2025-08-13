import React from 'react';
import { DeleteConfirmModal as DeleteConfirmModalType } from '../../types/chat';

interface DeleteConfirmModalProps {
  modal: DeleteConfirmModalType;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  modal,
  onClose,
  onConfirm
}) => {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          채팅을 삭제하시겠습니까?
        </h3>
        <p className="text-gray-600 mb-2">
          "{modal.chatTitle}" 채팅이 영구적으로 삭제됩니다.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
