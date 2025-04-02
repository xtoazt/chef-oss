"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { toast } from "./hooks/use-toast";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((_error) => {
            let toastTitle: string;
            toastTitle =
              flow === "signIn"
                ? "Could not sign in, did you mean to sign up?"
                : "Could not sign up, did you mean to sign in?";
            toast({ title: toastTitle, variant: "destructive" });
            setSubmitting(false);
          });
        }}
      >
        <Input className="input-field" type="email" name="email" placeholder="Email" required />
        <Input className="input-field" type="password" name="password" placeholder="Password" required />
        <Button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </Button>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </span>
        </div>

        <Button variant="outline" onClick={() => signIn("anonymous")}>
          Sign in anonymously
        </Button>
      </form>
    </div>
  );
}
