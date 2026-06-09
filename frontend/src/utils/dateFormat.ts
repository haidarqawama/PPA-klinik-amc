const MIN_EXPIRE_YEAR = 1990;
const MAX_EXPIRE_YEAR_OFFSET = 15;

export function isValidExpireDate(date?: string): boolean {
  if (!date || date === "0000-00-00") {
    return false;
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return false;
  }

  const year = parsed.getFullYear();
  const maxYear = new Date().getFullYear() + MAX_EXPIRE_YEAR_OFFSET;

  return year >= MIN_EXPIRE_YEAR && year <= maxYear;
}

export function formatDate(
  date?: string
) {

  if (!isValidExpireDate(date)) {
    return "-"
  }

  const parsed =
    new Date(date!)

  return parsed
    .toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )
}

export function formatDateTime(dateString: string, timeString?: string): string {
  const formattedDate = formatDate(dateString);
  if (timeString) {
    return `${formattedDate} ${timeString}`;
  }
  return formattedDate;
}
