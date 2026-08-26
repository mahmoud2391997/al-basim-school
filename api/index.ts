import type { Request, Response } from "express";
import app from "../artifacts/api-server/src/app";

export const config = { runtime: "nodejs" };

export default function handler(req: Request, res: Response) {
  return (app as unknown as (request: Request, response: Response) => unknown)(req, res);
}
