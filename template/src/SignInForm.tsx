"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <Input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <Input
          className="input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <Button className="auth-button" type="submit">
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <span
            className="link-text"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>

        <Button variant="outline" onClick={() => signIn("anonymous")}>
          Sign in anonymously
        </Button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
