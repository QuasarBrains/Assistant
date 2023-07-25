export const sanitizeFileName = (fileName: string) => {
  // replace spaces with underscores, remove all other non-alphanumeric characters, and no "/" or "\", only allow periods and dots
  return fileName.replace(/[^a-zA-Z0-9.]/g, "").replace(/ /g, "_");
};
