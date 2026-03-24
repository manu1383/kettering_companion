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

    let end: Date;
    if (!rule.endDate) {
      end = new Date(start);
    } else {
      const [ey, em, ed] = rule.endDate.split("-").map(Number);
      end = new Date(ey, em - 1, ed);
    }

    const weekdays = rule.weekdays || [];

    if (!weekdays.length && (!rule.frequency || rule.frequency === "never")) {
      meetings.push({
        date: new Date(start),
        startTime: rule.startTime,
        endTime: rule.endTime,
      });
      continue;
    }

    if (!rule.frequency || rule.frequency === "never") {
      for (const day of weekdays) {
        let current = new Date(start);

        // move forward until matching weekday
        while (current.getDay() !== day) {
          current.setDate(current.getDate() + 1);
        }

        // only include if within range
        if (current <= end) {
          meetings.push({
            date: new Date(current),
            startTime: rule.startTime,
            endTime: rule.endTime,
          });
        }
      }

      continue;
    }

    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();

      if (
        weekdays.includes(day) &&
        matchesFrequency(start, current, rule.frequency)
      ) {
        meetings.push({
          date: new Date(current),
          startTime: rule.startTime,
          endTime: rule.endTime,
        });
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return meetings;
}

/* =============================
   Helper: Frequency Matching
============================= */

function matchesFrequency(
  start: Date,
  current: Date,
  frequency: string
) {
  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const diffWeeks = Math.floor(diffDays / 7);

  if (frequency === "weekly") return true;

  if (frequency === "biweekly") {
    return diffWeeks % 2 === 0;
  }

  if (frequency === "monthly") {
    return current.getDate() === start.getDate();
  }

  return true;
}