import { ReactNode } from "react";

type ScreenHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export function ScreenHeader({
  aside,
  description,
  eyebrow,
  title,
}: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div>
        <p className="screen-header__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="screen-header__copy">{description}</p>
      </div>
      {aside ?? null}
    </header>
  );
}
