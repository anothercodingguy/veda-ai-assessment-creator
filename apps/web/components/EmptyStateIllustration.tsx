import { Search, X } from "lucide-react";

export function EmptyStateIllustration() {
  return (
    <div className="empty-illustration" aria-hidden="true">
      <div className="empty-circle" />
      <div className="paper-shape">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="lens">
        <Search size={120} strokeWidth={1.8} />
      </div>
      <div className="cross">
        <X size={70} strokeWidth={6} />
      </div>
      <div className="chip chip-one" />
      <div className="chip chip-two" />
      <div className="spark spark-one">✦</div>
    </div>
  );
}
