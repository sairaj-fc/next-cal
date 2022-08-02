// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const availability = req.body.availability;
    const name = req.body.name;

    const scheduleCreatePromise = await prisma.schedule.create({
      data: {
        name: name,
        time_zone: "Asia/Kolkata",
        user_id: "cl6brtpja0005rhud3jim8xef",
        availability: {
          createMany: {
            data: availability,
          },
        },
      },
    });
    return res.status(200).json({ res: scheduleCreatePromise });
  }

  if (req.method === "GET") {
    const schedules = await prisma.schedule.findMany({
      where: {
        user_id: "cl6brtpja0005rhud3jim8xef",
      },
      include: {
        availability: true,
      },
    });
    return res.status(200).json({ schedules: schedules });
  }

  res.status(200).json({ name: "John Doe" });
}
