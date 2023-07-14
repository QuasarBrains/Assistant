import { Router } from "express";
import UserController from "../../controllers/User";
import { checkAdmin, checkToken } from "../../middleware/auth";
import Logger from "../../utils/logger";

const router = Router();
const userRouterLogger = new Logger({ name: "User Router" });
const userController = new UserController();

router.get("/me", checkToken, async (req, res) => {
  try {
    const response = await userController.me(req.body.decoded);

    if (!response) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User found",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const response = await userController.signup({
      ...req.body,
    });
    if (!response) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    return res.status(201).json({
      message: "User created",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const response = await userController.login(req.body);

    if (!response) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    return res.status(200).json({
      message: "User logged in",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/logout", checkToken, async (req, res) => {
  try {
    const response = await userController.logout(req.body);

    if (!response) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    return res.status(200).json({
      message: "User logged out",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post("/refresh", checkToken, async (req, res) => {
  try {
    const response = await userController.refresh(req.body);

    if (!response) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    return res.status(200).json({
      message: "Token refreshed",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/", checkToken, checkAdmin, async (_, res) => {
  try {
    const users = await userController.list();
    if (!users) {
      return res.status(404).json({
        message: "No users found",
      });
    }

    return res.status(200).json({
      users,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id", checkToken, checkAdmin, async (req, res) => {
  try {
    const response = await userController.read(req.params.id);

    if (!response) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User found",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.put("/:id", checkToken, checkAdmin, async (req, res) => {
  try {
    const response = await userController.update(req.params.id, req.body);

    if (!response) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User updated",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.delete("/:id", checkToken, checkAdmin, async (req, res) => {
  try {
    const response = await userController.delete(req.params.id);

    if (!response) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User deleted",
      data: response,
    });
  } catch (error) {
    userRouterLogger.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
