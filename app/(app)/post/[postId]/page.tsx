"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import LikeButton from "@/components/posts/LikeButton";

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface Post {
  id: string;
  caption: string | null;
  like_count: number;
  created_at: string;
  profiles: Profile | Profile[] | null;
  post_media: {
    output_path: string;
  }[];
}

function normalizeProfile(profile: unknown): Profile | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return (profile[0] as Profile) || null;
  return profile as Profile;
}

export default function PostViewer() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchPost();
  }, []);

  async function fetchPost() {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (user) {
      setCurrentUserId(user.id);
    }

    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        caption,
        like_count,
        created_at,
        profiles:profiles!posts_user_id_fkey (
          username,
          avatar_url
        ),
        post_media (
          output_path
        )
      `)
      .eq("id", postId)
      .single();

    if (data) {
      setPost(data as Post);

      if (user) {
        const { data: likeRow } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("target_id", postId)
          .eq("target_type", "post")
          .maybeSingle();

        setLiked(!!likeRow);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading post...
      </div>
    );
  }

  if (!post) return null;

  const profile = normalizeProfile(post.profiles);
  const media = post.post_media?.[0];
  if (!media) return null;

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-posts/${media.output_path}`;

  const showAvatar = !!profile?.avatar_url && !avatarFailed;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a]">
        <div
          onClick={() => router.back()}
          className="cursor-pointer text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </div>

        <div className="text-sm font-medium">Post</div>

        <div />
      </div>

      <div className="flex items-center space-x-3 px-4 py-3">
        <div
          onClick={() => profile && router.push(`/profile/${profile.username}`)}
          className="w-8 h-8 rounded-full overflow-hidden bg-[#0f0f0f] shrink-0 cursor-pointer flex items-center justify-center"
        >
          {showAvatar ? (
            <img
              src={profile!.avatar_url!}
              loading="lazy"
              decoding="async"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <span className="text-[10px] text-gray-400">
              {profile?.username?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>

        <span
          onClick={() => profile && router.push(`/profile/${profile.username}`)}
          className="text-[13px] font-medium cursor-pointer hover:underline"
        >
          {profile?.username || "user"}
        </span>
      </div>

      <div className="w-full bg-black flex justify-center">
        <img
          src={imageUrl}
          className="max-h-[85vh] w-full object-contain"
          alt=""
        />
      </div>

      <div className="px-4 pt-4">
        {currentUserId && (
          <LikeButton
            postId={post.id}
            initialLiked={liked}
            initialCount={post.like_count || 0}
            userId={currentUserId}
          />
        )}
      </div>

      {post.caption && (
        <div className="px-4 py-4 text-[14px] text-gray-300">
          <span
            onClick={() => profile && router.push(`/profile/${profile.username}`)}
            className="font-medium text-white mr-2 cursor-pointer hover:underline"
          >
            {profile?.username}
          </span>
          {post.caption}
        </div>
      )}
    </div>
  );
}