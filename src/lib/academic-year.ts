import { z } from "zod";

export const academicYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{4}$/, "Academic year must use YYYY-YYYY format.")
  .refine((value) => {
    const [start, end] = value.split("-").map(Number);
    return start >= 2000 && start <= 2100 && end === start + 1;
  }, "Academic year must contain consecutive years between 2000 and 2101.");
