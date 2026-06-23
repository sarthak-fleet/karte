import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
} from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Shared field styles — applied to Input, Textarea, Select. No permanent
// border (the white-tinted outlines read busy on dark surfaces). Inputs
// sit as a slightly darker "well" inside the card, focus reveals the
// accent ring only.
const fieldClass =
  'w-full rounded-xl bg-white/[0.045] px-3.5 py-2.5 text-[14px] leading-[1.4] text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35 disabled:cursor-not-allowed disabled:opacity-50';

// ─── Atoms ──────────────────────────────────────────────────────────────────

export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClass, 'leading-[1.55]', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  ComponentPropsWithoutRef<'select'>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      fieldClass,
      'appearance-none pr-9 bg-no-repeat bg-[right_0.85rem_center]',
      className,
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M3 5L6 8L9 5' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const baseButton =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-[var(--karte-ease)] outline-none focus-visible:ring-2 focus-visible:ring-karte-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-karte-bg disabled:cursor-not-allowed disabled:opacity-50';

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-4 py-2 text-[13px]',
  lg: 'px-6 py-3 text-[15px]',
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-karte-text text-karte-bg hover:bg-white',
  secondary:
    'border border-karte-border-strong bg-transparent text-karte-text hover:border-karte-border-emphasis hover:bg-white/[0.04]',
  ghost: 'text-karte-text-3 hover:text-karte-text',
  danger:
    'border border-red-500/25 bg-red-500/[0.06] text-red-300 hover:border-red-500/40 hover:bg-red-500/10',
};

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        baseButton,
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

// ── Toggle ──────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  className,
  disabled,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-[var(--karte-ease)] outline-none focus-visible:ring-2 focus-visible:ring-karte-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-karte-bg disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-karte-accent/85' : 'bg-white/[0.08]',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--karte-ease)]',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  removeLabel?: string;
}

export function Badge({
  children,
  className,
  onRemove,
  removeLabel,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-karte-border-strong bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-karte-text-2',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-karte-text-4 transition-colors duration-150 hover:text-red-400"
          aria-label={removeLabel}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// ── Label ───────────────────────────────────────────────────────────────────

interface LabelProps extends ComponentPropsWithoutRef<'label'> {
  children: ReactNode;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[12px] font-medium tracking-[-0.005em] text-karte-text-2',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

// ─── Molecules ──────────────────────────────────────────────────────────────

// ── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function Card({ children, className, bordered = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.025] p-6',
        bordered && 'border border-karte-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── FormField ───────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {description && (
        <p className="mb-2 text-[12px] leading-[1.5] text-karte-text-4">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
