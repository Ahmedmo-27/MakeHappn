"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, null);

  return (
    <form action={action} className="login-card">
      <div className="form-header">
        <p className="kicker">Sign in</p>
        <h2 className="display" style={{ margin: 0, fontSize: "2.3rem", lineHeight: 0.95 }}>
          Welcome <br />back.
        </h2>
      </div>
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" autoComplete="username" placeholder="you@makehappen.local" required />
      </label>
      <label className="field">
        <span>Password</span>
        <PasswordInput autoComplete="current-password" required />
      </label>
      {state?.error ? <p className="banner banner-error" style={{ margin: 0 }}>{state.error}</p> : null}
      <SubmitButton>
        Enter the studio <span className="arrow" aria-hidden="true">→</span>
      </SubmitButton>
    </form>
  );
}
