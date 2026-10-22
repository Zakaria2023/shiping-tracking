import {
  carriers,
  containerSizes,
  currencies,
  shipmentKinds,
  shipmentStatuses,
  trackingNumberTypes,
} from "@/db/enum";
import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Day/month/year, e.g. 27/10/2026")
  .optional()
  .or(z.literal(""));

const cargoLineSchema = z.object({
  grossWeightKg: z
    .string()
    .trim()
    .regex(/^\d{0,11}(\.\d{0,3})?$/, "Weight in kilograms, numbers only")
    .optional()
    .or(z.literal("")),
  containerCount: z
    .string()
    .trim()
    .regex(/^\d{0,5}$/, "Whole number")
    .optional()
    .or(z.literal("")),
  containerSize: z.enum(containerSizes).optional().or(z.literal("")),
  price: z
    .string()
    .trim()
    .regex(/^\d{0,12}(\.\d{0,2})?$/, "Price, numbers only")
    .optional()
    .or(z.literal("")),
});

export type CargoLineFormValues = z.infer<typeof cargoLineSchema>;

export const shipmentFormSchema = z
  .object({
    customerName: optionalText(160),
    kind: z.enum(shipmentKinds),
    carrier: z.enum(carriers),
    carrierName: optionalText(120),
    trackingNumber: optionalText(64),
    trackingNumberType: z.enum(trackingNumberTypes),
    vesselName: optionalText(120),
    voyage: optionalText(40),
    portOfLoading: z.string().trim().min(1, "Port of loading is required").max(120),
    loadingCountry: z.string().length(2, "Choose the country"),
    portOfDischarge: z.string().trim().min(1, "Port of discharge is required").max(120),
    dischargeCountry: z.string().length(2, "Choose the country"),
    cargoLines: z.array(cargoLineSchema).max(50),
    priceCurrency: z.enum(currencies),
    etd: isoDate,
    eta: isoDate,
    status: z.enum(shipmentStatuses),
    currentLocation: optionalText(160),
    nextLocation: optionalText(160),
    notes: optionalText(2000),
  })
  .superRefine((values, ctx) => {
    // Until a line is booked there is no number to give.
    if (values.kind === "container" && values.carrier !== "not_yet" && !values.trackingNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["trackingNumber"],
        message: "A container shipment needs its tracking number",
      });
    }
    if (values.kind === "bulk" && !values.vesselName) {
      ctx.addIssue({
        code: "custom",
        path: ["vesselName"],
        message: "A bulk shipment needs the vessel name",
      });
    }
    if (values.carrier === "other" && !values.carrierName) {
      ctx.addIssue({
        code: "custom",
        path: ["carrierName"],
        message: "Name the shipping line",
      });
    }
  });

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(shipmentStatuses),
  currentLocation: optionalText(160),
  nextLocation: optionalText(160),
  locked: z.boolean(),
});

export type StatusUpdateValues = z.infer<typeof statusUpdateSchema>;
