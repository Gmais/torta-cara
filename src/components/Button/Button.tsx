import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  const btnClass = `${styles.button} ${variant === 'secondary' ? styles.secondary : ''} ${props.disabled ? styles.disabled : ''} ${className || ''}`;
  
  return (
    <button className={btnClass} {...props}>
      {children}
    </button>
  );
}
