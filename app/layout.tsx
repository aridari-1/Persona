"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checkedAuth, setCheckedAuth] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const publicRoutes = ["/", "/login", "/signup"];

      if (!session && !publicRoutes.includes(pathname)) {
        window.location.href = "/login";
        return;
      }

      setCheckedAuth(true);
    };

    checkUser();
  }, [pathname]);

  const hideNav =
    pathname === "/" || pathname === "/login" || pathname === "/signup";

  return (
    <html>
      <body className="bg-black text-white min-h-screen flex flex-col">

        {/* Show loader INSIDE body, not replacing html */}
        {!checkedAuth ? (
          <div className="flex-1 flex items-center justify-center">
            Loading...
          </div>
        ) : (
          <>
            {!hideNav && <TopBar />}
            <main className="flex-1 pb-16">{children}</main>
            {!hideNav && <BottomNav />}
          </>
        )}

      </body>
    </html>
  );
}