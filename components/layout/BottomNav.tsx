// BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User } from "lucide-react";

export default function BottomNav({
  onReselectActiveTab,
}: {
  onReselectActiveTab?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + "/");

  const handleClick = (targetPrefix: string) => {
    if (isActive(targetPrefix)) {
      onReselectActiveTab?.();
    }
  };

  const itemClass = (active: boolean) =>
    [
      "flex flex-1 items-center justify-center h-14",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
      active ? "text-white" : "text-gray-500 hover:text-gray-300",
    ].join(" ");

  return (
    <nav aria-label="Navigation principale" className="bg-[#0f0f0f]">
      <div className="flex">
        <Link
          href="/feed"
          aria-current={isActive("/feed") ? "page" : undefined}
          className={itemClass(isActive("/feed"))}
          onClick={() => handleClick("/feed")}
        >
          <Home size={22} strokeWidth={1.5} />
          <span className="sr-only">Accueil</span>
        </Link>

        <Link
          href="/search"
          aria-current={isActive("/search") ? "page" : undefined}
          className={itemClass(isActive("/search"))}
          onClick={() => handleClick("/search")}
        >
          <Search size={22} strokeWidth={1.5} />
          <span className="sr-only">Recherche</span>
        </Link>

        <Link
          href="/create"
          aria-current={isActive("/create") ? "page" : undefined}
          className={itemClass(isActive("/create")) + " text-white"}
          onClick={() => handleClick("/create")}
        >
          <Plus size={26} strokeWidth={1.8} />
          <span className="sr-only">Créer</span>
        </Link>

        <Link
          href="/profile/me"
          aria-current={isActive("/profile") ? "page" : undefined}
          className={itemClass(isActive("/profile"))}
          onClick={() => handleClick("/profile")}
        >
          <User size={22} strokeWidth={1.5} />
          <span className="sr-only">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
