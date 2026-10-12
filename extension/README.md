# MSC capture extension

MSC's tracking page is behind bot protection, so the app's server cannot read
it. A normal Chrome window can. This extension sits in that Chrome and, whenever
an MSC tracking page is open, sends the result the page received to the app.
Nothing is typed, copied or pasted.

## Install (once per computer)

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `extension` folder.
4. Click **Details** on the new extension, then **Extension options**.
5. Enter the app URL (`http://localhost:3010` while developing, the deployed
   address later) and the token from the app's `.env.local`
   (`TRACKING_INGEST_TOKEN`). Save.

## Use

Open any MSC shipment in the app and click **Open MSC page**. The MSC page
loads, the extension captures the result and a small note at the bottom-right
of the page says which shipment was updated. Back in the app, the shipment
shows the new status and events.

The same happens for any MSC tracking page opened any other way, as long as the
bill of lading, booking or container number is on a shipment in the app.

## What it reads

Only `https://www.msc.com/*`, and only the `TrackingInfo` response. It is never
published to the Chrome Web Store; it loads from this folder.
