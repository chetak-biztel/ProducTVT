import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Nav user={{ name: user.name, username: user.username, role: user.role }} />
      <main className="flex-1 min-w-0">
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
