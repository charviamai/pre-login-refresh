import React from 'react';

interface VoltageButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

export const VoltageButton: React.FC<VoltageButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`voltage-button ${className}`}>
      <button type={type} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    </div>
  );
};

export default VoltageButton;
