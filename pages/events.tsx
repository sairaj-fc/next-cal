import { useGet } from "../comps/useGet";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axios from "axios";
import type { Availability, Event, Schedule } from "@prisma/client";
import { Button } from "@comps/Button";
import { useAuth } from "./_app";
import Link from "next/link";

const EventsPage = () => {
  const { user } = useAuth();
  const { data, loading, error } = useGet<Event[]>(async () => {
    const res = await axios.get("/api/event");
    return res.data.events || [];
  });
  const { data: schedules } = useGet<Schedule[]>(async () => {
    const res = await axios.get("/api/schedule");
    return res.data.schedules || [];
  });

  const [event, setEvent] = useState({
    title: "",
    slug: "",
    description: "",
    length: "",
    location: {
      online: true,
      meet_link: "https://meet.google.com/zar-mzni-yjn?authuser=0",
    },
    schedule_id: "",
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

  const handleCreateEvent = async () => {
    type PostEvent = {
      title: string;
      slug: string;
      description: string;
      length: string;
      location: {
        online: boolean;
        meet_link: string;
      };
      schedule_id: string;
      timezone?: string;
      user_id: string;
    };
    let newEvent: PostEvent = {
      title: event.title,
      slug: event.slug,
      description: event.description,
      length: event.length,
      location: {
        online: event.location.online,
        meet_link: event.location.meet_link,
      },
      schedule_id: event.schedule_id,
      user_id: user.user.id,
    };
    if (newEvent.schedule_id === "") return;

    const res = await axios.post("/api/event", newEvent);
    console.log(res);
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl text-black font-semibold">Events</h1>
        {!data || data.length === 0 ? (
          <div className="mt-6 text-center min-h-[200px]">No Events</div>
        ) : (
          <div className="mt-4">
            {data.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id}>
                <a className="block hover:bg-gray-100 py-4 px-3">
                  <div className="flex space-x-2 items-baseline">
                    <h3 className="text-slate-900 text-xl">{event.title}</h3>
                    <p className="text-sm">{`${
                      user.user.username || "sairaj"
                    }/${event.slug}`}</p>
                  </div>
                  {event.description && (
                    <p className="text-gray-500">{event.description}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-gray-900 text-sm bg-gray-200 rounded-full w-fit px-2 py-0.5">
                      {" "}
                      ⏱ {event.length}min
                    </p>
                  </div>
                </a>
              </Link>
            ))}
          </div>
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
              <span className=" text-gray-500 h-full px-2">/sairaj/</span>
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

          <label>
            Location
            <select className="w-full mb-4" name="location" id="location">
              <option value="gmeet">Google Meet</option>
            </select>
          </label>

          <label>
            Meet Link
            <input
              onChange={(e) => {
                setEvent({
                  ...event,
                  location: { ...event.location, meet_link: e.target.value },
                });
              }}
              className="block mb-4 w-full"
              type="text"
              name="meet_link"
              value={event.location.meet_link}
              placeholder="https://meet.google.com/eoo-zjpn-xik?authuser=0"
            />
          </label>

          <label>
            Availability
            <select
              onChange={(e) => {
                setEvent({
                  ...event,
                  schedule_id: e.target.value,
                });
              }}
              className="w-full mb-4"
              name="availability"
              id="availability"
            >
              <option value=""></option>
              {schedules?.map((a) => (
                <option value={a.id} key={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
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
