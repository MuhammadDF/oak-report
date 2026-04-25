import { ScreenHeader } from "../components/common/ScreenHeader";

export function AccessRequiredScreen() {
  return (
    <section className="screen">
      <ScreenHeader
        eyebrow="Whitelist Required"
        title="Your account is pending access."
        description="You need to be whitelisted before you can appraise cards or manage a collection."
      />

      <article className="panel access-required-panel">
        <p>
          This account currently has limited access. Search, appraisal, and collection workflows are locked until you are whitelisted.
        </p>
        <p>
          Contact nick@organizedinsomnia.com to request whitelist access or role promotion.
        </p>
      </article>
    </section>
  );
}
