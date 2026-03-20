export interface MeetingTime {
    weekdays?: number[];
    frequency?: "weekly" | "biweekly" | "monthly" | "never";
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
}

export interface Officer {
    uid: string;
    name: string;
    email: string;
}

export interface Club extends Event{
    officers?: string[];
}

export interface Event {
    id?: string;
    name: string;
    description?: string;
    location?: string;
    contactEmail?: string;
    schedule: MeetingTime[];
    attendees?: string[];
}

export interface Intramural {
    id: string;
    team1: string;
    team2: string;

    team1Id: string;
    team2Id: string;

    name: string;
    location: string;
    schedule: MeetingTime[];
    sport: string;
    tourney: string;
}

