import { requireUser } from "@/lib/rbac";

export default async function DayPage() {
  await requireUser();
  // The tracker is its own page (public/day-tracker.html) so its styles stay out of the app's;
  // it follows the app theme and talks to /api/day with the same sign-in cookie.
  return (
    <div>
      <iframe
        src="/day-tracker.html"
        title="Day Tracker"
        allow="fullscreen"
        className="h-[calc(100dvh-11rem)] min-h-[32rem] w-full border-0 md:h-[calc(100dvh-4rem)]"
      />
    </div>
  );
}
