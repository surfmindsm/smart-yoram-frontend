import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex flex-col justify-start items-start gap-1 ${className}`} ref={selectRef}>
      {/* 선택된 값 표시 */}
      <div
        className={`flex flex-col justify-start items-start gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleToggle}
      >
        <div className="h-9 px-3 py-2 bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 inline-flex justify-start items-center gap-2 overflow-hidden hover:outline-gray-400 transition-colors min-w-[120px]">
          <div className={`flex-1 justify-start text-sm font-normal font-['Pretendard'] leading-tight whitespace-nowrap ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {displayText}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="p-1 bg-white rounded-lg shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.10)] shadow-md outline outline-1 outline-offset-[-1px] outline-gray-200 flex flex-col justify-start items-end z-50 absolute top-full mt-1 min-w-full">
          <div className="w-full p-1 flex flex-col justify-start items-start">
            {options.map((option) => (
              <div
                key={option.value}
                className="w-full px-2 py-1.5 rounded-sm inline-flex justify-start items-center gap-2 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleOptionClick(option.value)}
              >
                <div className={`flex-1 justify-start text-sm font-medium font-['Pretendard'] leading-none whitespace-nowrap ${
                  option.value === value ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {option.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;