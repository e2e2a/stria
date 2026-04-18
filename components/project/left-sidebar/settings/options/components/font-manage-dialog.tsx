import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, GripVertical, CheckCircle2 } from 'lucide-react';

interface FontManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  initialFonts: string[];
  onSave: (fonts: string[]) => void;
}

// A generic list of common fonts to populate the dropdown suggestions
const COMMON_FONTS = [
  'Inter',
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Impact',
  'Noto Serif',
  'Roboto',
  'Source Code Pro',
  'Times New Roman',
  'Trebuchet MS',
];

export const FontManageDialog = ({ isOpen, onClose, title, description, initialFonts, onSave }: FontManageDialogProps) => {
  const [fonts, setFonts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Reset local state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFonts(initialFonts);
      setInputValue('');
    }
  }, [isOpen, initialFonts]);

  const handleAddFont = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !fonts.includes(trimmed)) {
      setFonts([...fonts, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveFont = (fontToRemove: string) => {
    setFonts(fonts.filter(f => f !== fontToRemove));
  };

  const handleSave = () => {
    onSave(fonts);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground z-60">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2 text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Font List */}
          {fonts.length > 0 ? (
            <div className="space-y-2 border-b border-border pb-4">
              {fonts.map((font, index) => (
                <div key={font} className="flex items-center justify-between group">
                  <span className="text-sm" style={{ fontFamily: font }}>
                    {font}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {index === 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <button onClick={() => handleRemoveFont(font)} className="hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 cursor-grab" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic border-b border-border pb-4">No custom font is applied right now. Add one below.</div>
          )}

          {/* Add Font Input */}
          <form onSubmit={handleAddFont} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter font name..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                list="common-fonts" // Links to the datalist below
                className="bg-background"
              />
              <datalist id="common-fonts">
                {COMMON_FONTS.map(font => (
                  <option key={font} value={font} />
                ))}
              </datalist>
            </div>
            <Button type="submit" variant="secondary" disabled={!inputValue.trim()}>
              Add
            </Button>
          </form>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
