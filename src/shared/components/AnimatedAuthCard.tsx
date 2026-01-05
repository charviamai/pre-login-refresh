import React from 'react';

interface AnimatedAuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedAuthCard: React.FC<AnimatedAuthCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`animated-auth-card ${className}`}>
      {/* Background content area */}
      <div className="bg">
        {children}
      </div>
    </div>
  );
};
