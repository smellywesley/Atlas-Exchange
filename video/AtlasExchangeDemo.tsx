import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const colors = {
  ink: "#081111",
  panel: "#101A1B",
  text: "#F4F7F5",
  muted: "#AFC7D1",
  accent: "#37B7C8"
};

export function AtlasExchangeDemo() {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, color: colors.text, fontFamily: "Arial, sans-serif" }}>
      <Sequence durationInFrames={8 * fps}>
        <Scene title="London exchange, planned before departure." kicker="Atlas Exchange" />
      </Sequence>
      <Sequence from={8 * fps} durationInFrames={10 * fps}>
        <Scene title="Housing, budget, packing, deadlines. Usually scattered." kicker="The problem" />
      </Sequence>
      <Sequence from={18 * fps} durationInFrames={12 * fps}>
        <DestinationScene />
      </Sequence>
      <Sequence from={30 * fps} durationInFrames={12 * fps}>
        <IntakeScene />
      </Sequence>
      <Sequence from={42 * fps} durationInFrames={18 * fps}>
        <PlanScene />
      </Sequence>
      <Sequence from={60 * fps} durationInFrames={10 * fps}>
        <Scene title="Every recommendation carries a source." kicker="Trust layer" />
      </Sequence>
      <Sequence from={70 * fps} durationInFrames={5 * fps}>
        <Scene title="London first. Global exchange paths next." kicker="Demo close" />
      </Sequence>
    </AbsoluteFill>
  );
}

function Scene({ title, kicker }: { title: string; kicker: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18, 170, 220], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const scale = interpolate(frame, [0, 220], [1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
        background:
          "radial-gradient(circle at 30% 20%, rgba(55,183,200,.28), transparent 520px), linear-gradient(135deg, #081111, #102022)"
      }}
    >
      <div style={{ opacity, scale, textAlign: "center", maxWidth: 1280 }}>
        <div style={{ color: colors.accent, fontSize: 34, marginBottom: 30, letterSpacing: 4, textTransform: "uppercase" }}>
          {kicker}
        </div>
        <div style={{ fontSize: 112, lineHeight: 1, letterSpacing: -6, fontWeight: 800 }}>
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function DestinationScene() {
  return (
    <AbsoluteFill style={{ padding: 110, justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <VideoCard title="Choose London" subtitle="UK path selected" />
        <VideoCard title="University College London" subtitle="Bloomsbury housing and commute plan" />
      </div>
    </AbsoluteFill>
  );
}

function IntakeScene() {
  return (
    <AbsoluteFill style={{ padding: 110, justifyContent: "center" }}>
      <div style={{ display: "grid", gap: 28, maxWidth: 980 }}>
        <h2 style={{ fontSize: 96, lineHeight: 1, margin: 0 }}>One student profile drives the plan.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          <VideoCard title="SGD 2,300" subtitle="monthly budget" />
          <VideoCard title="4 months" subtitle="stay length" />
          <VideoCard title="Shared" subtitle="housing preference" />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function PlanScene() {
  return (
    <AbsoluteFill style={{ padding: 100, justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 24, alignItems: "stretch" }}>
        <VideoCard title="Apply for UCL halls first" subtitle="Top accommodation ranking" large />
        <div style={{ display: "grid", gap: 24 }}>
          <VideoCard title="SGD 2,300" subtitle="monthly estimate" />
          <VideoCard title="Waterproof layer" subtitle="packing priority" />
          <VideoCard title="July 22" subtitle="housing deadline" />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function VideoCard({ title, subtitle, large = false }: { title: string; subtitle: string; large?: boolean }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const translate = interpolate(frame, [0, 24], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        opacity,
        translate: `0 ${translate}px`,
        minHeight: large ? 560 : 230,
        border: "1px solid rgba(244,247,245,.18)",
        borderRadius: 34,
        background: "rgba(16,26,27,.86)",
        padding: 44,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
      }}
    >
      <div style={{ color: colors.accent, fontSize: 32, marginBottom: 18 }}>{subtitle}</div>
      <div style={{ fontSize: large ? 82 : 56, lineHeight: 1, fontWeight: 800, letterSpacing: -3 }}>
        {title}
      </div>
    </div>
  );
}
