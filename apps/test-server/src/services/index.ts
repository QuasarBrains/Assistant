import { AxiosService } from "./axios-service";
import { FileService } from "./file-service";
import { EmailService } from "./email-service";

export default [new AxiosService(), new FileService(), new EmailService()];
