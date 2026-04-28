import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessRequiredScreen } from "./AccessRequiredScreen";
import { ProfileScreen } from "./ProfileScreen";
import { SignInScreen } from "./SignInScreen";

describe("AccessRequiredScreen", () => {
  it("renders the pending access message", () => {
    render(<AccessRequiredScreen />);

    expect(screen.getByRole("heading", { name: "Your account is pending access." })).toBeInTheDocument();
    expect(screen.getByText(/Contact nick@organizedinsomnia.com/i)).toBeInTheDocument();
  });
});

describe("ProfileScreen", () => {
  it("renders user details and signs out", () => {
    const onSignOut = vi.fn();
    render(
      <ProfileScreen
        onSignOut={onSignOut}
        user={{
          id: "user-1",
          display_name: "Ash",
          email: "ash@example.com",
          role: "collector",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Sign out/i }));

    expect(screen.getByText("Ash")).toBeInTheDocument();
    expect(screen.getByText("Role: Collector")).toBeInTheDocument();
    expect(onSignOut).toHaveBeenCalled();
  });
});

describe("SignInScreen", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders a missing client id warning", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");

    render(
      <SignInScreen
        error={null}
        isSubmitting={false}
        onCredentialReceived={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Missing VITE_GOOGLE_CLIENT_ID in frontend environment."),
    ).toBeInTheDocument();
  });

  it("initializes google identity when configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");
    const onCredentialReceived = vi.fn();

    render(
      <SignInScreen
        error="Bad auth"
        isSubmitting
        onCredentialReceived={onCredentialReceived}
      />,
    );

    expect(window.google?.accounts.id.initialize).toHaveBeenCalled();
    expect(window.google?.accounts.id.renderButton).toHaveBeenCalled();
    expect(window.google?.accounts.id.prompt).toHaveBeenCalled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(screen.getByText("Bad auth")).toBeInTheDocument();

    const initializeCall = vi.mocked(window.google!.accounts.id.initialize).mock.calls[0][0] as {
      callback: (response: { credential?: string }) => Promise<void>;
    };

    initializeCall.callback({ credential: "google-token" });
    expect(onCredentialReceived).toHaveBeenCalledWith("google-token");
    initializeCall.callback({});
    expect(onCredentialReceived).toHaveBeenCalledTimes(1);
  });
});
