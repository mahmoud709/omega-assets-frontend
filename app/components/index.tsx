import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 border-b pb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h2 className={`text-xl font-bold text-gray-800 ${className}`}>{children}</h2>;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={className}>{children}</div>;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead className="bg-gray-100 border-b-2 border-gray-300">{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  dir?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = '', dir, onClick }: TableRowProps) {
  return <tr dir={dir} onClick={onClick} className={`border-b border-gray-200 hover:bg-gray-50 ${className}`}>{children}</tr>;
}

interface TableCellProps {
  children?: ReactNode;
  header?: boolean;
  className?: string;
  colSpan?: number;
  dir?: string;
}

export function TableCell({ children, header = false, className = '', colSpan, dir }: TableCellProps) {
  const cellClass = header
    ? 'px-6 py-3 text-right text-sm font-semibold text-gray-700'
    : 'px-6 py-3 text-right text-sm text-gray-700';
  if (header) return <th dir={dir} colSpan={colSpan} className={`${cellClass} ${className}`}>{children}</th>;
  return <td dir={dir} colSpan={colSpan} className={`${cellClass} ${className}`}>{children}</td>;
}

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'جاري التحميل...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 w-full">
      <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center">
        <div className="animate-spin mb-6">
          <div className="h-12 w-12 border-4 border-slate-100 border-t-blue-600 rounded-full" />
        </div>
        <span className="text-slate-700 font-bold text-lg animate-pulse">{message}</span>
      </div>
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export function Error({ message, onRetry }: ErrorProps) {
  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="font-semibold">Error</p>
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
