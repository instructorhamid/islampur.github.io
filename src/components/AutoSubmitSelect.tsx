"use client";

import type { SelectHTMLAttributes } from "react";

/** A <select> that submits its GET form on change (the form still has a submit button without JS). */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        const form = e.currentTarget.form;
        const page = form?.querySelector<HTMLInputElement>('input[name="page"]');
        if (page) page.value = "1";
        form?.requestSubmit();
      }}
    />
  );
}
