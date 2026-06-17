import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-xl p-6 transition-all duration-200 bg-cs-card border border-cs-border', className)}>{children}</div>;
}
