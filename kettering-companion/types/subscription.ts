export interface MeetingTime {
    weekday: number;
    frequency: "weekly" | "biweekly" | "monthly";
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

export interface Officer {
    uid: string;
    name: string;
    email: string;
}

export interface Club extends Event{
    instagram?: string;
    officers?: string[];
}

export interface Event {
    id?: string;
    name: string;
    description?: string;
    location?: string;
    contactEmail: string;
    schedule: MeetingTime[];
    attendees?: string[];
}