import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">BusinessBuddy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Find better local business opportunities before the day gets noisy.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          The dashboard and auth flows are coming next. This foundation keeps the app shell ready for them.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Dashboard
          </Link>
          <Link
            href="/auth"
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-300"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
