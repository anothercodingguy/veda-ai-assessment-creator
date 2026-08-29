import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "./AppShell";

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
  active: "home" | "assignments" | "toolkit" | "library" | "groups";
};

export function PlaceholderPage({ title, subtitle, active }: PlaceholderPageProps) {
  return (
    <AppShell title={title} subtitle={subtitle} active={active} backHref="/">
      <section className="placeholder-panel">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <Link className="primary-pill" href="/assignments/new">
          <Plus size={18} />
          Create Assignment
        </Link>
      </section>
    </AppShell>
  );
}
