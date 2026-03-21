import { MeetingTime } from "../types/subscription";

export function generateMeetingDates(schedule: MeetingTime[]) {

  const meetings: {
    date: Date;
    startTime: string;
    endTime: string;
  }[] = [];

  console.log("Incoming schedule:", schedule);

  for (const rule of schedule) {

    console.log("Generator received:", rule);

    if (!rule.startDate) continue;
    if (!rule.startTime || !rule.endTime) continue;

    const [sy, sm, sd] = rule.startDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);

    // ✅ Treat missing frequency as a single event
    if (!rule.frequency || rule.frequency === "never") {
      meetings.push({
        date: start,
        startTime: rule.startTime,
        endTime: rule.endTime
      });
      continue;
    }

    let end: Date;
    if (!rule.endDate) {
      // default: 3 months after start
      end = new Date(start);
    } else {
      const [ey, em, ed] = rule.endDate.split("-").map(Number);
      end = new Date(ey, em - 1, ed);
    }

    let current = new Date(start);

    const increment =
      rule.frequency === "weekly" ? 7 :
      rule.frequency === "biweekly" ? 14 :
      28;

    while (current <= end) {

      meetings.push({
        date: new Date(current),
        startTime: rule.startTime,
        endTime: rule.endTime,
      });

      current.setDate(current.getDate() + increment);
    }
  }

  return meetings;
}