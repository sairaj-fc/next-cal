import { Availability } from "@prisma/client";
import dayjs, { ConfigType, Dayjs } from "../dayjs";

// By default starts on Sunday (Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
export function weekdayNames(
  locale: string | string[],
  weekStart = 0,
  type: "short" | "long" = "long"
) {
  return Array.from(Array(7).keys()).map((d) =>
    nameOfDay(locale, d + weekStart, type)
  );
}

export function nameOfDay(
  locale: string | string[],
  day: number,
  type: "short" | "long" = "long"
) {
  return new Intl.DateTimeFormat(locale, { weekday: type }).format(
    new Date(1970, 0, day + 4)
  );
}

export const defaultDayRange: TimeRange = {
  start: new Date(new Date().setUTCHours(9, 0, 0, 0)),
  end: new Date(new Date().setUTCHours(17, 0, 0, 0)),
};

// types
export type TimeRange = {
  start: Date;
  end: Date;
};

export const DEFAULT_SCHEDULE: Schedule = [
  [],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [defaultDayRange],
  [],
];

export type Schedule = TimeRange[][];

export function getAvailabilityFromSchedule(
  schedule: Schedule
): Availability[] {
  return schedule.reduce(
    (availability: Availability[], times: TimeRange[], day: number) => {
      const addNewTime = (time: TimeRange) =>
        ({
          days: [day],
          start_time: time.start,
          end_time: time.end,
        } as Availability);

      const filteredTimes = times.filter((time) => {
        let idx;
        if (
          (idx = availability.findIndex(
            (schedule) =>
              schedule.start_time.toString() === time.start.toString() &&
              schedule.end_time.toString() === time.end.toString()
          )) !== -1
        ) {
          availability[idx].days.push(day);
          return false;
        }
        return true;
      });
      filteredTimes.forEach((time) => {
        availability.push(addNewTime(time));
      });
      return availability;
    },
    [] as Availability[]
  );
}

export function availabilityAsString(availability: Availability) {
  const locale = "en";
  const weekSpan = (availability: Availability) => {
    const days = availability.days.slice(1).reduce(
      (days, day) => {
        if (
          days[days.length - 1].length === 1 &&
          days[days.length - 1][0] === day - 1
        ) {
          // append if the range is not complete (but the next day needs adding)
          days[days.length - 1].push(day);
        } else if (
          days[days.length - 1][days[days.length - 1].length - 1] ===
          day - 1
        ) {
          // range complete, overwrite if the last day directly preceeds the current day
          days[days.length - 1] = [days[days.length - 1][0], day];
        } else {
          // new range
          days.push([day]);
        }
        return days;
      },
      [[availability.days[0]]] as number[][]
    );
    return days
      .map((dayRange) =>
        dayRange.map((day) => nameOfDay(locale, day, "short")).join(" - ")
      )
      .join(", ");
  };

  const timeSpan = (availability: Availability) => {
    return (
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "numeric",
      }).format(
        new Date(new Date(availability.start_time).toISOString().slice(0, -1))
      ) +
      " - " +
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "numeric",
      }).format(
        new Date(new Date(availability.end_time).toISOString().slice(0, -1))
      )
    );
  };

  return weekSpan(availability) + ", " + timeSpan(availability);
}

export const MINUTES_IN_DAY = 60 * 24;
export const MINUTES_DAY_END = MINUTES_IN_DAY - 1;
export const MINUTES_DAY_START = 0;

export type WorkingHours = {
  days: number[];
  startTime: number;
  endTime: number;
};

export function getWorkingHours(
  relativeTimeUnit: {
    timeZone?: string;
    utcOffset?: number;
  },
  availability: { days: number[]; startTime: ConfigType; endTime: ConfigType }[]
) {
  // clearly bail when availability is not set, set everything available.
  if (!availability.length) {
    return [
      {
        days: [0, 1, 2, 3, 4, 5, 6],
        // shorthand for: dayjs().startOf("day").tz(timeZone).diff(dayjs.utc().startOf("day"), "minutes")
        startTime: MINUTES_DAY_START,
        endTime: MINUTES_DAY_END,
      },
    ];
  }

  const utcOffset =
    relativeTimeUnit.utcOffset ??
    dayjs().tz(relativeTimeUnit.timeZone).utcOffset();

  const workingHours = availability.reduce(
    (workingHours: WorkingHours[], schedule) => {
      // Get times localised to the given utcOffset/timeZone
      const startTime =
        dayjs.utc(schedule.startTime).get("hour") * 60 +
        dayjs.utc(schedule.startTime).get("minute") -
        utcOffset;
      const endTime =
        dayjs.utc(schedule.endTime).get("hour") * 60 +
        dayjs.utc(schedule.endTime).get("minute") -
        utcOffset;
      // add to working hours, keeping startTime and endTimes between bounds (0-1439)
      const sameDayStartTime = Math.max(
        MINUTES_DAY_START,
        Math.min(MINUTES_DAY_END, startTime)
      );
      const sameDayEndTime = Math.max(
        MINUTES_DAY_START,
        Math.min(MINUTES_DAY_END, endTime)
      );

      if (sameDayStartTime !== sameDayEndTime) {
        workingHours.push({
          days: schedule.days,
          startTime: sameDayStartTime,
          endTime: sameDayEndTime,
        });
      }
      // check for overflow to the previous day
      // overflowing days constraint to 0-6 day range (Sunday-Saturday)
      if (startTime < MINUTES_DAY_START || endTime < MINUTES_DAY_START) {
        workingHours.push({
          days: schedule.days.map((day) => (day - 1 >= 0 ? day - 1 : 6)),
          startTime: startTime + MINUTES_IN_DAY,
          endTime: Math.min(endTime + MINUTES_IN_DAY, MINUTES_DAY_END),
        });
      }
      // else, check for overflow in the next day
      else if (startTime > MINUTES_DAY_END || endTime > MINUTES_DAY_END) {
        workingHours.push({
          days: schedule.days.map((day) => (day + 1) % 7),
          startTime: Math.max(startTime - MINUTES_IN_DAY, MINUTES_DAY_START),
          endTime: endTime - MINUTES_IN_DAY,
        });
      }

      return workingHours;
    },
    []
  );

  workingHours.sort((a, b) => a.startTime - b.startTime);

  return workingHours;
}

// converts a date to 2022-04-25 for example.
export const yyyymmdd = (date: Date | Dayjs) =>
  date instanceof Date
    ? dayjs(date).format("YYYY-MM-DD")
    : date.format("YYYY-MM-DD");

export const daysInMonth = (date: Date | Dayjs) =>
  date instanceof Date ? dayjs(date).daysInMonth() : date.daysInMonth();

export function classNames(...classes: unknown[]) {
  return classes.filter(Boolean).join(" ");
}
