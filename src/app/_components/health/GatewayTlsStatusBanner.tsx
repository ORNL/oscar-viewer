"use client";

import React from "react";
import {Alert, AlertTitle} from "@mui/material";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {getIntlLocale} from "@/app/utils/LocaleUtils";
import type {GatewayTlsStatus} from "@/lib/data/oscar/GatewayTlsApi";

export interface GatewayTlsStatusBannerProps {
    status: GatewayTlsStatus | null;
}

/**
 * Renders a non-intrusive HTTPS gateway TLS expiration banner strictly when
 * the mounted public certificate is within 60 days of expiry or already expired.
 * Healthy (> 60 days) and non-containerized/unavailable states render nothing.
 */
export default function GatewayTlsStatusBanner({status}: GatewayTlsStatusBannerProps) {
    const {language, t} = useLanguage();

    if (!status || !status.available) {
        return null;
    }
    if (status.status !== "WARNING" && status.status !== "CRITICAL" && status.status !== "EXPIRED") {
        return null;
    }

    const isCriticalOrExpired = status.status === "CRITICAL" || status.status === "EXPIRED";
    const severity = isCriticalOrExpired ? "error" : "warning";
    const expiryDate = status.notAfter
        ? new Date(status.notAfter).toLocaleDateString(getIntlLocale(language), {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "";
    const days = Math.max(0, Math.floor(status.daysRemaining ?? 0));

    const title = isCriticalOrExpired ? t("gatewayTlsCriticalTitle") : t("gatewayTlsWarningTitle");
    const bodyTemplate = status.status === "EXPIRED" ? t("gatewayTlsExpiredBody") : t("gatewayTlsWarningBody");
    const body = bodyTemplate
        .replace("{days}", String(days))
        .replace("{date}", expiryDate);

    return (
        <Alert severity={severity} variant="outlined" data-testid="gateway-tls-expiry-banner">
            <AlertTitle>{title}</AlertTitle>
            {body}
        </Alert>
    );
}
