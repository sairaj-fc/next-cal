import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { email, password } = req.body;
    const user = await prisma?.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isValid = user.password === password;

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    res.status(200).json({
      user,
    });
  }
}
