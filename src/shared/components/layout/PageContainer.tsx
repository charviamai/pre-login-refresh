import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'full',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`container-custom ${maxWidthClasses[maxWidth]} mx-auto py-6`}>
      {children}
    </div>
  );
};
