export default function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-sidebar border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-border bg-accent/20">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}
