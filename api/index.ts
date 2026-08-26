import app from "../artifacts/api-server/src/app";

export const config = { runtime: "nodejs" };
export default function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
  return app(req, res);
}
