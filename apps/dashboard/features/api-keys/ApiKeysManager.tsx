"use client";

import { Code, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/components";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import { SectionTitle } from "@/shared/components/design-system/section/section-title/SectionTitle";
import { useSession } from "@/shared/services/auth/client";
import { useLogin } from "@/shared/services/auth/LoginProvider";
import type { UserApiKey } from "@/shared/services/user-api/apiKeysClient";

import { ApiKeysTable } from "./components/ApiKeysTable";
import { ConnectAgentSection } from "./components/ConnectAgentSection";
import { CreateApiKeyModal } from "./components/CreateApiKeyModal";
import { SaveApiKeyModal } from "./components/SaveApiKeyModal";
import { useApiKeys } from "./hooks/useApiKeys";

export const ApiKeysManager = () => {
  const { data: session, isPending } = useSession();
  const { openLogin } = useLogin();
  const isAuthed = !isPending && !!session;

  const { keys, isLoading, create, revoke } = useApiKeys(isAuthed);

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
  const [toRevoke, setToRevoke] = useState<UserApiKey | null>(null);

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

  const handleRevoke = () => {
    if (!toRevoke) return;
    revoke.mutate(toRevoke.id, { onSuccess: () => setToRevoke(null) });
  };

  // Signed-out visitors get the sign-in modal right away, over the page —
  // no interstitial screen. Once only, so dismissing it isn't a fight; any
  // gated action (Create key) re-opens it.
  const autoOpenedLogin = useRef(false);
  useEffect(() => {
    if (isPending || session || autoOpenedLogin.current) return;
    autoOpenedLogin.current = true;
    openLogin();
  }, [isPending, session, openLogin]);

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
            onClick={() => (isAuthed ? setCreateOpen(true) : openLogin())}
          >
            <Plus className="size-3.5" />
            Create key
          </Button>
        </div>

        {isLoading ? (
          <p className="text-secondary text-sm">Loading…</p>
        ) : (
          <ApiKeysTable keys={keys} onRevoke={setToRevoke} />
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
        open={!!toRevoke}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title="Revoke API key"
        description={
          toRevoke
            ? `This permanently revokes "${toRevoke.label}". Any agent using it stops working right away. This can't be undone.`
            : ""
        }
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isConfirmLoading={revoke.isPending}
        onConfirm={handleRevoke}
      >
        <div className="p-4" />
      </Modal>
    </div>
  );
};
