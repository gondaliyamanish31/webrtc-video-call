"use client";

import { type PropsWithChildren } from "react";
import { useSession } from "next-auth/react";
import { PageLoader } from "@/components/PageLoader/PageLoader";

export const SessionLoader = ({ children }: PropsWithChildren) => {
  const { status, data } = useSession();

  if (status === "loading" && !data) {
    return <PageLoader />;
  }

  return children;
};
