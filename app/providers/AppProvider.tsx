"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  username: string;
  persona_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type AppContextType = {
  user: User | null;
  profile: Profile | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("SESSION ERROR:", sessionError);
      setLoading(false);
      return;
    }

    if (!session) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const currentUser = session.user;
    setUser(currentUser);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE FETCH ERROR:", profileError);
    }

    if (!profileData) {
      const baseName = generateRandomBase(currentUser.email || "user");

      const newProfile: Profile = {
        id: currentUser.id,
        username: baseName,
        persona_name: baseName,
        bio: "",
        avatar_url:
          "https://api.dicebear.com/7.x/initials/svg?seed=" +
          currentUser.id,
      };

      const { error: insertError } = await supabase
        .from("profiles")
        .upsert(newProfile);

      if (insertError) {
        console.error("PROFILE CREATION ERROR:", insertError);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, profile, loading, refresh }}>
      {children}
    </AppContext.Provider>
  );
}