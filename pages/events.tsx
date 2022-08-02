import { useGet } from "../comps/useGet";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Event } from "@prisma/client";

const EventsPage = () => {
  const { data, loading, error } = useGet<Event[]>(async () => {
    const res = await axios.get("/api/event");
    return res.data.events || [];
  });

  if (error) {
    return <div>Error</div>;
  }

  if (loading) {
    return <div>Loading....</div>;
  }

  console.log(data);

  return (
    <div>
      <h1 className="text-2xl text-black font-semibold">Events</h1>
      {!data || data.length === 0 ? (
        <div className="mt-6 text-center">No Events</div>
      ) : (
        data.map((event) => <div key={event.id}>{event.title}</div>)
      )}
    </div>
  );
};

export default EventsPage;
