import { requireManager } from "@/lib/rbac";
import { getAccentColor } from "@/lib/theme";
import { AccentPicker } from "@/components/admin/accent-picker";

export default async function AdminConfigPage() {
  await requireManager();
  const accent = await getAccentColor();

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h2 className="font-semibold text-[var(--text)]">Accent color</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Sets the app-wide accent used for buttons, links and highlights.</p>
        <div className="mt-4">
          <AccentPicker current={accent} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-[var(--text)]">Plan statuses & categories</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Each person manages their own statuses and category tags now — open{" "}
          <span className="font-medium text-[var(--text)]">My Plan → Table settings</span> to edit yours. As a manager, you can
          also edit a teammate&apos;s from their page under <span className="font-medium text-[var(--text)]">Team</span>.
        </p>
      </section>
    </div>
  );
}
