export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="max-w-md mx-auto">{children}</div>
    </div>
  );
}