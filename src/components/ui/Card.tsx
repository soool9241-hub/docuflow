'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  title?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      hover = false,
      title,
      headerAction,
      footer,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl border border-gray-200 shadow-sm ${
          hover
            ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5'
            : ''
        } ${!title && !footer ? paddingStyles[padding] : ''} ${className}`}
        {...props}
      >
        {title && (
          <div
            className={`flex items-center justify-between px-6 py-4 border-b border-gray-100`}
          >
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}

        <div className={title || footer ? paddingStyles[padding] || 'p-6' : ''}>
          {children}
        </div>

        {footer && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
