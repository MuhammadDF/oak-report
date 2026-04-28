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
        isDark
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
        isDark
        error="Bad auth"
        isSubmitting
        onCredentialReceived={onCredentialReceived}
      />,
    );

    expect(window.google?.accounts.id.initialize).toHaveBeenCalled();
    expect(window.google?.accounts.id.renderButton).toHaveBeenCalled();
    expect(window.google?.accounts.id.prompt).not.toHaveBeenCalled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(screen.getByText("Bad auth")).toBeInTheDocument();

    const renderOpts = vi.mocked(window.google!.accounts.id.renderButton).mock.calls[0][1] as {
      theme: string;
    };
    expect(renderOpts.theme).toBe("filled_black");

    const initializeCall = vi.mocked(window.google!.accounts.id.initialize).mock.calls[0][0] as {
      callback: (response: { credential?: string }) => Promise<void>;
    };

    initializeCall.callback({ credential: "google-token" });
    expect(onCredentialReceived).toHaveBeenCalledWith("google-token");
    initializeCall.callback({});
    expect(onCredentialReceived).toHaveBeenCalledTimes(1);
  });

  it("uses outline theme for the Google button in light mode", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client-id");

    render(
      <SignInScreen
        isDark={false}
        error={null}
        isSubmitting={false}
        onCredentialReceived={vi.fn()}
      />,
    );

    const renderOpts = vi.mocked(window.google!.accounts.id.renderButton).mock.calls[0][1] as {
      theme: string;
    };
    expect(renderOpts.theme).toBe("outline");
  });
});
