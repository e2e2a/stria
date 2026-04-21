import { cn } from '@/lib/utils';

export default function SettingRow({
  title,
  description,
  children,
  isLast = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={cn('py-4 flex items-center justify-between', !isLast && 'border-b border-border/50')}>
      <div className="pr-8">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
