"use client";

import { Inbox } from "lucide-react";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";

export const DraftEmptyState = () => (
  <BlankSlate
    variant="default"
    icon={Inbox}
    description="No drafts created yet"
  />
);
