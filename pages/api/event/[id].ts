import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("hit");
  console.log(req.method);
  if (req.method === "GET") {
    console.log("asdf");
    const slug = req.query.slug as string;
    const eventId = req.query.id as string;
    const user_id = req.query.user_id as string;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: user_id,
        },
      });

      if (!user) {
        return res.status(401).json({
          error: "User not found",
        });
      }

      const event = await prisma.event.findUnique({
        where: {
          user_id_slug: {
            slug: slug,
            user_id: user_id,
          },
        },
      });

      if (!event) {
        return res.status(401).json({
          error: "Event not found",
        });
      }

      const resp = {
        event: event,
        profile: user,
      };

      res.status(200).json({ ...resp });
    } catch (err) {
      console.error(err);
      // @ts-ignore
      res.status(500).json({ error: err.message });
    }
  }
}
