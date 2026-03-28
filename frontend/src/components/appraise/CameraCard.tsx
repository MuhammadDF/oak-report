type CameraCardProps = {
  loading: boolean;
};

export function CameraCard({ loading }: CameraCardProps) {
  return (
    <div className="camera-card">
      <div className="camera-card__glow" />
      <div className={`viewfinder ${loading ? "viewfinder--active" : ""}`}>
        <div className="viewfinder__corner viewfinder__corner--tl" />
        <div className="viewfinder__corner viewfinder__corner--tr" />
        <div className="viewfinder__corner viewfinder__corner--bl" />
        <div className="viewfinder__corner viewfinder__corner--br" />
        {loading ? <div className="viewfinder__scanner" /> : null}
        <p>{loading ? "Building appraisal..." : "Align card within frame"}</p>
      </div>
    </div>
  );
}
