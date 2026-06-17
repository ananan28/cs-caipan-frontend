import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
    <input ref={ref} className={clsx('w-full bg-cs-card border border-cs-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200', error && 'border-red-500 focus:border-red-500', className)} {...props} />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
));
