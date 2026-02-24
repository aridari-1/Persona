import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import Gate from "./gate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Centered App Container */}
      <div className="max-w-md mx-auto relative">

        {/* Fixed Top */}
        <div className="fixed top-0 w-full max-w-md z-50">
          <TopBar />
        </div>

        {/* Scrollable Content */}
        <div className="pt-16 pb-20">
          <Gate>{children}</Gate>
        </div>

        {/* Fixed Bottom */}
        <div className="fixed bottom-0 w-full max-w-md z-50">
          <BottomNav />
        </div>

      </div>
    </div>
  );
}