export function EmptyReport() {
  return (
    <article className="panel empty-panel">
      <p className="panel__eyebrow">Card overview</p>
      <h2>Waiting for a scan</h2>
      <p className="report-copy">
        Upload a card image to populate the identity and market data
        panels.
      </p>
      <div className="empty-panel__stats">
        <div>
          <span>Identity</span>
          <strong>Set match</strong>
        </div>
        <div>
          <span>Pricing</span>
          <strong>Market comps</strong>
        </div>
      </div>
    </article>
  );
}
