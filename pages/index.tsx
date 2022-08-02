import type { NextPage } from "next";
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
import TimezoneSelect, { ITimezone } from "react-timezone-select";
import dayjs, { ConfigType, Dayjs } from "@lib/dayjs";
import {
  defaultDayRange,
  DEFAULT_SCHEDULE,
  getAvailabilityFromSchedule,
  Schedule,
  TimeRange,
  weekdayNames,
} from "@lib/utils";
import prisma from "../prisma";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const Button = ({ ...props }: any) => {
  return (
    <button className="text-lg bg-gray-900 px-4 py-1 text-white" {...props} />
  );
};

/**
 * @function useOnClickOutside
 * @description Handles the click outside logic and returns the `onOutsideClick` callback to handle the logic after the component is unmounted
 */
const useOnClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  onOutsideClick: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const touchListener = <U extends MouseEvent | TouchEvent>(event: U) => {
      if (!ref.current || ref.current.contains(event?.target as Node)) {
        // if clicked element is inside the ref element, do nothing
        return;
      }
      onOutsideClick(event);
    };

    document.addEventListener("mousedown", touchListener); // for desktop
    document.addEventListener("touchstart", touchListener); // for mobile

    return () => {
      document.removeEventListener("mousedown", touchListener);
      document.removeEventListener("touchstart", touchListener);
    };
  }, [ref, onOutsideClick]);
};

const Home: NextPage = () => {
  const [selectedTimezone, setSelectedTimezone] = useState(dayjs.tz.guess());
  const [usrname, setUsrname] = useState("");

  return (
    <div className="w-1/2  mx-auto">
      <Button onClick={() => axios.post("/api/user")}>Create dummy user</Button>
      <div className=" mt-16 space-y-4">
        <div>
          <div className="text-base flex items-center justify-between mb-1">
            <label htmlFor="username">Username</label>
          </div>
          <input
            id="username"
            type="text"
            className="border border-gray-400 rounded-md px-2 py-1.5 w-full"
            onChange={(e) => setUsrname(e.target.value)}
          />
        </div>
        <div className="w-full">
          <div className="text-base flex items-center justify-between mb-1">
            <label htmlFor="timezone">Select Timezone</label>
            <span className="text-black">
              Current Time {dayjs().tz(selectedTimezone).format("LT")}
            </span>
          </div>
          <TimezoneSelect
            id="timezone"
            value={selectedTimezone}
            onChange={({ value }) => setSelectedTimezone(value)}
          />
        </div>
        <Button>Next</Button>
      </div>

      <Availablility name="schedule" />
    </div>
  );
};

export default Home;

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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const avai = getAvailabilityFromSchedule(schedule);

    const res = await axios.post("/api/schedule", {
      availability: avai,
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
      <form onSubmit={onSubmit} className="mb-8">
        <fieldset className="divide-y divide-gray-200 my-16">
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
          <DayRanges day={day} dayRanges={values} name={`${name}.${day}`} />
        ) : (
          <div>No Availability</div>
        )}
      </div>
    </div>
  );
};

export const DayRanges = ({
  name,
  dayRanges,
  day,
}: {
  name: string;
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
