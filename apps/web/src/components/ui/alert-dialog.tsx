import type { AlertDialogProps } from "@repo/types";
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Continue",
  cancelText = "Cancel",
}: AlertDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">

      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl m-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors font-medium text-sm border border-red-500/20 hover:border-red-500/50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
