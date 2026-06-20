export default function ChatBackgroundMock() {
  return (
    <div className="absolute inset-0 bg-zinc-950 flex flex-col overflow-hidden select-none pointer-events-none filter blur-[4px] opacity-40">
      {/* Header Mock */}
      <div className="p-4 sm:p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20 shrink-0">
        <div className="w-32 h-6 bg-zinc-800 rounded-md" />
        <div className="w-24 h-6 bg-zinc-800 rounded-md" />
        <div className="w-8 h-8 bg-zinc-800 rounded-full" />
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="flex items-start gap-3 max-w-[70%]">
          <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="w-20 h-3 bg-zinc-800 rounded" />
            <div className="w-48 h-10 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-[70%] ml-auto flex-row-reverse">
          <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0" />
          <div className="space-y-2 flex flex-col items-end">
            <div className="w-16 h-3 bg-zinc-800 rounded" />
            <div className="w-64 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-[70%]">
          <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="w-24 h-3 bg-zinc-800 rounded" />
            <div className="w-36 h-10 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          </div>
        </div>
      </div>
      <div className="p-4 bg-zinc-900/10 border-t border-zinc-900">
        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
