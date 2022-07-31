import type { NextPage } from "next";
import { useRouter } from "next/router";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import TimezoneSelect, { ITimezone } from "react-timezone-select";
import dayjs, { ConfigType, Dayjs } from "@lib/dayjs";
import {
  defaultDayRange,
  DEFAULT_SCHEDULE,
  Schedule,
  TimeRange,
  weekdayNames,
} from "@lib/utils";

const Button = ({ ...props }: any) => {
  return (
    <button className="text-lg bg-gray-900 px-4 py-1 text-white" {...props} />
  );
};

const Home: NextPage = () => {
  const [selectedTimezone, setSelectedTimezone] = useState(dayjs.tz.guess());
  const [usrname, setUsrname] = useState("");

  return (
    <div className="w-1/4  mx-auto">
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

  return (
    <AvailabilityContext.Provider
      value={{
        schedule,
        setSchedule,
      }}
    >
      <fieldset className="divide-y divide-gray-200 my-16">
        {weekdayNames("en").map((weekday, num) => (
          <ScheduleBlock key={num} name={name} weekday={weekday} day={num} />
        ))}
      </fieldset>
    </AvailabilityContext.Provider>
  );
};

type ScheduleBlockProps = {
  day: number;
  weekday: string;
  name: string;
};
const ScheduleBlock = ({ name, weekday, day }: ScheduleBlockProps) => {
  const [checked, setChecked] = useState(false);
  const { schedule } = useAvailability();

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
          }}
          type="checkbox"
        />
        <p>{weekday}</p>
      </label>
      <div>
        {values.length > 0 ? (
          <DayRanges dayRanges={values} name={`${name}.${day}`} />
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
}: {
  name: string;
  dayRanges: TimeRange[];
}) => {
  const currentDayRange = dayRanges[0];

  const minEnd = currentDayRange.start;
  const maxStart = currentDayRange.end;

  return (
    <div className="flex items-center space-x-3">
      <LazySelect name="start" value={currentDayRange.start} />
      <span>-</span>
      <LazySelect name="end" value={currentDayRange.end} />
    </div>
  );
};

const LazySelect = ({
  name,
  value,
  min,
  max,
  ...props
}: {
  name: string;
  value?: ConfigType;
  min?: ConfigType;
  max?: ConfigType;
}) => {
  const { options, filter } = useOptions();
  const [selected, setSelected] = useState<any>();

  console.log(selected);

  useEffect(() => {
    filter({ current: value });
  }, [filter, value, max, min]);

  return (
    <select
      name={name}
      className="max-h-56"
      value={
        options.find(
          (option) => option.value === dayjs(value).toDate().valueOf()
        )?.value
      }
      onChange={(e) => {
        setSelected(new Date(e.target.value));
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

  return { options: filteredOptions, filter };
};
