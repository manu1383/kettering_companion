export interface MeetingTime {
    day: string;
    time: string;
}

export interface Officer {
    uid: string;
    name: string;
    email: string;
}

export interface Club {
    id?: string;
    name: string;
    description?: string;
    location?: string;
    contactEmail: string;
    instagram?: string;
    schedule: MeetingTime[];
    officers?: string[];
}