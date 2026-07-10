"use client";

type RegionGlobeProps = {
  activeRegion: string;
};

const orbitLabels = ["London", "Seoul", "Boston", "Santiago"];

export function RegionGlobe({ activeRegion }: RegionGlobeProps) {
  return (
    <div className="globe-card" aria-label={`3D region selector focused on ${activeRegion}`}>
      <div className="css-globe-scene" aria-hidden="true">
        <div className="css-globe">
          <span className="globe-ring ring-a" />
          <span className="globe-ring ring-b" />
          <span className="globe-ring ring-c" />
          <span className="globe-core" />
        </div>
        <div className="orbit-system">
          {orbitLabels.map((label, index) => (
            <span key={label} className={`orbit-point orbit-point-${index + 1}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="globe-overlay">
        <span>Active region</span>
        <strong>{activeRegion.toUpperCase()}</strong>
      </div>
    </div>
  );
}
