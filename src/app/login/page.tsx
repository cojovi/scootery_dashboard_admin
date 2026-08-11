import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
          Scootery
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-[var(--navy)]">
          Menu Admin
        </h1>
        <p className="mt-2 text-sm text-black/55">
          Sign in to manage the TV signage menu.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
