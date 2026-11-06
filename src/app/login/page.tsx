import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-screen">
      <section className="login-copy">
        <p className="wordmark">makehappn.</p>
        <h1 className="display">Emotionally-driven experiences.</h1>
        <p>Designed for brands, people, and culture. This is the work behind them.</p>
        <ul className="login-roles">
          <li><strong>Owner</strong> sets the people, the crews, and each experience.</li>
          <li><strong>Team leader</strong> assigns their crew and watches what gets done.</li>
          <li><strong>Member</strong> moves only their own cards. Every status change needs a reason.</li>
        </ul>
        <p className="login-note">Details · Process · Execution · Reveal</p>
      </section>
      <section className="login-panel">
        <LoginForm />
      </section>
    </main>
  );
}
