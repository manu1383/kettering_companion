export async function copyCalendar(userId: string, month: string) {

  const url =
    `https://refreshcalendar-m4xsf223ca-uc.a.run.app` +
    `?userId=${userId}&month=${month}&force=true`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Calendar fetch failed");
  }

  return await res.json();
}