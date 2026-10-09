import { cookies } from "next/headers";
import { Nav } from "@/components/nav";
import { AppShell } from "@/components/app-shell";
import { InstallBanner } from "@/components/install-app";
import { FeedbackProvider } from "@/components/ui/feedback";
import { requireUser } from "@/lib/rbac";
import { getMyProjects } from "@/lib/data/todos";
import { getActiveUsers } from "@/lib/data/lookups";
import { getOverdueTodoCount } from "@/lib/data/dashboard";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [cookieStore, projects, users, overdueCount] = await Promise.all([
    cookies(),
    getMyProjects(user.id),
    getActiveUsers(),
    getOverdueTodoCount(user.id),
  ]);
  const sidebarCollapsed = cookieStore.get("sidebar")?.value === "collapsed";
  const allUsers = users.filter((u) => u.id !== user.id).map((u) => ({ id: u.id, name: u.name }));

  return (
    <FeedbackProvider>
      <AppShell role={user.role} projects={projects} allUsers={allUsers}>
        <div className="flex min-h-screen w-full flex-col md:flex-row">
          <Nav
            user={{ name: user.name, username: user.username, role: user.role }}
            initialCollapsed={sidebarCollapsed}
            overdueCount={overdueCount}
          />
          <main className="flex-1 min-w-0">
            {/* Bottom padding on phones clears the tab bar and the + button. */}
            <div className="w-full px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:py-8">
              <InstallBanner />
              {children}
            </div>
          </main>
        </div>
      </AppShell>
    </FeedbackProvider>
  );
}
