import app from "../artifacts/api-server/src/app";

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  [key: string]: unknown;
};

type VercelResponse = {
  statusCode: number;
  [key: string]: unknown;
};

export const config = { runtime: "nodejs" };

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as unknown as (request: VercelRequest, response: VercelResponse) => unknown)(req, res);
}
