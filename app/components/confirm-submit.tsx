"use client";

export function ConfirmSubmit({
  action,
  label,
  confirm,
}: {
  action: () => Promise<void>;
  label: string;
  confirm: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="h-11 rounded-lg border border-red-600/40 px-4 text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        {label}
      </button>
    </form>
  );
}
