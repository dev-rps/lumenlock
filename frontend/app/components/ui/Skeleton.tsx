/**
 * Skeleton — Shimmer placeholder block.
 * Use width/height or className to size it. Composes with `skeleton` CSS class.
 */
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', style, width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
