import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmRequest = ConfirmOptions & { action: () => void; nonce: number };

const ConfirmContext = createContext<((opts: ConfirmOptions, action: () => void) => void) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((opts: ConfirmOptions, action: () => void) => {
    setRequest({ ...opts, action, nonce: Date.now() });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          key={request.nonce}
          open
          onOpenChange={(open) => {
            if (!open) setRequest(null);
          }}
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          destructive={request.destructive}
          onConfirm={request.action}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    return (_opts: ConfirmOptions, _action: () => void) => {};
  }
  return confirm;
}
