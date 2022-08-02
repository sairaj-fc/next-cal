import { useGet } from "../comps/useGet";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axios from "axios";
import type { Event } from "@prisma/client";
import { Button } from "@comps/Button";

const EventsPage = () => {
  const { data, loading, error } = useGet<Event[]>(async () => {
    const res = await axios.get("/api/event");
    return res.data.events || [];
  });
  const [event, setEvent] = useState({
    title: "",
    slug: "",
    description: "",
    length: "",
  });

  if (error) {
    return <div>Error</div>;
  }

  if (loading) {
    return <div>Loading....</div>;
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "title") {
      setEvent({
        ...event,
        title: e.target.value,
        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
      });
      return;
    }

    setEvent({ ...event, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = () => {
    console.log(event);
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl text-black font-semibold">Events</h1>
        {!data || data.length === 0 ? (
          <div className="mt-6 text-center min-h-[200px]">No Events</div>
        ) : (
          data.map((event) => <div key={event.id}>{event.title}</div>)
        )}
      </div>

      <div className="mt-16">
        <h1 className="text-2xl text-black font-semibold">Create Event</h1>
        <div className="mb-24 mt-6">
          <label>
            Title
            <input
              onChange={handleChange}
              className="block mb-4 w-full"
              type="text"
              name="title"
              value={event.title}
            />
          </label>
          <label>
            Slug
            <div className="flex items-center bg-gray-100 border border-black">
              <span className=" text-gray-500 h-full px-2 block">/sairaj/</span>
              <input
                onChange={handleChange}
                className="block w-full bg-white border-0"
                type="text"
                name="slug"
                value={event.slug}
              />
            </div>
          </label>
          <label className="mt-4 block">
            Description
            <textarea
              onChange={handleChange}
              className="block mb-4 w-full"
              name="description"
              value={event.description}
            />
          </label>
          <label>
            Length in Minutes
            <input
              onChange={handleChange}
              className="block mb-4 w-full"
              type="number"
              name="length"
              value={event.length}
            />
          </label>
          <div className="mt-6 block">
            <Button onClick={handleCreateEvent}>Create Event</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
