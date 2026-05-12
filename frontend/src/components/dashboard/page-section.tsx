export function PageSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full space-y-8">
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] px-3 py-1 bg-[var(--accent)]/10 rounded-full">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
      <div className="pt-2">
        {children}
      </div>
    </section>
  );
}
