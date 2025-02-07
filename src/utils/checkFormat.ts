import dayjs from "dayjs";

export function isValidDateTime(
  dateTime: string,
  format: string = "YYYY-MM-DD HH:mm:ss"
): boolean {
  if (dateTime.length < 12) {
    return false;
  }
  return dayjs(dateTime, format, true).isValid();
}
