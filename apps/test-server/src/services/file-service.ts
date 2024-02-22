import Assistant from "@quasarbrains/assistant";
import { appendFileSync, readFileSync, writeFileSync } from "fs";

export class FileService extends Assistant.Service {
  constructor() {
    super({
      name: "file-service",
      description: "Performs file operations using node's FS module",
      schema: {
        methods: [
          {
            name: "readFile",
            description: "read a file and get a file buffer as a response",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file that should be read",
                },
              },
              required: ["path"],
            },
            performAction: (params: { path: string }) => {
              return this.readFile(params);
            },
          },
          {
            name: "readFileAsString",
            description: "read a file and get a string as a response",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file that should be read",
                },
              },
              required: ["path"],
            },
            performAction: (params: { path: string }) => {
              return this.readFileAsString(params);
            },
          },
          {
            name: "writeFile",
            description: "write data to a file",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file that should be written",
                },
                data: {
                  type: "string",
                  description: "The data to be written to the file",
                },
              },
              required: ["path", "data"],
            },
            performAction: (params: { path: string; data: string }) => {
              return this.writeFile(params);
            },
          },
          {
            name: "appendToFile",
            description: "append data to an existing file",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file that should be appended",
                },
                data: {
                  type: "string",
                  description: "The data to be appended to the file",
                },
              },
              required: ["path", "data"],
            },
            performAction: (params: { path: string; data: string }) => {
              return this.appendToFile(params);
            },
          },
        ],
      },
    });
  }

  public readFile({ path }: { path: string }) {
    const file = readFileSync(path);
    return file;
  }

  public readFileAsString({ path }: { path: string }) {
    const file = this.readFile({ path });
    const asString = file.toString();
    return asString;
  }

  public writeFile({ path, data }: { path: string; data: string }) {
    writeFileSync(path, data);
    return "File has been successfully written.";
  }

  public appendToFile({ path, data }: { path: string; data: string }) {
    appendFileSync(path, data);
    return "Data has been successfully appended to the file.";
  }
}
