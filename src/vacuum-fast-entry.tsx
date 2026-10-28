import React from "react";
import {registerRoot,Composition} from "remotion";
import {VacuumFoxLiveFast,VACUUM_LIVE_DURATION} from "./videos/vacuum3d/VacuumFoxLiveFast";
const FastRoot:React.FC=()=><Composition id="vacuum-fox-live-fast" component={VacuumFoxLiveFast}
  durationInFrames={Math.ceil(VACUUM_LIVE_DURATION/3)} width={1080} height={1920} fps={10}/>;
registerRoot(FastRoot);
