"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, null);

  return (
    <form action={action} className="login-card panel">
      <div>
        <p className="kicker">Sign in</p>
        <h2 className="display" style={{ margin: 0, fontSize: "2rem" }}>Welcome back</h2>
      </div>
      <label className="field">
        <span>Email</span>
        <input className="input" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error ? <p className="banner banner-error">{state.error}</p> : null}
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
