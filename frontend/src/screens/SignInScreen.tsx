import { useEffect, useRef } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";

type SignInScreenProps = {
  isSubmitting: boolean;
  error: string | null;
  onCredentialReceived: (idToken: string) => Promise<void>;
};

export function SignInScreen({
  isSubmitting,
  error,
  onCredentialReceived,
}: SignInScreenProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const google = window.google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!google || !clientId || !buttonRef.current || hasInitialized.current) {
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (!response.credential) {
          return;
        }
        await onCredentialReceived(response.credential);
      },
    });

    const buttonWidth = Math.min(360, Math.max(220, window.innerWidth - 96));

    google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: buttonWidth,
    });
    google.accounts.id.prompt();
    hasInitialized.current = true;
  }, [onCredentialReceived]);

  const isClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  return (
    <section className="screen auth-screen">
      <ScreenHeader
        eyebrow="Authentication"
        title="Sign in to unlock your collection"
        description="Use your Google account to sync with Oak Report services and securely connect your collection data."
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
            <div className="google-button-slot" ref={buttonRef} />
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
