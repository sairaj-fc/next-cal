// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const events = await prisma.event.findMany();

  res.status(200).json({ events });
}
