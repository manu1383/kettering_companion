// /lib/validateIntramural.ts
import { Intramural } from "../types/subscription";
import { parseTime } from "./time";
import { isValidDateFormat } from "./validateEntity";

export type FormErrors = {
    general?: string;
    team1?: string;
    team2?: string;
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    sport?: string;
    tourney?: string;
};

export type IntramuralValidationResult = {
    errors: FormErrors;
    parsedStart?: string | null;
    parsedEnd?: string | null;
};

export function validateIntramural(
    values: Intramural
): IntramuralValidationResult {
    const errors: FormErrors = {};
    const time = values.schedule?.[0];

    let parsedStart: string | null | undefined;
    let parsedEnd: string | null | undefined;

    // Teams
    if (!values.team1?.trim()) {
        errors.team1 = "Team 1 is required.";
    }

    if (!values.team2?.trim()) {
        errors.team2 = "Team 2 is required.";
    }

    // Location
    if (!values.location?.trim()) {
        errors.location = "Location is required.";
    }

    // Sport
    if (!values.sport?.trim()) {
        errors.sport = "Sport is required.";
    }

    // Tourney
    if (!values.tourney?.trim()) {
        errors.tourney = "Tourney is required.";
    }

    // Date
    if (!time?.startDate) {
        errors.date = "Game date is required.";
    } else if (!isValidDateFormat(time.startDate)) {
        errors.date = "Date must be in YYYY-MM-DD format.";
    }

    // Time
    parsedStart = parseTime(time?.startTime);
    parsedEnd = parseTime(time?.endTime);
    if (!parsedStart || !parsedEnd) {
        errors.startTime = "Please enter valid start and end times.";
    } else if (parsedStart >= parsedEnd) {
        errors.startTime = "End time must be after start time.";
    }

    if (Object.keys(errors).length > 0) {
        errors.general = "Please fix the errors below.";
    }

    return { errors, parsedStart, parsedEnd };
}