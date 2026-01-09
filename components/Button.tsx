
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 tracking-wider active:scale-95";
  const variants = {
    primary: "bg-[#C04851] text-white hover:bg-[#A63C44] shadow-[0_10px_20px_-10px_rgba(192,72,81,0.5)]",
    secondary: "bg-[#C5A059] text-white hover:bg-[#B38D4A] shadow-[0_10px_20px_-10px_rgba(197,160,89,0.5)]",
    outline: "border-[1.5px] border-[#C04851] text-[#C04851] hover:bg-[#C04851] hover:text-white",
    ghost: "text-gray-400 hover:text-[#C04851] hover:bg-gray-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
