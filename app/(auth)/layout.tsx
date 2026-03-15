export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>

    </div>
  );
}