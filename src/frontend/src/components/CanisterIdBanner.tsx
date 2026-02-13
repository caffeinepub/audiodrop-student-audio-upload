import { getBackendCanisterId, isValidCanisterId } from '../config/canisters';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Always-visible banner showing the active backend canister ID.
 * This banner helps verify that the correct canister ID is being used
 * for all backend calls at runtime.
 */
export default function CanisterIdBanner() {
  const canisterId = getBackendCanisterId();
  const isValid = isValidCanisterId(canisterId);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${
      isValid 
        ? 'bg-primary/10 border-t border-primary/20' 
        : 'bg-destructive/10 border-t border-destructive/20'
    }`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <AlertCircle className="h-3 w-3 text-destructive" />
            )}
            <span className="font-medium text-muted-foreground">
              Backend Canister:
            </span>
            <code className={`font-mono px-2 py-0.5 rounded ${
              isValid 
                ? 'bg-primary/20 text-primary' 
                : 'bg-destructive/20 text-destructive'
            }`}>
              {canisterId}
            </code>
          </div>
          {!isValid && (
            <span className="text-destructive text-[10px]">
              Invalid canister ID format - check config/canisters.ts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
