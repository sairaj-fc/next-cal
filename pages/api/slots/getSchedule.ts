import type { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@lib/dayjs";

import prisma from "../../../prisma";
import { getWorkingHours } from "@lib/utils";
import { Availability } from "@prisma/client";
import getSlots from "@lib/utils/slot";

type GetScheduleInput = {
  timezone?: string | undefined;
  eventId?: string | undefined;
  startTime: string;
  endTime: string;
  // usernameList?: string[] | undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const input = req.query as unknown as GetScheduleInput;

    const eventType = await prisma.event.findUnique({
      where: {
        id: input.eventId,
      },
      select: {
        id: true,
        length: true,
        time_zone: true,
        schedule: {
          select: {
            availability: true,
            time_zone: true,
          },
        },
        user: true,
      },
    });

    if (!eventType) {
      res.status(400).json({ error: "Event not found" });
      return;
    }

    const startTime =
      input.timezone === "Etc/GMT"
        ? dayjs.utc(input.startTime)
        : dayjs(input.startTime).utc().tz(input.timezone);
    const endTime =
      input.timezone === "Etc/GMT"
        ? dayjs.utc(input.endTime)
        : dayjs(input.endTime).utc().tz(input.timezone);

    if (!startTime.isValid() || !endTime.isValid()) {
      return res.status(400).json({ error: "Invalid time" });
    }

    const workingHours = getWorkingHours(
      { timeZone: input.timezone },
      // @ts-ignore
      eventType.schedule?.availability.map((item) => ({
        days: item.days,
        startTime: item.start_time,
        endTime: item.end_time,
      }))
    );

    console.log("www", workingHours);

    res.status(200).json({ res: eventType });
  }
}

export type Slot = {
  time: string;
  attendees?: number;
  bookingUid?: string;
  users?: string[];
};
