const variants = {
  primary: 'bg-signal text-white hover:bg-signal-dark',
  secondary: 'bg-white text-ink border border-border hover:bg-[#F5F7FB]',
  danger: 'bg-danger text-white hover:bg-red-600',
  ghost: 'text-signal hover:bg-signal-light',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-[13px]',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
