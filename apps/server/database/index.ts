import { DataSource } from "typeorm";
import "reflect-metadata";
import { seedDatabase } from "./seeders";
import User from "./models/user";
import RefreshToken from "./models/token";

// ! Don't forget to add your entities here
export type Entities = User | RefreshToken;

export const entities = {
  User,
  RefreshToken,
};

export const dataSource = new DataSource({
  type: "sqlite",
  database: "datastore/database.sqlite",
  synchronize: true, // ! MAKE SURE TO SET THIS BASED ON YOUR PREFERENCES
  entities: Object.values(entities),
  migrations: ["database/migrations/*.ts"],
  migrationsTableName: "migrations",
});

export const initializeDatabase = async () => {
  await dataSource.initialize();
  console.info("Database initialized");
  await seedDatabase();
  console.info("Database seeded");
  return dataSource;
};
