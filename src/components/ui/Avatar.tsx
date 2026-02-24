type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name: string;
  color: string;
  size?: AvatarSize;
  className?: string;
};

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'h-6 w-6', text: 'text-xs' },
  md: { container: 'h-8 w-8', text: 'text-sm' },
  lg: { container: 'h-10 w-10', text: 'text-base' },
};

/** Returns the first character of the name for the avatar initial */
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function Avatar({ name, color, size = 'md', className = '' }: AvatarProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-medium text-white ${styles.container} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      <span className={styles.text}>{getInitial(name)}</span>
    </div>
  );
}
