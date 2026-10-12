/** ISO 3166-1 alpha-2 code → English short name. */
export const COUNTRY_NAMES: Record<string, string> = {
  AD: "Andorra", AE: "United Arab Emirates", AF: "Afghanistan", AG: "Antigua and Barbuda",
  AL: "Albania", AM: "Armenia", AO: "Angola", AR: "Argentina", AT: "Austria",
  AU: "Australia", AZ: "Azerbaijan", BA: "Bosnia and Herzegovina", BB: "Barbados",
  BD: "Bangladesh", BE: "Belgium", BF: "Burkina Faso", BG: "Bulgaria", BH: "Bahrain",
  BI: "Burundi", BJ: "Benin", BN: "Brunei", BO: "Bolivia", BR: "Brazil", BS: "Bahamas",
  BT: "Bhutan", BW: "Botswana", BY: "Belarus", BZ: "Belize", CA: "Canada",
  CD: "Congo (DRC)", CF: "Central African Republic", CG: "Congo", CH: "Switzerland",
  CI: "Côte d'Ivoire", CL: "Chile", CM: "Cameroon", CN: "China", CO: "Colombia",
  CR: "Costa Rica", CU: "Cuba", CV: "Cape Verde", CY: "Cyprus", CZ: "Czechia",
  DE: "Germany", DJ: "Djibouti", DK: "Denmark", DM: "Dominica", DO: "Dominican Republic",
  DZ: "Algeria", EC: "Ecuador", EE: "Estonia", EG: "Egypt", ER: "Eritrea", ES: "Spain",
  ET: "Ethiopia", FI: "Finland", FJ: "Fiji", FR: "France", GA: "Gabon",
  GB: "United Kingdom", GD: "Grenada", GE: "Georgia", GH: "Ghana", GI: "Gibraltar",
  GM: "Gambia", GN: "Guinea", GQ: "Equatorial Guinea", GR: "Greece", GT: "Guatemala",
  GW: "Guinea-Bissau", GY: "Guyana", HK: "Hong Kong", HN: "Honduras", HR: "Croatia",
  HT: "Haiti", HU: "Hungary", ID: "Indonesia", IE: "Ireland", IL: "Israel", IN: "India",
  IQ: "Iraq", IR: "Iran", IS: "Iceland", IT: "Italy", JM: "Jamaica", JO: "Jordan",
  JP: "Japan", KE: "Kenya", KG: "Kyrgyzstan", KH: "Cambodia", KM: "Comoros",
  KR: "South Korea", KW: "Kuwait", KZ: "Kazakhstan", LA: "Laos", LB: "Lebanon",
  LK: "Sri Lanka", LR: "Liberia", LS: "Lesotho", LT: "Lithuania", LU: "Luxembourg",
  LV: "Latvia", LY: "Libya", MA: "Morocco", MC: "Monaco", MD: "Moldova",
  ME: "Montenegro", MG: "Madagascar", MK: "North Macedonia", ML: "Mali", MM: "Myanmar",
  MN: "Mongolia", MO: "Macao", MR: "Mauritania", MT: "Malta", MU: "Mauritius",
  MV: "Maldives", MW: "Malawi", MX: "Mexico", MY: "Malaysia", MZ: "Mozambique",
  NA: "Namibia", NE: "Niger", NG: "Nigeria", NI: "Nicaragua", NL: "Netherlands",
  NO: "Norway", NP: "Nepal", NZ: "New Zealand", OM: "Oman", PA: "Panama", PE: "Peru",
  PG: "Papua New Guinea", PH: "Philippines", PK: "Pakistan", PL: "Poland",
  PR: "Puerto Rico", PS: "Palestine", PT: "Portugal", PY: "Paraguay", QA: "Qatar",
  RO: "Romania", RS: "Serbia", RU: "Russia", RW: "Rwanda", SA: "Saudi Arabia",
  SC: "Seychelles", SD: "Sudan", SE: "Sweden", SG: "Singapore", SI: "Slovenia",
  SK: "Slovakia", SL: "Sierra Leone", SN: "Senegal", SO: "Somalia", SR: "Suriname",
  SS: "South Sudan", SV: "El Salvador", SY: "Syria", TG: "Togo", TH: "Thailand",
  TJ: "Tajikistan", TL: "Timor-Leste", TM: "Turkmenistan", TN: "Tunisia", TR: "Turkey",
  TT: "Trinidad and Tobago", TW: "Taiwan", TZ: "Tanzania", UA: "Ukraine", UG: "Uganda",
  US: "United States", UY: "Uruguay", UZ: "Uzbekistan", VE: "Venezuela", VN: "Vietnam",
  YE: "Yemen", ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",
};

export type CountryOption = {
  value: string;
  label: string;
};

/** Every country, sorted by name, for a dropdown. */
export const COUNTRY_OPTIONS: CountryOption[] = Object.entries(COUNTRY_NAMES)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const countryName = (code: string | null | undefined): string =>
  (code && COUNTRY_NAMES[code.toUpperCase()]) || (code ?? "");

const NAME_TO_CODE = new Map(
  Object.entries(COUNTRY_NAMES).map(([code, name]) => [
    name.toLowerCase().replace(/[^a-z]/g, ""),
    code,
  ]),
);

// Spellings the sheet and the carriers use that are not the short name.
const ALIASES: Record<string, string> = {
  turkiye: "TR",
  uae: "AE",
  unitedarabemirates: "AE",
  usa: "US",
  unitedstatesofamerica: "US",
  uk: "GB",
  england: "GB",
  greatbritain: "GB",
  southkorea: "KR",
  korea: "KR",
  republicofkorea: "KR",
  hongkongchina: "HK",
  taiwanchina: "TW",
  russianfederation: "RU",
  vietnam: "VN",
  ivorycoast: "CI",
  czechrepublic: "CZ",
  macedonia: "MK",
  holland: "NL",
  thenetherlands: "NL",
  ksa: "SA",
  kingdomofsaudiarabia: "SA",
  syrianarabrepublic: "SY",
  iranislamicrepublicof: "IR",
};

/**
 * "China", "CN", "Turkiye" or "Shanghai/China" → "CN". Null when nothing in
 * the text is a country we know.
 */
export const resolveCountryCode = (value: string | null | undefined): string | null => {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }
  // A two-letter code on its own, or at the end of "BEIRUT, LB".
  const tail = raw.split(/[/,]/).pop()?.trim() ?? raw;
  const upper = tail.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && COUNTRY_NAMES[upper]) {
    return upper;
  }
  const key = tail.toLowerCase().replace(/[^a-z]/g, "");
  return ALIASES[key] ?? NAME_TO_CODE.get(key) ?? null;
};

/** The country two letters of a UN/LOCODE: "EGDAM" → "EG". */
export const countryFromLocode = (locode: string | null | undefined): string | null => {
  const code = (locode ?? "").toUpperCase();
  if (!/^[A-Z]{5}$/.test(code)) {
    return null;
  }
  const country = code.slice(0, 2);
  return COUNTRY_NAMES[country] ? country : null;
};
