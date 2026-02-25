export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center overflow-hidden">

      {/* Centered Container */}
      <div className="w-full max-w-md px-6 pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>

    </div>
  );
}