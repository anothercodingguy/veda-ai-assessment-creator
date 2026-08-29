export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span>V</span>
      </span>
      {!compact && <span className="brand-name">VedaAI</span>}
    </div>
  );
}
