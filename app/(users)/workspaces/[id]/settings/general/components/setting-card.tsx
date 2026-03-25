import { Pencil } from 'lucide-react';
import React, { ReactNode } from 'react';

interface SettingCardProps {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
  badge?: ReactNode;
}

export const SettingCard = ({ title, children, onEdit, badge }: SettingCardProps) => (
  <div className="bg-transparent border-2 border-border rounded-2xl px-6 py-12 relative group drop-shadow-2xl shadow-sm hover:bg-secondary/10 transition-all duration-200">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-foreground font-medium text-sm sm:text-lg md:text-xl tracking-tight">{title}</h3>
        {badge}
      </div>

      {onEdit && (
        <button onClick={onEdit} className="p-1.5 opacity-0 group-hover:opacity-100 bg-accent/20 rounded-sm hover:bg-accent transition-all" type="button">
          <Pencil size={14} className="text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>

    <div className="text-muted-foreground text-xs sm:text-sm">{children}</div>
  </div>
);
