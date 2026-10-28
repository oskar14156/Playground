import React from "react";
import {VacuumPreview, DURATION as VAC_DURATION} from "./videos/vacuum-cleaner/VacuumPreview";
import { Composition } from "remotion";
import { VIDEO } from "./lib/theme";
import { DURATION as GC_DURATION, GreatCircle } from "./videos/great-circle/GreatCircle";
import { BlackBox, DURATION as BB_DURATION } from "./videos/black-box/BlackBox";
import { Titanic, DURATION as TI_DURATION } from "./videos/titanic/Titanic";
import { BoatLab, BOAT_LAB_DURATION } from "./videos/_lab/BoatLab";
import { VolcanoReel, DURATION as VO_DURATION } from "./videos/volcano/Volcano";
import { CoasterReel, DURATION as CO_DURATION } from "./videos/coaster-loop/CoasterReel";
import { Meteors, DURATION as ME_DURATION } from "./videos/meteors/Meteors";
import { Php2Shell, DURATION as PH_DURATION } from "./videos/php2shell/Php2Shell";
import { FireTestB, FIRE_B_DURATION } from "./videos/_lab/FireTestB";
import { CoasterLab, COASTER_LAB_DURATION } from "./videos/_lab/CoasterLab";
import { VolcanoLab, VOLCANO_LAB_DURATION } from "./videos/_lab/VolcanoLab";
import { LinerLab, LINER_LAB_DURATION } from "./videos/_lab/LinerLab";
import { BlackBoxBlender } from "./videos/black-box/BlackBoxBlender";
import { TitanicBlender } from "./videos/titanic/TitanicBlender";
import { VolcanoBlender } from "./videos/volcano/VolcanoBlender";
import { HumanLab, HUMAN_LAB_DURATION } from "./videos/_lab/HumanLab";

// One <Composition> per video in src/videos/<slug>/. Keep ids = slugs.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="vacuum-cleaner" component={VacuumPreview} durationInFrames={VAC_DURATION} {...VIDEO} />
    <Composition id="great-circle" component={GreatCircle} durationInFrames={GC_DURATION} {...VIDEO} />
    <Composition id="black-box" component={BlackBox} durationInFrames={BB_DURATION} {...VIDEO} />
    <Composition id="titanic" component={Titanic} durationInFrames={TI_DURATION} {...VIDEO} />
    <Composition id="boat-lab" component={BoatLab} durationInFrames={BOAT_LAB_DURATION} {...VIDEO} />
    <Composition id="volcano" component={VolcanoReel} durationInFrames={VO_DURATION} {...VIDEO} />
    <Composition id="coaster-loop" component={CoasterReel} durationInFrames={CO_DURATION} {...VIDEO} />
    <Composition id="meteors" component={Meteors} durationInFrames={ME_DURATION} {...VIDEO} />
    <Composition id="php2shell" component={Php2Shell} durationInFrames={PH_DURATION} {...VIDEO} />
    <Composition id="compare-b" component={FireTestB} durationInFrames={FIRE_B_DURATION} {...VIDEO} />
    <Composition id="coaster-lab" component={CoasterLab} durationInFrames={COASTER_LAB_DURATION} {...VIDEO} />
    <Composition id="volcano-lab" component={VolcanoLab} durationInFrames={VOLCANO_LAB_DURATION} {...VIDEO} />
    <Composition id="liner-lab" component={LinerLab} durationInFrames={LINER_LAB_DURATION} {...VIDEO} />
    <Composition id="black-box-blender" component={BlackBoxBlender} durationInFrames={BB_DURATION} {...VIDEO} />
    <Composition id="titanic-blender" component={TitanicBlender} durationInFrames={TI_DURATION} defaultProps={{ plate: "tib/frames" }} {...VIDEO} />
    <Composition id="volcano-blender" component={VolcanoBlender} durationInFrames={VO_DURATION} defaultProps={{ plate: "vob/frames" }} {...VIDEO} />
    <Composition id="human-lab" component={HumanLab} durationInFrames={HUMAN_LAB_DURATION} {...VIDEO} />
  </>
);
