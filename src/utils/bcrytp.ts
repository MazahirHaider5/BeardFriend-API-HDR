import bcrypt from "bcrypt";

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    throw new Error("Error comparing passwords");
  }
};
