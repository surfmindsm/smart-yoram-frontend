import React from 'react';
import { DeleteConfirmModal as DeleteConfirmModalType } from '../../types/chat';

interface DeleteConfirmModalProps {
  modal: DeleteConfirmModalType;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  modal,
  onClose,
  onConfirm,
  isDeleting = false
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
          {isDeleting ? '삭제 중입니다... 잠시만 기다려주세요.' : '이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?'}
        </p>
        
        {isDeleting && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDeleting 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2 ${
              isDeleting 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
