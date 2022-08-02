// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const body = req.body as PostEvent;

    const newEvent = await prisma.event.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        length: +body.length || 15,
        locations: body.location,
        schedule_id: body.schedule_id,
        time_zone: body.timezone || "Asia/Kolkata",
        user_id: body.user_id,
      },
    });

    return res.json({
      event: newEvent,
    });
  }

  if (req.method === "GET") {
    const events = await prisma.event.findMany();

    res.status(200).json({ events });
  }
}
