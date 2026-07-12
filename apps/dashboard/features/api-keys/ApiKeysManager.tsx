"use client";

import { Code, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
import { useSession } from "@/shared/services/auth/client";
import { useLogin } from "@/shared/services/auth/LoginProvider";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";

import { ApiKeysTable } from "./components/ApiKeysTable";
import { ConnectAgentSection } from "./components/ConnectAgentSection";
import { CreateApiKeyModal } from "./components/CreateApiKeyModal";
import { SaveApiKeyModal } from "./components/SaveApiKeyModal";
import { useApiKeys } from "./hooks/useApiKeys";

export const ApiKeysManager = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { openLogin } = useLogin();
  const isAuthed = !isPending && !!session;
  const userId = session?.user.id ?? null;

  const { keys, isLoading, isError, isUnavailable, create, revoke } =
    useApiKeys(userId);

  const [createOpen, setCreateOpen] = useState(false);
  // Holds the just-created plaintext for the one-time reveal modal.
  const [created, setCreated] = useState<{
    token: string;
    label: string;
  } | null>(null);
  // Plaintexts of keys created this session, so the connect command can
  // embed the real key ("Your key is already in it"). Never persisted.
  const [sessionTokens, setSessionTokens] = useState<Record<string, string>>(
    {},
  );
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<UserApiKey | null>(null);

  // Plaintexts belong to exactly one account: a sign-out or a different user
  // signing in must never inherit (or copy) the previous user's tokens.
  useEffect(() => {
    setSessionTokens({});
    setLastCreatedId(null);
    setCreated(null);
  }, [userId]);

  const handleCreate = (label: string) => {
    create.mutate(label, {
      onSuccess: (key) => {
        setCreateOpen(false);
        setCreated({ token: key.token, label: key.label });
        setSessionTokens((prev) => ({ ...prev, [key.id]: key.token }));
        setLastCreatedId(key.id);
      },
    });
  };

  const handleDelete = () => {
    if (!toDelete) return;
    revoke.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
  };

  // The page is login-gated: it only renders with a session. A signed-out
  // arrival is bounced home with the sign-in modal open, and signing in
  // navigates back here (redirectTo). Signing out while on the page just
  // bounces home, without re-prompting.
  const wasAuthed = useRef(false);
  useEffect(() => {
    if (session) wasAuthed.current = true;
  }, [session]);
  useEffect(() => {
    if (isPending || session) return;
    if (!wasAuthed.current) openLogin({ redirectTo: "/api-keys" });
    router.replace("/");
  }, [isPending, session, openLogin, router]);

  if (!isAuthed) return null;

  // A deployment without Authful provisioning has no API-key surface —
  // showing working-looking controls that can never succeed would be worse.
  if (isUnavailable) {
    return (
      <div className="flex w-full flex-col items-center gap-2 py-16 text-center">
        <Code className="text-secondary size-8" />
        <h4 className="text-primary text-lg font-medium">
          API access isn&apos;t enabled here
        </h4>
        <p className="text-secondary max-w-md text-sm">
          This deployment doesn&apos;t serve self-service API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-5">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <SectionTitle
            icon={<Code className="text-primary size-5" />}
            title="API Keys"
            description="Query Anticapture from Claude, Cursor, or Codex. Just ask in natural language."
          />
          <Button
            variant="primary"
            size="md"
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Create key
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-13 w-full" />
            <Skeleton className="h-13 w-full" />
          </div>
        ) : (
          <ApiKeysTable keys={keys} isError={isError} onDelete={setToDelete} />
        )}
      </div>

      <DividerDefault />

      <ConnectAgentSection
        keys={keys}
        sessionTokens={sessionTokens}
        lastCreatedId={lastCreatedId}
      />

      <CreateApiKeyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
        isCreating={create.isPending}
      />

      {created && (
        <SaveApiKeyModal
          open={!!created}
          onOpenChange={(open) => !open && setCreated(null)}
          token={created.token}
          label={created.label}
        />
      )}

      <Modal
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete API key?"
        description={
          toDelete
            ? `This permanently deletes "${toDelete.label}". Any agent using it stops working right away. This can't be undone.`
            : ""
        }
        confirmLabel="Delete key"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isConfirmLoading={revoke.isPending}
        onConfirm={handleDelete}
      >
        <div className="p-4" />
      </Modal>
    </div>
  );
};
