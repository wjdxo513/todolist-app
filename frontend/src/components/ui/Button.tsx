import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'accent' | 'danger';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
  size?: 'md' | 'sm';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const cls = [styles.button, styles[variant], size === 'sm' && styles.sm, className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={cls} {...rest} />;
}
