"use client";

import { VideoCallPage } from "@/components/VideoCallPage/VideoCallPage";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!params?.roomId) {
      router.replace("/"); // redirect to home page
    }
  }, [params, router]);

  if (!params?.roomId) {
    // Optionally render null or a loading message while redirecting
    return null;
  }

  const { roomId } = params;
  const isCreating = searchParams?.get("create") === "true";

  return <VideoCallPage roomId={roomId} isCreating={isCreating} />;
}
