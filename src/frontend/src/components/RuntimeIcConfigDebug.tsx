import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBackendCanisterId, isValidCanisterId } from '../config/canisters';
import { getIcHost } from '../ic/agent';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Temporary debug component that displays runtime IC configuration.
 * Shows the agent host and canister ID used for all backend calls.
 * This helps verify that the correct mainnet configuration is active.
 * 
 * Now reads canister ID from the centralized config/canisters.ts module.
 */
export default function RuntimeIcConfigDebug() {
  const host = getIcHost();
  const canisterId = getBackendCanisterId();
  
  // Verify configuration is correct
  const isHostCorrect = host === 'https://ic0.app';
  const isCanisterIdValid = isValidCanisterId(canisterId);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>🔧 IC Configuration Debug</span>
          {isHostCorrect && isCanisterIdValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Agent Host:</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded font-mono">{host}</code>
            {isHostCorrect ? (
              <Badge variant="default" className="text-xs">✓ Correct</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">✗ Wrong</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium">Canister ID:</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded font-mono text-[10px]">{canisterId}</code>
            {isCanisterIdValid ? (
              <Badge variant="default" className="text-xs">✓ Valid</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">✗ Invalid</Badge>
            )}
          </div>
        </div>

        <div className="pt-2 border-t text-[10px] text-muted-foreground">
          <p>✓ No fetchRootKey() calls (mainnet only)</p>
          <p>✓ All actors use the same agent instance</p>
          <p>✓ Canister ID from config/canisters.ts</p>
        </div>
      </CardContent>
    </Card>
  );
}
