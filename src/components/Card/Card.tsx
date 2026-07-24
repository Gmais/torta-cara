import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style, ...props }: CardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`} style={style} {...props}>
      {children}
    </div>
  );
}
