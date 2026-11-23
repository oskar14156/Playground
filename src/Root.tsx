import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./lib/theme";
import { DURATION as GC_DURATION, GreatCircle } from "./videos/great-circle/GreatCircle";
import { BlackBox, DURATION as BB_DURATION } from "./videos/black-box/BlackBox";
import { Titanic, DURATION as TI_DURATION } from "./videos/titanic/Titanic";
import { BoatLab, BOAT_LAB_DURATION } from "./videos/_lab/BoatLab";
import { LavaLampReel, DURATION as LL_DURATION } from "./videos/lava-lamp/LavaLampReel";
import { ElevatorReel, DURATION as EL_DURATION } from "./videos/elevator/ElevatorReel";
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
import { ZombieOutbreak, DURATION as ZO_DURATION } from "./videos/zombie-outbreak/Zombie";
import { PeopleLab, PEOPLE_LAB_DURATION } from "./videos/_lab/PeopleLab";
import { HumanLab, HUMAN_LAB_DURATION } from "./videos/_lab/HumanLab";
import { SubLab, SUB_LAB_DURATION } from "./videos/_lab/SubLab";
import { BillLab, BILL_LAB_DURATION } from "./videos/_lab/BillLab";
import { CasinoLab, CASINO_LAB_DURATION } from "./videos/_lab/CasinoLab";
import { UnsinkableLab, UNSINKABLE_LAB_DURATION } from "./videos/_lab/UnsinkableLab";
import { SkyscraperLab, SKYSCRAPER_LAB_DURATION } from "./videos/_lab/SkyscraperLab";
import { VaultLab, VAULT_LAB_DURATION } from "./videos/_lab/VaultLab";
import { CarrierLab, CARRIER_LAB_DURATION } from "./videos/_lab/CarrierLab";
import { DamLab, DAM_LAB_DURATION } from "./videos/_lab/DamLab";
import { PocketLab, POCKET_LAB_DURATION } from "./videos/_lab/PocketLab";
import { FursuitLab, FURSUIT_LAB_DURATION } from "./videos/_lab/FursuitLab";
import { RocketLab, ROCKET_LAB_DURATION } from "./videos/_lab/RocketLab";
import { AirLab, AIR_LAB_DURATION } from "./videos/_lab/AirLab";
import { NetLab, NET_LAB_DURATION } from "./videos/_lab/NetLab";
import { RocketReel, DURATION as RK_DURATION } from "./videos/rocket/RocketReel";
import { WhiteHouseLab, WH_LAB_DURATION } from "./videos/_lab/WhiteHouseLab";
import { Area51Lab, AREA51_LAB_DURATION } from "./videos/_lab/Area51Lab";
import { ClawMachineReel, DURATION as CLAW_DURATION } from "./videos/claw-machine/ClawMachineReel";
import { PrisonBreakReel, DURATION as PB_DURATION } from "./videos/prison-break/PrisonBreakReel";
import { ClawLab, CLAW_LAB_DURATION } from "./videos/_lab/ClawLab";
import { Area51Reel, DURATION as A51_DURATION } from "./videos/area-51/Area51Reel";
import { PyramidReel, DURATION as PYR_DURATION } from "./videos/pyramid/PyramidReel";
import { AirplaneReel, DURATION as AIR_DURATION } from "./videos/airplane/AirplaneReel";
import { InternetReel, DURATION as NET_DURATION } from "./videos/internet/InternetReel";
import { LouvreReel, DURATION as LOUVRE_DURATION } from "./videos/louvre/LouvreReel";
import { SewerReel, DURATION as SEWER_DURATION } from "./videos/sewer/SewerReel";
import { DollarBillReel, DURATION as DB_DURATION } from "./videos/dollar-bill/DollarBillReel";
import { CasinoReel, DURATION as CASINO_DURATION } from "./videos/casino/CasinoReel";
import { UnsinkableReel, DURATION as UNSINKABLE_DURATION } from "./videos/unsinkable/UnsinkableReel";
import { SkyscraperReel, DURATION as SKYSCRAPER_DURATION } from "./videos/skyscraper/SkyscraperReel";
import { VaultReel, DURATION as VAULT_DURATION } from "./videos/vault/VaultReel";
import { CarrierReel, DURATION as CARRIER_DURATION } from "./videos/carrier/CarrierReel";
import { DamReel, DURATION as DAM_DURATION } from "./videos/dam/DamReel";
import { WhiteHouseReel, DURATION as WHR_DURATION } from "./videos/white-house/WhiteHouseReel";
import { Submarine, DURATION as SU_DURATION } from "./videos/submarine/Submarine";

// One <Composition> per video in src/videos/<slug>/. Keep ids = slugs.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="great-circle" component={GreatCircle} durationInFrames={GC_DURATION} {...VIDEO} />
    <Composition id="black-box" component={BlackBox} durationInFrames={BB_DURATION} {...VIDEO} />
    <Composition id="titanic" component={Titanic} durationInFrames={TI_DURATION} {...VIDEO} />
    <Composition id="boat-lab" component={BoatLab} durationInFrames={BOAT_LAB_DURATION} {...VIDEO} />
    <Composition id="lava-lamp" component={LavaLampReel} durationInFrames={LL_DURATION} {...VIDEO} />
    <Composition id="elevator" component={ElevatorReel} durationInFrames={EL_DURATION} {...VIDEO} />
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
    <Composition id="people-lab" component={PeopleLab} durationInFrames={PEOPLE_LAB_DURATION} {...VIDEO} />
    <Composition id="zombie-outbreak" component={ZombieOutbreak} durationInFrames={ZO_DURATION} {...VIDEO} />
    <Composition id="human-lab" component={HumanLab} durationInFrames={HUMAN_LAB_DURATION} {...VIDEO} />
    <Composition id="submarine" component={Submarine} durationInFrames={SU_DURATION} {...VIDEO} />
    <Composition id="rocket" component={RocketReel} durationInFrames={RK_DURATION} {...VIDEO} />
    <Composition id="rocket-lab" component={RocketLab} durationInFrames={ROCKET_LAB_DURATION} {...VIDEO} />
    <Composition id="air-lab" component={AirLab} durationInFrames={AIR_LAB_DURATION} {...VIDEO} />
    <Composition id="net-lab" component={NetLab} durationInFrames={NET_LAB_DURATION} {...VIDEO} />
    <Composition id="white-house" component={WhiteHouseReel} durationInFrames={WHR_DURATION} {...VIDEO} />
    <Composition id="area-51" component={Area51Reel} durationInFrames={A51_DURATION} {...VIDEO} />
    <Composition id="pyramid" component={PyramidReel} durationInFrames={PYR_DURATION} {...VIDEO} />
    <Composition id="airplane" component={AirplaneReel} durationInFrames={AIR_DURATION} {...VIDEO} />
    <Composition id="internet" component={InternetReel} durationInFrames={NET_DURATION} {...VIDEO} />
    <Composition id="louvre" component={LouvreReel} durationInFrames={LOUVRE_DURATION} {...VIDEO} />
    <Composition id="sewer" component={SewerReel} durationInFrames={SEWER_DURATION} {...VIDEO} />
    <Composition id="dollar-bill" component={DollarBillReel} durationInFrames={DB_DURATION} {...VIDEO} />
    <Composition id="casino" component={CasinoReel} durationInFrames={CASINO_DURATION} {...VIDEO} />
    <Composition id="unsinkable" component={UnsinkableReel} durationInFrames={UNSINKABLE_DURATION} {...VIDEO} />
    <Composition id="skyscraper" component={SkyscraperReel} durationInFrames={SKYSCRAPER_DURATION} {...VIDEO} />
    <Composition id="vault" component={VaultReel} durationInFrames={VAULT_DURATION} {...VIDEO} />
    <Composition id="carrier" component={CarrierReel} durationInFrames={CARRIER_DURATION} {...VIDEO} />
    <Composition id="dam" component={DamReel} durationInFrames={DAM_DURATION} {...VIDEO} />
    <Composition id="claw-machine" component={ClawMachineReel} durationInFrames={CLAW_DURATION} {...VIDEO} />
    <Composition id="prison-break" component={PrisonBreakReel} durationInFrames={PB_DURATION} {...VIDEO} />
    <Composition id="claw-lab" component={ClawLab} durationInFrames={CLAW_LAB_DURATION} {...VIDEO} />
    <Composition id="area-51-lab" component={Area51Lab} durationInFrames={AREA51_LAB_DURATION} {...VIDEO} />
    <Composition id="white-house-lab" component={WhiteHouseLab} durationInFrames={WH_LAB_DURATION} {...VIDEO} />
    <Composition id="fursuit-lab" component={FursuitLab} durationInFrames={FURSUIT_LAB_DURATION} {...VIDEO} />
    <Composition id="pocket-lab" component={PocketLab} durationInFrames={POCKET_LAB_DURATION} {...VIDEO} />
    <Composition id="sub-lab" component={SubLab} durationInFrames={SUB_LAB_DURATION} {...VIDEO} />
    <Composition id="bill-lab" component={BillLab} durationInFrames={BILL_LAB_DURATION} {...VIDEO} />
    <Composition id="casino-lab" component={CasinoLab} durationInFrames={CASINO_LAB_DURATION} {...VIDEO} />
    <Composition id="unsinkable-lab" component={UnsinkableLab} durationInFrames={UNSINKABLE_LAB_DURATION} {...VIDEO} />
    <Composition id="skyscraper-lab" component={SkyscraperLab} durationInFrames={SKYSCRAPER_LAB_DURATION} {...VIDEO} />
    <Composition id="vault-lab" component={VaultLab} durationInFrames={VAULT_LAB_DURATION} {...VIDEO} />
    <Composition id="carrier-lab" component={CarrierLab} durationInFrames={CARRIER_LAB_DURATION} {...VIDEO} />
    <Composition id="dam-lab" component={DamLab} durationInFrames={DAM_LAB_DURATION} {...VIDEO} />
  </>
);
