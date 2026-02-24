"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AppContextType = {
  user: any;
  profile: any;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppContextType>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
});

export function useApp() {
  return useContext(AppContext);
}

function generateRandomBase(email: string) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
}

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const currentUser = session.user;
    setUser(currentUser);

    // ✅ Use maybeSingle to avoid 406
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    // 🔥 If no profile → auto create
    if (!profileData) {
      const baseName = generateRandomBase(currentUser.email || "user");

      const newProfile = {
        id: currentUser.id,
        persona_name: baseName,
        username: baseName,
        bio: "",
        avatar_url:
          "https://api.dicebear.com/7.x/initials/svg?seed=" +
          currentUser.id,
      };

      const { error } = await supabase
        .from("profiles")
        .insert(newProfile);

      if (error) {
        console.error("PROFILE CREATION ERROR:", error);
        setLoading(false);
        return;
      }

      setProfile(newProfile);
    } else {
      setProfile(profileData);
    }

    setLoading(false);
  };

  useEffect(() => {
    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, profile, loading, refresh }}>
      {children}
    </AppContext.Provider>
  );
}