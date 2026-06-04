export function formatDate(
  date?: string
) {

  if (
    !date ||
    date === "0000-00-00"
  ) {
    return "-"
  }

  const parsed =
    new Date(date)

  if (
    isNaN(
      parsed.getTime()
    )
  ) {
    return "-"
  }

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
