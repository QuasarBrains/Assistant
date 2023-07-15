import { Channel } from "../construct";

export class ServerChannel extends Channel {
  constructor() {
    super({ name: "server" });
  }

  public init(): void {
    console.log("Server channel initialized");
  }

  public sendMessage<M>(message: M): void {
    console.log("Server channel sent message");
  }

  public onMessageRecieved<M>(cb: (message: M) => void): void {
    console.log("Server channel received message");
  }
}
