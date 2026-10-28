import {Composition,registerRoot} from "remotion";
import {VacuumPremiumCyclone, PREMIUM_DURATION} from "./videos/vacuum3d/VacuumPremiumCyclone";
export const RemotionRoot=()=> <Composition id="quality-cyclone" component={VacuumPremiumCyclone} durationInFrames={PREMIUM_DURATION} fps={30} width={1080} height={1920}/>;

registerRoot(RemotionRoot);
