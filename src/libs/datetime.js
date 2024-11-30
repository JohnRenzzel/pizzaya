export function dbTimeForHuman(str) {
  const utcDate = new Date(str);
  utcDate.setHours(utcDate.getHours() + 8);
  const datePart = utcDate.toISOString().substring(0, 10);
  const timePart = utcDate.toISOString().substring(11, 16);
  let [hours, minutes] = timePart.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;
  return `${datePart} ${formattedTime}`;
}
