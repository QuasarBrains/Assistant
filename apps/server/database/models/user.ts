import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import RefreshToken from "./token";

type Roles = "super_admin" | "admin" | "user";

@Entity()
export default class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  email!: string;

  @Column({ type: "varchar", length: 255, nullable: false, select: false })
  password!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  firstName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  lastName!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  role!: Roles;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
