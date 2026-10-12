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
