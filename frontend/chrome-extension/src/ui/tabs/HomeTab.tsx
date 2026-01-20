type Props = {
    onGoScan: () => void;
    onGoUpdate: () => void;
};

export function HomeTab({ onGoScan, onGoUpdate }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)"
            }}>
                <LogoMark />
                <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>QforMedia</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>YouTube Studio Copilot</div>
                </div>
            </div>

            {/* Intro */}
            <div style={{ padding: "0 2px", fontSize: 13, opacity: 0.9 }}>
                This extension helps you to polish a video before publishing it to YouTube.
                Use it to quickly catch common metadata mistakes & generate better text / structure using AI.
            </div>

            {/* Features */}
            <FeatureCard
                title="Scan"
                subtitle="Scan a YouTube video and get a detailed report of its quality."
                bullets={[
                    "Checks title & description basics (length, missing sections, etc.)",
                    "Flags common metadata mistakes (missing tags, incorrect titles, etc.)",
                    "Shows clear pass / fail ratings for each section of the video",
                ]}
                cta="Go to Scan"
                onClick={onGoScan}
            />
            <FeatureCard
                title="Update"
                subtitle="AI-powered text and structure suggestions for your video."
                bullets={[
                    "Chapter creation: suggests timestamps + chapter titles based on the video's content",
                    "Rewite description: generates a new, improved description based on the video's content",
                    "Built for fast integration-generation time. Review and paste what you like",
                ]}
                cta="Go to Update"
                onClick={onGoUpdate}
            />

            {/* Footer */}
            <div style={{ fontSize: 12, opacity: 0.7, paddingTop: 4 }}>
                Tip: Start with <b>Scan</b> to catch common metadata mistakes, then <b>Update</b> to improve anything that needs work.
            </div>
        </div>
    );
}

function FeatureCard({
    title,
    subtitle,
    bullets,
    cta,
    onClick,
  }: {
    title: string;
    subtitle: string;
    bullets: string[];
    cta: string;
    onClick: () => void;
  }) {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{subtitle}</div>
        </div>
  
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.9 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ margin: "4px 0" }}>
              {b}
            </li>
          ))}
        </ul>
  
        <button
          onClick={onClick}
          style={{
            marginTop: 4,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(0,0,0,0.92)",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {cta}
        </button>
      </div>
    );
  }
  
  function LogoMark() {
    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(0,0,0,0.92), rgba(0,0,0,0.55))",
          display: "grid",
          placeItems: "center",
          color: "white",
          fontWeight: 900,
          letterSpacing: 0.5,
          userSelect: "none",
        }}
        aria-label="QforMedia logo"
        title="QforMedia"
      >
        QF
      </div>
    );
  }