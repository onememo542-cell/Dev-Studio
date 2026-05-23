import { Router, Request, Response } from "express";
import { presenceService } from "../../infrastructure/services/presence.service.js";

const router = Router();

/** GET /api/presence — returns current online user IDs */
router.get("/", (_req: Request, res: Response) => {
  const online = presenceService.getOnline();
  res.json({ online, count: online.length });
});

export default router;
