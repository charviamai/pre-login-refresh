import React from 'react';

interface ArcadeBuzzerButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

export const ArcadeBuzzerButton: React.FC<ArcadeBuzzerButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`gaming-controller-btn-wrapper ${className}`}>
      {/* Animated border glow */}
      <div className="controller-border-glow"></div>
      
      {/* The actual button */}
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="gaming-controller-btn"
      >
        {/* Controller shape made with CSS */}
        <span className="controller-body">
          {/* Left handle */}
          <span className="controller-handle controller-handle-left"></span>
          {/* Center */}
          <span className="controller-center">
            <span className="controller-text">{children}</span>
          </span>
          {/* Right handle */}
          <span className="controller-handle controller-handle-right"></span>
        </span>
        
        {/* Inner glow effect */}
        <span className="controller-glow"></span>
      </button>
      
      {/* Floating particles */}
      <div className="controller-particles">
        <span className="ctrl-particle ctrl-particle-1">✨</span>
        <span className="ctrl-particle ctrl-particle-2">⚡</span>
        <span className="ctrl-particle ctrl-particle-3">✨</span>
        <span className="ctrl-particle ctrl-particle-4">🎮</span>
      </div>
    </div>
  );
};

export default ArcadeBuzzerButton;
