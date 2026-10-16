"use client";

import { Search, X } from "lucide-react";
import { useShipmentFilters } from "@/app/shipments/use-shipment-filters";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { carriers, shipmentStatuses } from "@/db/enum";
import { CARRIER_LABELS, SHIPMENT_STATUS_LABELS } from "@/db/label";
import { CountryOptionRow } from "@/services/shipments";
import { countryName } from "@/utils";

type ShipmentFiltersProps = {
  loadingCountries: CountryOptionRow[];
  dischargeCountries: CountryOptionRow[];
};

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  ...shipmentStatuses.map((status) => ({ value: status, label: SHIPMENT_STATUS_LABELS[status] })),
];

const CARRIER_OPTIONS = [
  { value: "", label: "Any line" },
  ...carriers.map((carrier) => ({ value: carrier, label: CARRIER_LABELS[carrier] })),
];

const countryOptions = (rows: CountryOptionRow[], anyLabel: string) => [
  { value: "", label: anyLabel },
  ...rows.map((row) => ({ value: row.code, label: `${countryName(row.code)} (${row.total})` })),
];

export const ShipmentFilters = ({ loadingCountries, dischargeCountries }: ShipmentFiltersProps) => {
  const { value, setFilter, clearAll, search, setSearch, hasFilters } = useShipmentFilters();

  return (
    <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute start-3 top-2.5 text-faint" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer, number, vessel or port"
          className="ps-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-none">
        <Dropdown
          value={value("from")}
          onChange={(next) => setFilter("from", next)}
          options={countryOptions(loadingCountries, "From any country")}
          className="lg:w-48"
        />
        <Dropdown
          value={value("to")}
          onChange={(next) => setFilter("to", next)}
          options={countryOptions(dischargeCountries, "To any country")}
          className="lg:w-48"
        />
        <Dropdown
          value={value("status")}
          onChange={(next) => setFilter("status", next)}
          options={STATUS_OPTIONS}
          className="lg:w-40"
        />
        <Dropdown
          value={value("carrier")}
          onChange={(next) => setFilter("carrier", next)}
          options={CARRIER_OPTIONS}
          className="lg:w-40"
        />
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-ink lg:self-auto"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
};
