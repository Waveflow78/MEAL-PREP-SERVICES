import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-charcoal">{label}</label>}
    <input
      ref={ref}
      {...props}
      className={`w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2 text-sm text-charcoal placeholder-muted outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${error ? 'border-terracotta' : ''} ${className}`}
    />
    {error && <span className="text-xs text-terracotta">{error}</span>}
  </div>
))
Input.displayName = 'Input'
export default Input
