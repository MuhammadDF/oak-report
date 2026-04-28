import { useEffect, useRef } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";

type SignInScreenProps = {
  isDark: boolean;
  isSubmitting: boolean;
  error: string | null;
  onCredentialReceived: (idToken: string) => Promise<void>;
};

export function SignInScreen({
  isDark,
  isSubmitting,
  error,
  onCredentialReceived,
}: SignInScreenProps) {
  const slotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const google = window.google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const slot = slotRef.current;
    if (!google || !clientId || !slot) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (!response.credential) return;
        await onCredentialReceived(response.credential);
      },
    });

    const stripWrapperBackgrounds = () => {
      slot.querySelectorAll<HTMLElement>("*:not(iframe)").forEach((el) => {
        el.style.setProperty("background", "transparent", "important");
        el.style.setProperty("background-color", "transparent", "important");
        el.style.setProperty("box-shadow", "none", "important");
      });
    };

    // Re-strip when GIS swaps its placeholder for the real iframe.
    const mutationObserver = new MutationObserver(stripWrapperBackgrounds);
    mutationObserver.observe(slot, { childList: true, subtree: true });

    // GIS requires a pixel width. Observe the panel (not the slot) so the
    // measurement comes from CSS layout, not from GIS's own injected DOM.
    const panel = slot.closest<HTMLElement>(".auth-panel");
    if (!panel) return;

    let lastWidth = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (!width || width === lastWidth) return;
      lastWidth = width;
      slot.replaceChildren();
      google.accounts.id.renderButton(slot, {
        theme: isDark ? "filled_black" : "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: Math.min(400, Math.max(220, width)),
      });
      stripWrapperBackgrounds();
    });
    resizeObserver.observe(panel);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      slot.replaceChildren();
    };
  }, [isDark, onCredentialReceived]);

  const isClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  return (
    <section className="screen auth-screen">
      <ScreenHeader
        eyebrow="Authentication"
        title="Sign in to unlock your collection"
      />

      <article className="panel auth-panel">
        <div className="auth-panel__copy">
          <p className="panel__eyebrow">Google Identity Services</p>
          <h2>Continue with Google</h2>
          <p className="report-copy">
            Collection data is protected. Authenticate first, then return to the Collection screen.
          </p>
        </div>

        {!isClientConfigured ? (
          <p className="auth-error">
            Missing VITE_GOOGLE_CLIENT_ID in frontend environment.
          </p>
        ) : (
          <div className="auth-button-row">
            <div className="google-button-slot" ref={slotRef} />
          </div>
        )}

        {isSubmitting ? (
          <p className="auth-status">Signing in...</p>
        ) : null}
        {error ? <p className="auth-error">{error}</p> : null}
      </article>
    </section>
  );
}
