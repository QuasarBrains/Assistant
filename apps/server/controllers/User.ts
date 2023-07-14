import Controller from ".";
import { dataSource, entities } from "../database";
import User from "../database/models/user";
import { comparePassword, generateToken, hashPassword } from "../utils/auth";

export default class UserController extends Controller<User> {
  constructor() {
    super({ model: "User", name: "User" });
  }

  public async list() {
    try {
      return await this.getRepository()?.find();
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async create(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.email) {
        throw new Error("No email provided");
      }
      if (!data.password) {
        throw new Error("No password provided");
      }
      if (!data.firstName) {
        throw new Error("No firstName provided");
      }
      if (!data.lastName) {
        throw new Error("No lastName provided");
      }
      if (!data.role) {
        throw new Error("No role provided");
      }
      const user = new entities.User();
      user.email = data.email;
      user.password = data.password;
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.role = data.role;
      return await this.getRepository()?.save(user);
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async update(id: string, data: any) {
    try {
      if (!id || !Number(id)) {
        throw new Error("No id provided");
      }
      if (!data) {
        throw new Error("No data provided");
      }
      const user = await this.getRepository()?.findOne({
        where: {
          id: Number(id),
        },
      });
      if (!user) {
        throw new Error("No user found");
      }
      if (data.email) {
        user.email = data.email;
      }
      if (data.password) {
        user.password = data.password;
      }
      if (data.firstName) {
        user.firstName = data.firstName;
      }
      if (data.lastName) {
        user.lastName = data.lastName;
      }
      if (data.role) {
        user.role = data.role;
      }
      return await this.getRepository()?.save(user);
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async read(id: string) {
    try {
      if (!id || !Number(id)) {
        throw new Error("No id provided");
      }
      return await this.getRepository()?.findOne({
        where: {
          id: Number(id),
        },
      });
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async delete(id: string) {
    try {
      if (!id || !Number(id)) {
        throw new Error("No id provided");
      }

      const user = await this.getRepository()?.findOne({
        where: {
          id: Number(id),
        },
      });
      if (!user) {
        throw new Error("No user found");
      }

      const deleted = await this.getRepository()?.remove(user);
      if (!deleted) {
        return false;
      }
      return true;
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async signup(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.email) {
        throw new Error("No email provided");
      }
      if (!data.password) {
        throw new Error("No password provided");
      }
      if (!data.firstName) {
        throw new Error("No firstName provided");
      }
      if (!data.lastName) {
        throw new Error("No lastName provided");
      }
      const hashedPswd = await hashPassword(data.password);
      if (!hashedPswd) {
        throw new Error("Error hashing password");
      }
      const user = new entities.User();
      user.email = data.email;
      user.password = hashedPswd;
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.role = "user";
      const savedUser = await this.getRepository()?.save(user);
      const accessToken = await generateToken(
        { ...savedUser },
        { expiresIn: "1h" }
      );
      const refreshToken = await generateToken(
        { ...savedUser },
        { expiresIn: "7d" }
      );
      if (!accessToken || !refreshToken) {
        throw new Error("Error generating tokens");
      }
      const token = new entities.RefreshToken();
      token.token = refreshToken;
      token.user = savedUser;
      this.getDataSource().manager.save(token);
      const { password, ...userWithoutPassword } = savedUser;
      return {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async login(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.email) {
        throw new Error("No email provided");
      }
      if (!data.password) {
        throw new Error("No password provided");
      }
      const user = await this.getRepository()?.findOne({
        where: {
          email: data.email,
        },
        select: ["id", "email", "password", "firstName", "lastName", "role"],
      });
      if (!user) {
        throw new Error("No user found");
      }
      const validPassword = await comparePassword(data.password, user.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }
      const accessToken = await generateToken({ ...user }, { expiresIn: "1h" });
      const refreshToken = await generateToken(
        { ...user },
        { expiresIn: "7d" }
      );
      if (!accessToken || !refreshToken) {
        throw new Error("Error generating tokens");
      }
      const token = new entities.RefreshToken();
      token.token = refreshToken;
      token.user = user;
      this.getDataSource().manager.save(token);
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async refresh(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.refreshToken) {
        throw new Error("No refreshToken provided");
      }
      const token = await this.getDataSource().manager.findOne(
        entities.RefreshToken,
        {
          where: {
            token: data.refreshToken,
          },
          relations: ["user"],
        }
      );
      if (!token) {
        throw new Error("No token found");
      }
      const accessToken = await generateToken(
        { ...token.user },
        { expiresIn: "1h" }
      );
      const refreshToken = await generateToken(
        { ...token.user },
        { expiresIn: "7d" }
      );
      if (!accessToken || !refreshToken) {
        throw new Error("Error generating tokens");
      }
      token.token = refreshToken;
      this.getDataSource().manager.save(token);
      return {
        accessToken,
        refreshToken,
        user: token.user,
      };
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public static async refreshStatic(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.refreshToken) {
        throw new Error("No refreshToken provided");
      }
      const token = await dataSource.manager.findOne(entities.RefreshToken, {
        where: {
          token: data.refreshToken,
        },
        relations: ["user"],
      });
      if (!token) {
        throw new Error("No token found");
      }
      const accessToken = await generateToken(
        { ...token.user },
        { expiresIn: "1h" }
      );
      const refreshToken = await generateToken(
        { ...token.user },
        { expiresIn: "7d" }
      );
      if (!accessToken || !refreshToken) {
        throw new Error("Error generating tokens");
      }
      token.token = refreshToken;
      dataSource.manager.save(token);
      return {
        accessToken,
        refreshToken,
        user: token.user,
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async logout(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.refreshToken) {
        throw new Error("No refreshToken provided");
      }
      const token = await this.getDataSource().manager.findOne(
        entities.RefreshToken,
        {
          where: {
            token: data.refreshToken,
          },
        }
      );
      if (!token) {
        throw new Error("No token found");
      }
      const deleted = await this.getDataSource().manager.remove(token);
      if (!deleted) {
        return false;
      }
      return true;
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }

  public async me(data: any) {
    try {
      if (!data) {
        throw new Error("No data provided");
      }
      if (!data.id) {
        throw new Error("No id provided");
      }
      const user = await this.getRepository()?.findOne({
        where: {
          id: data.id,
        },
        select: ["id", "email", "firstName", "lastName", "role"],
      });
      if (!user) {
        throw new Error("No user found");
      }
      return user;
    } catch (error) {
      this.error(error);
      return undefined;
    }
  }
}
