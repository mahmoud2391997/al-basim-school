import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import schoolRouter from "./school.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(schoolRouter);

export default router;
