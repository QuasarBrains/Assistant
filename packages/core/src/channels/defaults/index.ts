import { ServerChannel } from "./server";

const serverChannel = new ServerChannel();

export const defaultChannels = {
  [serverChannel.Name()]: serverChannel,
};
