import { TagDefinition } from '../../types';

interface TagBadgeProps {
  tag: TagDefinition;
  className?: string;
  isDragging?: boolean;
  compact?: boolean;
}

function getContrastColor(hexcolor: string) {
  let hex = hexcolor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

export function TagBadge({ tag, className = '', isDragging = false, compact = false }: TagBadgeProps) {
  const abbreviation = tag.label.substring(0, 2).toUpperCase();
  const sizeClass = compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  return (
    <div
      className={`flex-none flex items-center justify-center ${sizeClass} rounded border border-border font-bold shadow-sm ${isDragging ? 'opacity-50 ring-2 ring-primary relative' : ''} ${className}`}
      style={{ 
        backgroundColor: tag.color,
        color: getContrastColor(tag.color)
      }}
      title={tag.label}
    >
      {abbreviation}
    </div>
  );
}
