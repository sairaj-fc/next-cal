import { useGet } from "@comps/useGet";
import React from "react";
import { Availability, Schedule as DbSchedule } from "@prisma/client";

import {
  createContext,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs, { ConfigType, Dayjs } from "@lib/dayjs";
import {
  availabilityAsString,
  defaultDayRange,
  DEFAULT_SCHEDULE,
  getAvailabilityFromSchedule,
  Schedule,
  TimeRange,
  weekdayNames,
} from "@lib/utils";
import axios from "axios";
import { Button } from "@comps/Button";
import { useOnClickOutside } from "@comps/useOnClickOutside";
import Link from "next/link";
import TimezoneSelect from "react-timezone-select";

const AvailabilityPage = () => {
  const { data, loading, error } = useGet<
    (DbSchedule & {
      availability: Availability[];
    })[]
  >(async () => {
    const res = await axios.get("/api/schedule");
    return res.data.schedules || [];
  });

  if (error) {
    return <div>Error</div>;
  }

  if (loading) {
    return <div>Loading....</div>;
  }

  return (
    <div>
      <h1 className="text-2xl text-black font-semibold">Availability</h1>
      {!data || data.length === 0 ? (
        <div className="mt-6 text-center min-h-[200px] grid place-items-center">
          No Availabilities
        </div>
      ) : (
        <div className="mt-6">
          {data.map((s) => (
            <Link href={`availability/${s.id}`} key={s.id}>
              <a className="block hover:bg-gray-100 py-4 px-3">
                <h3 className="text-slate-700 text-xl">{s.name}</h3>
                {s.availability.map((i) => (
                  <div key={`${i.id}`}>{availabilityAsString(i)}</div>
                ))}
              </a>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-16">
        <h1 className="text-2xl text-black font-semibold">
          Create Availability
        </h1>

        <Availablility name="schedule" />
      </div>
    </div>
  );
};

export default AvailabilityPage;

const AvailabilityContext = createContext<{
  schedule: Schedule;
  setSchedule: Dispatch<SetStateAction<Schedule>>;
}>({
  schedule: DEFAULT_SCHEDULE,
  setSchedule: () => {},
});

const useAvailability = () => useContext(AvailabilityContext);

const Availablility = ({ name }: { name: string }) => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [scheduleName, setScheduleName] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(dayjs.tz.guess());

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const avai = getAvailabilityFromSchedule(schedule);

    const res = await axios.post("/api/schedule", {
      availability: avai,
      name: scheduleName,
      timezone: selectedTimezone,
    });
    console.log(res);
  };

  return (
    <AvailabilityContext.Provider
      value={{
        schedule,
        setSchedule,
      }}
    >
      <form autoComplete="off" onSubmit={onSubmit} className="mb-8">
        <div className="flex items-center justify-between space-x-6">
          <div>
            <label className="block mt-4" htmlFor="scheduleName">
              Schedule Name
            </label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => {
                setScheduleName(e.target.value);
              }}
              id="scheduleName"
            />
          </div>
          <div className="w-full h-full mt-3">
            <div className="text-base flex items-center justify-between">
              <label htmlFor="timezone">Select Timezone</label>
              <span className="text-black">
                Current Time {dayjs().tz(selectedTimezone).format("LT")}
              </span>
            </div>
            <TimezoneSelect
              id="timezone"
              value={selectedTimezone}
              onChange={({ value, ...rest }) => {
                console.log(rest);
                setSelectedTimezone(value);
              }}
            />
          </div>
        </div>
        <fieldset className="divide-y divide-gray-200 mb-16 mt-6">
          {weekdayNames("en").map((weekday, num) => (
            <ScheduleBlock key={num} name={name} weekday={weekday} day={num} />
          ))}
        </fieldset>
        <Button type="submit">Submit</Button>
      </form>
    </AvailabilityContext.Provider>
  );
};

type ScheduleBlockProps = {
  day: number;
  weekday: string;
  name: string;
};

const ScheduleBlock = ({ name, weekday, day }: ScheduleBlockProps) => {
  const { schedule, setSchedule } = useAvailability();
  const [checked, setChecked] = useState(() => schedule[day].length > 0);

  const values = schedule[day];

  return (
    <div className="py-2 flex items-center justify-between">
      <label className="flex items-center space-x-2">
        <input
          name={`${name}.${day}.checkbox`}
          defaultChecked={checked}
          onChange={(e) => {
            const checked = e.target.checked;
            setChecked(checked);
            if (checked) {
              const index = day;
              const newSchedule = schedule;
              newSchedule[index] = [defaultDayRange];
              setSchedule(newSchedule);
            } else {
              const index = day;
              const newSchedule = schedule;
              newSchedule[index] = [];
              setSchedule(newSchedule);
            }
          }}
          type="checkbox"
        />
        <p>{weekday}</p>
      </label>
      <div>
        {values.length > 0 ? (
          <DayRanges day={day} dayRanges={values} />
        ) : (
          <div>No Availability</div>
        )}
      </div>
    </div>
  );
};

export const DayRanges = ({
  dayRanges,
  day,
}: {
  dayRanges: TimeRange[];
  day: number;
}) => {
  const currentDayRange = dayRanges[0];

  const minEnd = currentDayRange.start;
  const maxStart = currentDayRange.end;

  return (
    <div className="flex items-center space-x-3">
      <LazySelect
        day={day}
        max={maxStart}
        type="start"
        value={currentDayRange.start}
      />
      <span>-</span>
      <LazySelect
        day={day}
        min={minEnd}
        type="end"
        value={currentDayRange.end}
      />
    </div>
  );
};

const LazySelect = ({
  type,
  value,
  min,
  max,
  day,
  ...props
}: {
  type: "start" | "end";
  value?: ConfigType;
  min?: ConfigType;
  max?: ConfigType;
  day: number;
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const { filter, options } = useOptions();
  const { setSchedule, schedule } = useAvailability();

  const [open, setOpen] = useState(false);

  useOnClickOutside(selectRef, () => {
    setOpen(false);
  });

  useEffect(() => {
    filter({ current: value });
  }, [filter, value]);

  useEffect(() => {
    if (open) {
      if (min) {
        filter({ offset: min });
      }
      if (max) {
        filter({ limit: max });
      }
    }
  }, [filter, max, min, open]);

  return (
    <select
      name={type}
      onClick={() => setOpen(true)}
      className="max-h-56"
      value={
        options.find(
          (option) => option.value === dayjs(value).toDate().valueOf()
        )?.value
      }
      onChange={(e) => {
        const value = new Date(+e.target.value);
        const newSchedule = [...schedule];
        newSchedule[day][0] = {
          ...newSchedule[day][0],
          [type]: value,
        };
        setSchedule(newSchedule);
        setOpen(false);
      }}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

type Option = {
  readonly label: string;
  readonly value: number;
};

const useOptions = () => {
  // Get user so we can determine 12/24 hour format preferences
  const increment = 15;
  const timeFormat = 12;

  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);

  const options = useMemo(() => {
    const end = dayjs().utc().endOf("day");
    let t: Dayjs = dayjs().utc().startOf("day");

    const options: Option[] = [];
    while (t.isBefore(end)) {
      options.push({
        value: t.toDate().valueOf(),
        label: dayjs(t)
          .utc()
          .format(timeFormat === 12 ? "h:mma" : "HH:mm"),
      });
      t = t.add(increment, "minutes");
    }
    return options;
  }, [timeFormat]);

  const filter = useCallback(
    ({
      offset,
      limit,
      current,
    }: {
      offset?: ConfigType;
      limit?: ConfigType;
      current?: ConfigType;
    }) => {
      if (current) {
        const currentOption = options.find(
          (option) => option.value === dayjs(current).toDate().valueOf()
        );
        if (currentOption) setFilteredOptions([currentOption]);
      } else
        setFilteredOptions(
          options.filter((option) => {
            const time = dayjs(option.value);
            return (
              (!limit || time.isBefore(limit)) &&
              (!offset || time.isAfter(offset))
            );
          })
        );
    },
    [options]
  );

  return { options: filteredOptions, filter, unfilteredOptions: options };
};
