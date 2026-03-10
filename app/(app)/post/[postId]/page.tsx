"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import LikeButton from "@/components/posts/LikeButton";
import Image from "next/image";

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

function normalizeProfile(profile: any): Profile | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] || null;
  return profile;
}

export default function PostViewer() {

  const router = useRouter();
  const params = useParams();
  const postId = params?.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchPost();
  }, []);

  async function fetchPost() {

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (user) setCurrentUserId(user.id);

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

      setPost(data);

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

  return (

    <div className="min-h-screen bg-black text-white">

      {/* Header */}

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">

        <div
          onClick={() => router.back()}
          className="cursor-pointer text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </div>

        <div className="text-sm font-medium">
          Post
        </div>

        <div />

      </div>

      {/* USER HEADER */}

      <div className="flex items-center space-x-2 px-4 py-2">

        <div
          onClick={() => profile && router.push(`/profile/${profile.username}`)}
          className="w-6 h-6 rounded-full overflow-hidden bg-[#0f0f0f] cursor-pointer"
        >

          {profile?.avatar_url && (

            <Image
              src={profile.avatar_url}
              alt=""
              width={24}
              height={24}
              className="object-cover"
            />

          )}

        </div>

        <span
          onClick={() => profile && router.push(`/profile/${profile.username}`)}
          className="text-[13px] font-medium cursor-pointer hover:underline"
        >
          {profile?.username || "user"}
        </span>

      </div>

      {/* Image */}

      <div className="w-full bg-black">

        <Image
          src={imageUrl}
          alt=""
          width={1024}
          height={1024}
          className="w-full object-cover"
        />

      </div>

      {/* Actions */}

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

      {/* Caption */}

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