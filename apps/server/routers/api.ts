import { Router } from "express";
import usersRouter from "./apiRoutes/users";

const router = Router();

router.use("/users", usersRouter);

export default router;
