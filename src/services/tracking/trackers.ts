import { AutoTrackedCarrier } from "@/lib/carrier-tracking";
import { fetchArkasTracking } from "./arkas";
import { fetchCoscoTracking } from "./cosco";
import { fetchFirstFlightTracking } from "./first-flight";
import { fetchOneTracking } from "./one";
import { CarrierSnapshot } from "./types";
import { fetchYangMingTracking } from "./yang-ming";

/** The one place a line is wired to the call that asks it about a number. */
export const TRACKERS: Record<AutoTrackedCarrier, (trackingNumber: string) => Promise<CarrierSnapshot>> = {
  yang_ming: fetchYangMingTracking,
  cosco: fetchCoscoTracking,
  one: fetchOneTracking,
  arkas: fetchArkasTracking,
  first_flight: fetchFirstFlightTracking,
};
