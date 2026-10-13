"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action-state";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const PendingContext = createContext<{ pending: boolean; submitter: string | null }>({ pending: false, submitter: null });

/**
 * Form bound to a Server Action, with inline Bengali feedback.
 * With JavaScript, it submits inside a transition so a failed validation does NOT clear what the
 * organizer typed (React would otherwise reset the form). Without JavaScript it still works as a
 * regular form post.
 */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirmMessage,
  messageClassName = "",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirmMessage?: string;
  messageClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [submitter, setSubmitter] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <PendingContext.Provider value={{ pending, submitter }}>
      <form
        ref={ref}
        action={formAction}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          const native = e.nativeEvent as SubmitEvent;
          const button = native.submitter as HTMLButtonElement | null;
          const data = new FormData(e.currentTarget, button);
          setSubmitter(button ? `${button.name}=${button.value}` : null);
          startTransition(() => formAction(data));
        }}
      >
        {children}
        <FormMessage state={state} className={messageClassName} />
      </form>
    </PendingContext.Provider>
  );
}

export function FormMessage({ state, className = "" }: { state: ActionState; className?: string }) {
  return (
    <div aria-live="polite" className={className}>
      {state && (
        <p
          key={state.ts}
          role={state.ok ? "status" : "alert"}
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-green-light text-green-deep" : "bg-red-bg text-red-ink"}`}
        >
          {state.ok ? <CheckCircle2 aria-hidden size={16} className="mt-0.5 shrink-0" /> : <AlertCircle aria-hidden size={16} className="mt-0.5 shrink-0" />}
          {state.message}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  name,
  value,
  pendingLabel = "অপেক্ষা করুন…",
}: {
  children: ReactNode;
  className?: string;
  name?: string;
  value?: string;
  pendingLabel?: string;
}) {
  const { pending, submitter } = useContext(PendingContext);
  const mine = pending && (submitter === null || !name || submitter === `${name}=${value ?? ""}`);
  return (
    <button type="submit" name={name} value={value} className={className} disabled={pending} aria-busy={mine}>
      {mine ? (
        <>
          <Loader2 aria-hidden size={16} className="animate-spin" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
