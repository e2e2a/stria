import { EditorTypographyProvider } from '@/components/provider/editor-typography-provider';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-y-hidden">
      <EditorTypographyProvider />
      {children}
    </div>
  );
}
