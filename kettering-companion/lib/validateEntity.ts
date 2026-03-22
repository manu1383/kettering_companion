import { Club } from "../types/subscription";
import { parseTime } from "./time";
// Validation logic for clubs, events, fitness classes, and intramurals
export type ValidationResult = {
  errors: FormErrors;
  parsedStart?: string | null;
  parsedEnd?: string | null;
}
// Main validation function that checks form values based on the entity type
export type EntityType =
  | "club"
  | "event"
  | "fitness";
// Validates form values for clubs, events, and fitness classes
export type FormErrors = {
  general?: string;
  name?: string;
  location?: string;
  email?: string;
  officer?: string;
  time?: string;
  date?: string;
};

export function validateEntity(
  values: Club,
  type: EntityType
): ValidationResult {
  const errors: FormErrors = {};
  const time = values.schedule?.[0];
  // Variables to hold parsed start and end times for validation results
  let parsedStart: string | null | undefined;
  let parsedEnd: string | null | undefined;
  
  if (!values.name?.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.location?.trim()) {
    errors.location = "Location is required.";
  }

  if (type === "event") {
    if (!values.contactEmail?.trim()) {
      errors.email = "Contact email is required.";
    } else if (!isValidEmail(values.contactEmail)) {
      errors.email = "Invalid email format.";
    }
  }

  // Officer / Instructor
  if (type === "club" || type === "fitness") {
    const officer = values.officers?.[0];

    if (!officer?.trim()) {
      errors.officer = "Officer/Instructor email is required.";
    } else if (!isValidEmail(officer)) {
      errors.officer = "Invalid email format.";
    }
  }

  if (time) {
    if (!time.startDate) {
      errors.date = "Start date is required.";
    } else if (type !== "event" && !time.endDate) {
      errors.date = "End date is required.";
    } 

    if (time.startDate && !isValidDateFormat(time.startDate)) {
      errors.date = "Start date must be in YYYY-MM-DD format.";
    }
    if (type !== "event" && time.endDate && !isValidDateFormat(time.endDate)) {
      errors.date = "End date must be in YYYY-MM-DD format.";
    }

    parsedStart = parseTime(time.startTime);
    parsedEnd = parseTime(time.endTime);

    if (!parsedStart || !parsedEnd) {
      errors.time = "Please enter valid start and end times.";
    } else if (parsedStart >= parsedEnd) {
      errors.time = "End time must be after start time.";
    }
    
  } else {
    errors.time = "Schedule is required.";
  }

  if (type !== "event") {
    if (!time?.weekdays || time.weekdays.length === 0) {
      errors.time = "Select at least one day.";
    }
  }

  if (Object.keys(errors).length > 0 && !errors.general) {
    errors.general = "Please fix the errors below.";
  }

  return { errors, parsedStart, parsedEnd };
}

// Helper function to validate email format using a simple regex
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// Helper function to validate date format (YYYY-MM-DD) and check if it's a valid calendar date
export function isValidDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);

  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}
