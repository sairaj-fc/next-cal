import { useGet } from "@comps/useGet";
import { useRouter } from "next/router";

import React, { useEffect, useState } from "react";
import { useAuth } from "pages/_app";
import axios from "axios";
import { Event, User } from "@prisma/client";
import { time_zone as local_storage_time_zone } from "@lib/utils/clock";
import dayjs, { guess_timezone } from "@lib/dayjs";
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
    </div>
  );
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

  console.log(data);
  return (
    <div>
      {data && (
        <ClientEventPreviewPage event={data.event} profile={data.profile} />
      )}
    </div>
  );
};

export default EventSlug;
