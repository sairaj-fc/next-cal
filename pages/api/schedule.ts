// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const availability = req.body.availability;

    const scheduleCreatePromise = await prisma.schedule.create({
      data: {
        name: "My Schedule",
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

  res.status(200).json({ name: "John Doe" });
}
