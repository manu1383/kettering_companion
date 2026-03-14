import { MeetingTime } from "../types/subscription";

export function generateMeetingDates(schedule: MeetingTime[]) {

  const meetings: {
    date: Date;
    startTime: string;
    endTime: string;
  }[] = [];

  schedule.forEach(rule => {

    const [sy, sm, sd] = rule.startDate.split("-").map(Number);
    const [ey, em, ed] = rule.endDate.split("-").map(Number);

    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    let current = new Date(start);
    const weekday = Number(rule.weekday);

    // Move to first correct weekday
    while (current.getDay() !== weekday) {
      current.setDate(current.getDate() + 1);
    }

    const increment =
      rule.frequency === "weekly" ? 7 :
      rule.frequency === "biweekly" ? 14 :
      28;

    while (current <= end) {

      meetings.push({
        date: new Date(current),
        startTime: rule.startTime,
        endTime: rule.endTime
      });

      current.setDate(current.getDate() + increment);

    }

  });

  return meetings;

}
