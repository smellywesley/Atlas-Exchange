import { Composition } from "remotion";
import { AtlasExchangeDemo } from "./AtlasExchangeDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="AtlasExchangeDemo"
      component={AtlasExchangeDemo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
