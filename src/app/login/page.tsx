import Link from "next/link";
import { Suspense } from "react";
import { Sticker } from "@/components/brand/sticker";
import { LoginForm } from "@/components/login-form";
import { Wordmark } from "@/components/wordmark";

export const metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="login-screen">
      <section className="login-copy">
        <Sticker name="badge-thumbs" className="sticker-plate login-sticker login-sticker-badge" />
        <Sticker name="spark" className="sticker-plate login-sticker login-sticker-spark" />
        <div className="login-top">
          <Wordmark href="/" />
          <Link href="/" className="login-back">← Back to studio</Link>
        </div>

        <div>
          <p className="kicker">Studio operating system</p>
          <h1 className="login-headline">
            Where ideas <br />
            get <em>made.</em>
          </h1>
        </div>

        <div className="stack" style={{ gap: "1.4rem" }}>
          <ul className="login-roles">
            <li><strong>Owner</strong>Sets the people, the lanes and every project.</li>
            <li><strong>Project lead</strong>Runs the plan, the gates and the money.</li>
            <li><strong>Crew</strong>Moves their own work. Every change has a reason.</li>
          </ul>
          <p className="login-note">Brief · Design · Production · Communication</p>
        </div>
      </section>
      <section className="login-panel">
        <Suspense fallback={<LoginForm />}>
          <LoginPanel searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

async function LoginPanel({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.error === "string" ? params.error : "";
  const initialError =
    code === "Configuration"
      ? "Sign-in is not configured. AUTH_SECRET is missing on the server."
      : code
        ? "Invalid email or password"
        : undefined;
  return <LoginForm initialError={initialError} />;
}
