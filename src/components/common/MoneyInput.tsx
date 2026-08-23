import React, { useState, useEffect } from 'react';
import { formatMoney, parseMoney } from '../../utils/formatters';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onValueChange: (val: number) => void;
  className?: string;
  prefix?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onValueChange,
  className = '',
  prefix = '$',
  disabled,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (!isFocused) {
      const num = typeof value === 'number' ? value : parseMoney(value);
      setDisplayValue(formatMoney(num));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const num = parseMoney(value);
    setDisplayValue(num === 0 ? '' : num.toString());
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const num = parseMoney(displayValue);
    onValueChange(num);
    setDisplayValue(formatMoney(num));
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayValue(val);
    const num = parseMoney(val);
    onValueChange(num);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-gray-500 font-semibold select-none text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full py-2 ${prefix ? 'pl-7' : 'pl-3'} pr-3 border border-gray-300 rounded focus:outline-none focus:border-ragucci-gold focus:ring-1 focus:ring-ragucci-gold disabled:bg-gray-100 disabled:cursor-not-allowed font-fustat text-sm font-medium transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
