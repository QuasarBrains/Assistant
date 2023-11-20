export const parseFunctionCallOfType = <T>(json: string): T | undefined => {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
