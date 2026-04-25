import { AuthUser } from "../types/app";
import { ScreenHeader } from "../components/common/ScreenHeader";

type ProfileScreenProps = {
  user: AuthUser;
  onSignOut: () => void;
};

export function ProfileScreen({ user, onSignOut }: ProfileScreenProps) {
  return (
    <section className="screen profile-screen">
      <ScreenHeader
        eyebrow="Profile"
        title="Your account."
        description="Review your information and sign out when needed."
      />

      <div className="profile-grid">
        <article className="panel profile-card">
          <p className="panel__eyebrow">Signed in user</p>
          <h2>{user.display_name}</h2>
          <p className="report-copy">{user.email}</p>
          <p className="report-copy">Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          <button className="signout-button" onClick={onSignOut} type="button">
            <span className="signout-button__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M10 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H10" />
                <path d="M14 12H3" />
                <path d="M10 8L14 12L10 16" />
              </svg>
            </span>
            <span>Sign out</span>
          </button>
        </article>
      </div>
    </section>
  );
}