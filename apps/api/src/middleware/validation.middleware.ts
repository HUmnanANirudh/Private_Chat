import type { NextFunction, Request, Response } from "express";
import { ZodObject, type ZodType } from "zod";
import { validation } from "@repo/types";

type validationSchema = typeof validation;
type validationPath = keyof validationSchema;
type validationFunction = keyof validationSchema[validationPath];

export const validationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const path = `${req.path}` as validationPath;
    const reqMethod = req.method.toUpperCase();
    const method = reqMethod as validationFunction;

    console.log(`Validating request for ${path} with method ${method}`);

    if (!validation[path] || !validation[path][method]) {
      res
        .status(404)
        .json({ message: "Validation schema not found for this endpoint" });
      return;
    }

    const schema = validation[path][method] as ZodType;
    let result: { success: boolean; error?: Error | any; data?: any };

    if (reqMethod === "GET") {
      if (schema instanceof ZodObject) {
        result = await schema.strict().safeParseAsync(req.query);
      } else {
        result = await schema.safeParseAsync(req.query);
      }
    } else {
      if (schema instanceof ZodObject) {
        result = await schema.strict().safeParseAsync(req.body || {});
      } else {
        result = await schema.safeParseAsync(req.body || {});
      }
    }
    if (!result.success) {
      const formattedErrors = result.error.format();
      res.status(400).json({
        message: "Validation error",
        errors: formattedErrors,
      });
      return;
    }

    if (reqMethod === "GET") {
      Object.assign(req.query, result.data);
    } else {
      Object.assign(req.body, result.data);
    }

    next();
  } catch (err:Error | any) {

    console.error("Error in validation middleware:", err);
    return res.status(500).json({
      message: "Validation error middleware error",
      error: err?.message || err,
    });
  }
};
