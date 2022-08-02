// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const user = await prisma?.user.create({
      data: {
        email: "sairaj2119@gmail.com",
        password: "aunzbedi",
        timezone: "Asia/Kolkata",
      },
    });
    res.status(200).json({ res: user });
  }
}
