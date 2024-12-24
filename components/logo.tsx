import React from 'react';
interface LogoProps {
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false }) => {
  if (collapsed) {
    return (
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
        H
      </div>
    );
  }

  return (
    <div className="text-xl font-bold">
      Hawkhire
    </div>
  );
} 