import { useGet } from "@comps/useGet";
import { useRouter } from "next/router";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "pages/_app";
import axios from "axios";
import { Event, User } from "@prisma/client";
import { time_zone as local_storage_time_zone } from "@lib/utils/clock";
import dayjs, { Dayjs, guess_timezone } from "@lib/dayjs";
import TimezoneSelect, { ITimezone, allTimezones } from "react-timezone-select";

type ClientEventPreviewPageProps = {
  event: Event;
  profile: User;
};

const ClientEventPreviewPage = ({
  event,
  profile,
}: ClientEventPreviewPageProps) => {
  const [timeZone, setTimeZone] = useState<string>();

  useEffect(() => {
    setTimeZone(local_storage_time_zone() || "Asia/Kolkata");
  }, []);

  if (!timeZone) {
    return null;
  }

  console.log(timeZone);

  return (
    <div>
      <div className="text-center">
        <p>{profile.name || profile.email}</p>
        <p className="text-xl mt-1">{event.title}</p>
        {event.description ? (
          <p className="text-gray-600">{event.description}</p>
        ) : null}
        <p className="text-gray-600 mt-2">
          <span>⏱</span>
          {event.length} Minutes
        </p>
        <select
          value={timeZone}
          onChange={(e) => {
            setTimeZone(e.target.value);
            local_storage_time_zone(e.target.value);
          }}
          name="timezone"
          id="timezone"
        >
          {Object.keys(allTimezones).map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <div>
        <SlotPicker event={event} timeZone={timeZone} />
      </div>
    </div>
  );
};

const SlotPicker = ({
  event,
  timeFormat = "hh:mm a",
  timeZone,
  weekStart = 0,
}: {
  event: Pick<Event, "id" | "slug">;
  timeFormat?: string;
  timeZone?: string;
  weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>();
  const [browsingDate, setBrowsingDate] = useState<Dayjs>();
  const { date, setQuery: setDate } = useRouterQuery("date");
  const { month, setQuery: setMonth } = useRouterQuery("month");
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    // Etc/GMT is not actually a timeZone, so handle this select option explicitly to prevent a hard crash.
    if (timeZone === "Etc/GMT") {
      setBrowsingDate(
        dayjs
          .utc(month)
          .set("date", 1)
          .set("hour", 0)
          .set("minute", 0)
          .set("second", 0)
      );
      if (date) {
        setSelectedDate(dayjs.utc(date));
      }
    } else {
      // Set the start of the month without shifting time like startOf() may do.
      setBrowsingDate(
        dayjs
          .tz(month, timeZone)
          .set("date", 1)
          .set("hour", 0)
          .set("minute", 0)
          .set("second", 0)
      );
      if (date) {
        // It's important to set the date immediately to the timeZone, dayjs(date) will convert to browsertime.
        setSelectedDate(dayjs.tz(date, timeZone));
      }
    }
  }, [router.isReady, month, date, timeZone]);

  const res_1 = useSlots({
    eventId: event.id,
    startTime: selectedDate?.startOf("day"),
    endTime: selectedDate?.endOf("day"),
    timeZone,
  });
  const res_2 = useSlots({
    eventId: event.id,
    startTime: browsingDate?.startOf("month"),
    endTime: browsingDate?.endOf("month"),
    timeZone,
  });

  // const slots = useMemo(() => ({ ..._1, ..._2 }), [_1, _2]);

  return <div>Slot Picker</div>;
};

const EventSlug = () => {
  const [data, setData] = useState<ClientEventPreviewPageProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const router = useRouter();
  const {
    user: { user },
  } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const slug = router.query.slug as string;
      const eventId = router.query.eid as string;
      const userId = user.id;

      try {
        const res = await axios.get(
          `/api/event/${eventId}?slug=${slug}&user_id=${userId}`
        );
        setData(res.data);
      } catch (err) {
        setError(err as any);
      }
      setIsLoading(false);
    };
    if (router.isReady) {
      fetchData();
    }
  }, [router.isReady, router.query.eid, router.query.slug, user.id]);

  if (error) {
    return <div>{error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data && (
        <ClientEventPreviewPage event={data.event} profile={data.profile} />
      )}
    </div>
  );
};

export default EventSlug;

const useRouterQuery = <T extends string>(name: T) => {
  const router = useRouter();
  const query = router.query;

  const setQuery = (newValue: string | number | null | undefined) => {
    router.replace(
      { query: { ...router.query, [name]: newValue } },
      undefined,
      { shallow: true }
    );
  };

  return { [name]: query[name], setQuery } as {
    [K in T]: string | undefined;
  } & { setQuery: typeof setQuery };
};

const useSlots = ({
  eventId,
  startTime,
  endTime,
  timeZone,
}: {
  eventId: string;
  startTime?: Dayjs;
  endTime?: Dayjs;
  timeZone?: string;
}) => {
  const [data, setData] = useState<any>();
  const [cachedSlots, setCachedSlots] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      // type GetScheduleInput = {
      //   timezone?: string | undefined;
      //   eventId?: string | undefined;
      //   startTime: string;
      //   endTime: string;
      //   // usernameList?: string[] | undefined;
      // };
      let url = `/api/slots/getSchedule`;
      url += `?eventId=${eventId}`;
      url += `&timezone=${timeZone}`;
      url += `&startTime=${startTime?.toISOString() || ""}`;
      url += `&endTime=${endTime?.toISOString() || ""}`;

      if (startTime && endTime) {
        const res = await axios.get(url);
        return {
          res,
        };
      }

      return {
        slots: {},
      };
    })();
  }, [endTime, eventId, startTime, timeZone]);

  // const { data, isLoading, isIdle } = trpc.useQuery(
  //   [
  //     "viewer.public.slots.getSchedule",
  //     {
  //       eventTypeId,
  //       startTime: startTime?.toISOString() || "",
  //       endTime: endTime?.toISOString() || "",
  //       timeZone,
  //     },
  //   ],
  //   { enabled: !!startTime && !!endTime }
  // );

  // const [cachedSlots, setCachedSlots] = useState<NonNullable<typeof data>["slots"]>({});

  // useEffect(() => {
  //   if (data?.slots) {
  //     setCachedSlots((c) => ({ ...c, ...data?.slots }));
  //   }
  // }, [data]);

  // // The very first time isIdle is set if auto-fetch is disabled, so isIdle should also be considered a loading state.
  // return { slots: cachedSlots, isLoading: isLoading || isIdle };
  return {};
};
