'use client';

type BadgeVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const dotColors: Record<BadgeVariant, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

// 서류 상태 뱃지 매핑
type DocumentStatus = 'draft' | 'sent' | 'confirmed' | 'cancelled';

const statusConfig: Record<DocumentStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: '초안', variant: 'gray' },
  sent: { label: '발송됨', variant: 'blue' },
  confirmed: { label: '확인됨', variant: 'green' },
  cancelled: { label: '취소됨', variant: 'red' },
};

// 서류 유형 뱃지 매핑
type DocumentType = 'estimate' | 'order' | 'invoice' | 'receipt' | 'contract';

const typeConfig: Record<DocumentType, { label: string; variant: BadgeVariant }> = {
  estimate: { label: '견적서', variant: 'blue' },
  order: { label: '발주서', variant: 'indigo' },
  invoice: { label: '세금계산서', variant: 'purple' },
  receipt: { label: '거래명세서', variant: 'green' },
  contract: { label: '계약서', variant: 'yellow' },
};

export default function Badge({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// 서류 상태 뱃지 헬퍼
export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status];
  if (!config) return null;
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// 서류 유형 뱃지 헬퍼
export function TypeBadge({ type }: { type: DocumentType }) {
  const config = typeConfig[type];
  if (!config) return null;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
