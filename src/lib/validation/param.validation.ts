import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

// Path params for routes shaped like `/api/<entity>/[id]`.
export const idParamSchema = z.object({ id: uuidSchema });

export type IdParam = z.infer<typeof idParamSchema>;
