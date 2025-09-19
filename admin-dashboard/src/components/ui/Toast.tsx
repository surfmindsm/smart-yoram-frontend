import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast as ToastType, useToast } from '../../contexts/ToastContext';

interface ToastItemProps {
  toast: ToastType;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 애니메이션을 위해 약간의 지연 후 표시
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // 애니메이션 완료 후 제거
    setTimeout(() => removeToast(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        min-w-64 max-w-md w-auto ${getBackgroundColor()} border rounded-lg shadow-lg p-4
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {toast.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};