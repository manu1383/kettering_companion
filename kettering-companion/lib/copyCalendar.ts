export async function copyCalendar(userId: string, month: string) {
  const url =
    `https://us-central1-kettering-connect.cloudfunctions.net/refreshCalendar` +
    `?userId=${userId}&month=${month}&force=true`;

  const res = await fetch(url);

  const text = await res.text(); // 👈 prevents silent crashes
  console.log("Calendar raw response:", text);

  if (!res.ok) {
    throw new Error("Calendar fetch failed");
  }

  return JSON.parse(text);
}