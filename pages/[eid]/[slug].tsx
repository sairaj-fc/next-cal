import { useGet } from "@comps/useGet";
import { useRouter } from "next/router";

import React, { useEffect, useState } from "react";
import { useAuth } from "pages/_app";
import axios from "axios";
import { Event, User } from "@prisma/client";

type ClientEventPreviewPageProps = {
  event: Event;
  profile: User;
};

const ClientEventPreviewPage = ({}: ClientEventPreviewPageProps) => {
  return <div>hi</div>;
};

const EventSlug = () => {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const {
    user: { user },
  } = useAuth();

  useEffect(() => {
    if (router.isReady && !isReady) {
      setIsReady(true);
    }
  }, [router.isReady, isReady]);

  const { data, error, loading } = useGet<ClientEventPreviewPageProps>(
    async () => {
      const slug = router.query.slug as string;
      const eventId = router.query.eid as string;
      const userId = user.id;

      const res = await axios.get(
        `/api/event/${eventId}?slug=${slug}&user_id=${userId}`
      );

      return res.data;
    }
    // {
    //   disabled: !isReady,
    // }
  );

  console.log(data);

  return (
    <div>
      <ClientEventPreviewPage />
    </div>
  );
};

export default EventSlug;
