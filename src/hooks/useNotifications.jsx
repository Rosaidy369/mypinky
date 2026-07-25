import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { session } = useAuth();
  const userId = session?.user?.id || null;

  const [badges, setBadges] = useState({ messages: false, matches: false, likes: false });

  const refresh = useCallback(async () => {
    if (!userId) {
      setBadges({ messages: false, matches: false, likes: false });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_matches, notify_messages, notify_likes")
      .eq("id", userId)
      .single();

    let { data: views } = await supabase
      .from("notification_views")
      .select("matches_viewed_at, likes_seen_count")
      .eq("user_id", userId)
      .maybeSingle();

    if (!views) {
      const { data: inserted } = await supabase
        .from("notification_views")
        .insert({ user_id: userId })
        .select()
        .maybeSingle();
      views = inserted || { matches_viewed_at: new Date().toISOString(), likes_seen_count: 0 };
    }

    let hasUnreadMessages = false;
    if (profile?.notify_messages !== false) {
      const { data: myMatches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_id.eq.${userId},matched_profile_id.eq.${userId}`);

      const matchIds = (myMatches || []).map((m) => m.id);

      if (matchIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("match_id", matchIds)
          .is("read_at", null)
          .neq("sender_id", userId);

        hasUnreadMessages = (count || 0) > 0;
      }
    }

    let hasNewMatches = false;
    if (profile?.notify_matches !== false) {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user_id.eq.${userId},matched_profile_id.eq.${userId}`)
        .gt("matched_at", views.matches_viewed_at);

      hasNewMatches = (count || 0) > 0;
    }

    let hasNewLikes = false;
    if (profile?.notify_likes) {
      const { count } = await supabase
        .from("swipes")
        .select("id", { count: "exact", head: true })
        .eq("swiped_profile_id", userId)
        .in("direction", ["like", "superlike"]);

      hasNewLikes = (count || 0) > (views.likes_seen_count || 0);
    }

    setBadges({ messages: hasUnreadMessages, matches: hasNewMatches, likes: hasNewLikes });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Broad, unfiltered subscriptions (Realtime can't filter by "either
  // column equals my id"), so any insert/update on these tables just
  // re-runs the same lightweight count queries above.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "swipes" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const markMatchesViewed = useCallback(async () => {
    if (!userId) return;
    setBadges((prev) => ({ ...prev, matches: false }));
    await supabase
      .from("notification_views")
      .upsert({ user_id: userId, matches_viewed_at: new Date().toISOString() }, { onConflict: "user_id" });
  }, [userId]);

  const markLikesViewed = useCallback(async () => {
    if (!userId) return;

    const { count } = await supabase
      .from("swipes")
      .select("id", { count: "exact", head: true })
      .eq("swiped_profile_id", userId)
      .in("direction", ["like", "superlike"]);

    setBadges((prev) => ({ ...prev, likes: false }));
    await supabase
      .from("notification_views")
      .upsert({ user_id: userId, likes_seen_count: count || 0 }, { onConflict: "user_id" });
  }, [userId]);

  const markMessagesReadForMatch = useCallback(async (matchId) => {
    if (!userId || !matchId) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .is("read_at", null)
      .neq("sender_id", userId);

    refresh();
  }, [userId, refresh]);

  return (
    <NotificationsContext.Provider
      value={{ badges, refresh, markMatchesViewed, markLikesViewed, markMessagesReadForMatch }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
