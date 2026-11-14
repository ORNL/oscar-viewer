"use client";

import {useEffect} from "react";
import NextError from "next/error";
import {recordSupportDiagnosticEvent} from "@/lib/data/oscar/SupportDiagnostics";

export default function GlobalError({
  error,
}: {
  error?: Error & {digest?: string};
}) {
  useEffect(() => {
    if (error) {
      recordSupportDiagnosticEvent({
        category: "runtime",
        level: "error",
        message: `Global React boundary error: ${error.name}: ${error.message}`,
        details: {
          digest: error.digest ?? null,
        },
      });
    }
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
