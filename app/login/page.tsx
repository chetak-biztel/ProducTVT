import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className="mb-3 grid h-12 w-12 place-items-center rounded-2xl text-xl font-bold text-[var(--accent-fg)]"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow)" }}
          >
            V
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">Welcome to ProducTVT</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to plan your week and run projects.</p>
        </div>

        <div className="card p-6" style={{ boxShadow: "var(--shadow)" }}>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-faint)]">
          Accounts are created by your admin. Contact them if you can&apos;t sign in.
        </p>
      </div>
    </div>
  );
}
