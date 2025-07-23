// packages/core/src/components/Button/index.tsx
import React, { ReactNode } from 'react';
import './Button.scss';

/**
 * @interface ButtonProps
 * @description 通用按钮组件的属性
 */
interface ButtonProps {
  /**
   * @property {ReactNode} children - 按钮中显示的内容
   */
  children: ReactNode;
  /**
   * @property {() => void} onClick - 点击事件处理函数
   */
  onClick: () => void;
  /**
   * @property {boolean} [disabled=false] - 是否禁用按钮
   */
  disabled?: boolean;
  /**
   * @property {string} [className=''] - 自定义CSS类名
   */
  className?: string;
}

/**
 * @component Button
 * @description 一个通用的、可复用的按钮组件
 */
const Button = ({ children, onClick, disabled = false, className = '' }: ButtonProps) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      className={`button ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
