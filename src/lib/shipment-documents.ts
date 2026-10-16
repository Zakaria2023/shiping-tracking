/** Largest file a shipment document may be (25 MB). */
export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** The file types a shipment document may be, by extension. */
const DOCUMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** What the file picker offers. */
export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

/**
 * The content type to store a file under, or null when it is not a document
 * type this app takes. Read from the extension, since browsers leave a file's
 * own type blank for some Office files.
 */
export const documentContentType = (fileName: string): string | null => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return DOCUMENT_TYPES[extension] ?? null;
};

/** Why a file cannot be attached, or null when it can. */
export const documentProblem = (fileName: string, sizeBytes: number): string | null => {
  if (!documentContentType(fileName)) {
    return `${fileName}: use PDF, an image, Word or Excel`;
  }
  if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    return `${fileName}: larger than 25 MB`;
  }
  if (sizeBytes === 0) {
    return `${fileName}: the file is empty`;
  }
  return null;
};

const SIZE_FORMAT = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

/** "840 KB", "2.4 MB". */
export const formatFileSize = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${SIZE_FORMAT.format(Math.max(1, bytes / 1024))} KB`
    : `${SIZE_FORMAT.format(bytes / (1024 * 1024))} MB`;
