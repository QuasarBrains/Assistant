import { writeFileSync } from "fs";

const logLocation = "storage/logs";

class Logger {
  private name: string;

  constructor({ name }: { name: string }) {
    this.name = name;
  }

  public writeLog(...args: any[]) {
    const log = args.join(" ");
    const date = new Date().toISOString();
    const logLine = `${date} - ${this.name} - ${log}\n`;
    writeFileSync(`${logLocation}/${this.name}.logs`, logLine, {
      flag: "a+",
    });
  }

  public log(...args: any[]) {
    console.log("|LOG|", ...args);
    this.writeLog("|LOG|", ...args);
  }

  public error(...args: any[]) {
    console.error("|ERROR|", ...args);
    this.writeLog("|ERROR|", ...args);
  }

  public warn(...args: any[]) {
    console.warn("|WARNING|", ...args);
    this.writeLog("|WARNING|", ...args);
  }

  public info(...args: any[]) {
    console.info("|INFO|", ...args);
    this.writeLog("|INFO|", ...args);
  }
}

export default Logger;

const metaDataLocation = "storage/metadata";

export const logMetaData = (name: string, content: string, append = false) => {
  writeFileSync(`${metaDataLocation}/${name}`, content, {
    flag: append ? "a+" : "w+",
  });
};
