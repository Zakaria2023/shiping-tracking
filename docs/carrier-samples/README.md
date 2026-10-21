# Carrier samples

Real responses captured on 2026-10-12, kept so the tracking adapters are built
against what the carriers actually return rather than what their pages show.

## Yang Ming — `yangming-gettracking-*.json`

Public backend behind the cargo tracking page. No login, no captcha. Our server
calls it directly:

    GET https://www.yangming.com/api/CargoTracking/GetTracking
        ?paramTrackNo=<BL or container or booking>&paramTrackPosition=SEARCH&paramRefNo=
    headers: Accept: application/json, a browser User-Agent,
             Referer: https://www.yangming.com/en/esolution/tracking/cargo_tracking

The page first calls `GET /api/Public/GetBlockStatus`; an address that misbehaves
is put on a blacklist and sent to an identity-verification page. Keep calls to a
few per shipment per day, spread out.

Result lives in `blList[0]` (or `bookingList[0]` / `containerList[0]`):
`basicInfo` (ports, vessel, voyage, on-board date, packages, weight, CBM,
container count), `routingInfo.routingSchedule[]` (place, dateTime,
dateQlfr = Actual|Estimated), `containerInfo[]` (per container: lastEvent,
place, moveDate, dportETA).

## MSC — `msc-trackinginfo-*.json`

The tracking page is behind Akamai bot protection: every server request, and
headless Chrome, get `403 Access Denied`. A normal Chrome window on an office
connection is served the page. The page then calls an XHR named `TrackingInfo`
(POST, `https://www.msc.com/api/feature/tools/TrackingInfo`) whose JSON response
is this sample. Captured by a person from DevTools → Network → TrackingInfo →
Response. The MSC adapter therefore runs inside a real browser (extension or
local helper) and intercepts/reads this response; it never calls the URL from a
server.

Shape: `Data.BillOfLadings[]` → `GeneralTrackingInfo` (PortOfLoad,
PortOfDischarge, Transshipments[], FinalPodEtaDate) and `ContainersInfo[]`
(ContainerNumber, ContainerType, Delivered, PodEtaDate, LatestMove, `Events[]`
newest first with Description, Date, Location, UnLocationCode, vessel + voyage in
`Detail`). Dates are `DD/MM/YYYY`.

## The other lines — probed 2026-10-21

Tried with plain server requests (a Chrome User-Agent and the page's Referer),
a handful of calls each. Wired in `src/lib/carrier-tracking.ts` and
`src/services/tracking/trackers.ts`.

**Read by the server** (on save, on Refresh and by the daily cron):

- **COSCO** — `cosco-*.json`. `GET https://elines.coscoshipping.com/ebtracking/public/bill/<B/L without COSU>`
  (legs, separate estimated and actual dates) and `.../public/bill/containers/<same>`
  (each box's latest move); `.../public/containers/<container>` for a box on its own.
  Dates `YYYY-MM-DD HH:mm`, port time. Anonymous callers get no fuller history.
- **ONE** — `one-*.json`. `POST https://ecomm.one-line.com/api/v2/edh/containers/track-and-trace/search`
  with `{"page":1,"page_length":20,"filters":{"search_text":"<no>","search_type":"BKG_NO"|"CNTR_NO"}}`
  and Origin `https://www.one-line.com`; then `GET .../cop-events?booking_no=&container_no=` per box.
  `eventLocalPortDate` is port time with a `Z` it does not mean. E106/E138 = delivered.
- **Arkas** — `GET https://webtrackingprodnew.arkasline.com.tr/api/request/Get?controllerMethod=webtracking/api/shipmenttracking/GetDocumentationAsync&prms={"key":"<no>"}`,
  then `GetDocumentationHistoryAsync` with `{"documentationId":<id>}` per box. The answer is JSON
  inside a JSON string. `isDummy` = planned move. No real number seen yet.
- **First Flight** (courier, for documents) — `POST https://webapi.firstflightme.com/api/user/track-by-awb`
  with `{"number":"<awb>"}`. An unknown number is echoed back with every other field null.
  `Status` "POD" = delivered. Date format not yet seen; read loosely. No real number seen yet.

**Browser only** — the server is turned away:

- MSC (Akamai), OOCL (Cloudflare challenge), CMA CGM (DataDome), Hapag-Lloyd (Cloudflare),
  Maersk (Akamai). CMA CGM, Hapag-Lloyd and Maersk have official DCSA APIs behind a registered key.
- Turkon — Cloudflare lets curl through but answers 403 to Node's fetch. Its API:
  `POST https://myturkonline.turkon.com/shipping-prod-service/tracking/getTrackingLowerInformation/en/<no>`
  with `{"token":null,"cookie":null}`; events at `payload[].getKonteynerTakipEventSet.results[]`.
- M Line and Tarros reset every connection from servers.

**Not lines:** TransWagon (cs.groupwagon.com) is a forwarder whose page forwards to track-trace.com.
MarineTraffic is vessel AIS; its JSON answers plain requests but its terms forbid automated use,
so bulk shipments only get a "Find vessel on MarineTraffic" link.
