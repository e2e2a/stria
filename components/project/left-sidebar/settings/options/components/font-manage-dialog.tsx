import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, GripVertical, CheckCircle2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface FontManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  initialFonts: string[];
  onSave: (fonts: string[]) => void;
}

export const SUPPORTED_GOOGLE_FONTS = [
  'Algerian',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Source Sans 3',
  'Work Sans',
  'Fira Sans',
  'Rubik',
  'Ubuntu',
  'Quicksand',
  'Mulish',
  'PT Sans',
  'DM Sans',
  'Manrope',
  'IBM Plex Sans',
  'Karla',
  'Josefin Sans',

  'Merriweather',
  'Playfair Display',
  'Lora',
  'PT Serif',
  'Noto Serif',
  'Crimson Text',
  'EB Garamond',
  'Libre Baskerville',
  'Bitter',
  'Spectral',
  'Source Serif 4',
  'Cormorant Garamond',
  'Zilla Slab',
  'Arvo',
  'Roboto Slab',
  'Domine',

  'Fira Code',
  'Source Code Pro',
  'JetBrains Mono',
  'Roboto Mono',
  'Inconsolata',
  'Space Mono',
  'IBM Plex Mono',
  'Ubuntu Mono',
  'PT Mono',
  'Anonymous Pro',
  'Courier Prime',
  'Overpass Mono',
  'Share Tech Mono',
  'VT323',
  'Cutive Mono',
].sort();

export const FontManageDialog = ({ isOpen, onClose, title, description, initialFonts, onSave }: FontManageDialogProps) => {
  const [fonts, setFonts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFonts(initialFonts);
      setInputValue('');
      setIsFocused(false);
    }
  }, [isOpen, initialFonts]);

  const submitFont = (fontName: string) => {
    const trimmed = fontName.trim();
    if (trimmed && !fonts.includes(trimmed)) {
      setFonts([...fonts, trimmed]);
      setInputValue('');
      setIsFocused(false);
    }
  };

  const handleAddFont = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !fonts.includes(trimmed)) {
      setFonts([...fonts, trimmed]);
      setInputValue('');
      setIsFocused(false);
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
    <Dialog modal={true} open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground z-60 shadow-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
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

          <form onSubmit={handleAddFont} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Command className="border border-border rounded-md overflow-visible bg-background">
                <CommandInput
                  placeholder="Enter font name..."
                  value={inputValue}
                  onValueChange={setInputValue}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFont();
                    if (e.key === 'Escape' || e.key === 'Tab') setIsFocused(false); // ADDED: keyboard fallback
                  }}
                />

                {isFocused && (
                  <div className="absolute top-full left-0 w-full z-50 mt-1 bg-popover rounded-md shadow-md border border-border">
                    <CommandList className="max-h-40 overflow-y-auto overflow-x-hidden ">
                      <CommandEmpty className="p-2 text-xs text-muted-foreground">Press Enter or click Add...</CommandEmpty>
                      <CommandGroup>
                        {SUPPORTED_GOOGLE_FONTS.map(font => (
                          <CommandItem key={font} value={font} onSelect={submitFont} className="cursor-pointer">
                            <span style={{ fontFamily: font }}>{font}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </div>
                )}
              </Command>
            </div>
            <Button type="submit" variant="secondary" disabled={!inputValue.trim()}>
              Add
            </Button>
          </form>
        </div>

        <DialogFooter className="gap-2">
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
