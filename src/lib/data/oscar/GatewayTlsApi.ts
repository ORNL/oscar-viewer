/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

export type GatewayTlsHealthState = 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'UNAVAILABLE';

export interface GatewayTlsStatus {
    available: boolean;
    status: GatewayTlsHealthState;
    daysRemaining?: number;
    notBefore?: string;
    notAfter?: string;
    subject?: string;
    issuer?: string;
    selfSigned?: boolean;
}

const DIAGNOSTICS_BASES = ['/sensorhub/oscar/diagnostics', '/oscar/diagnostics'];

export async function fetchGatewayTlsStatusSafe(
    options?: { signal?: AbortSignal }
): Promise<GatewayTlsStatus | null> {
    try {
        for (const base of DIAGNOSTICS_BASES) {
            const init: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                priority: 'low',
                signal: options?.signal,
            };
            const res = await fetch(`${base}/tls-status`, init);
            if (res.status === 404) {
                continue;
            }
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            if (data && typeof data.available === 'boolean' && typeof data.status === 'string') {
                return data as GatewayTlsStatus;
            }
            return null;
        }
        return null;
    } catch {
        return null;
    }
}
