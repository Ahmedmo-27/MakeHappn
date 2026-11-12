import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-copy">
        <div className="login-top">
          <Link href="/" className="wordmark">
            makehappn<span className="dot">.</span>
          </Link>
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
        <LoginForm />
      </section>
    </main>
  );
}
