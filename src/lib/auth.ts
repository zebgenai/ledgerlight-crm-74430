import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "manager";

export const signUp = async (email: string, password: string, metadata?: { name: string; username: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: metadata,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  // If there's no session to sign out from, treat it as success
  if (error?.message === "Auth session missing!") {
    return { error: null };
  }
  return { error };
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role as UserRole;
};
