import {Composition,registerRoot} from "remotion";
import {VacuumFoxRoomCinematic,ROOM_QUALITY_FRAMES} from "./videos/vacuum3d/VacuumFoxRoomCinematic";
const Root=()=> <Composition id="room-quality" component={VacuumFoxRoomCinematic} durationInFrames={ROOM_QUALITY_FRAMES} fps={30} width={1080} height={1920}/>;
registerRoot(Root);
