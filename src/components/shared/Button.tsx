import Link from 'next/link';
import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-brand-gold text-brand-brown hover:bg-[#e5c985] border border-brand-gold/30',
  secondary:
    'bg-transparent text-brand-cream border border-brand-cream/40 hover:bg-brand-cream/10',
  ghost: 'bg-transparent text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/10',
};

export default function Button({
  href,
  onClick,
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center px-8 py-3.5 text-sm tracking-[0.2em] uppercase font-body transition-all duration-500 rounded-sm disabled:opacity-45 disabled:cursor-not-allowed';

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
