/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                   REQUEST VALIDATION SYSTEM [DATA-SANITIZER-631]                   ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Middleware for validating request data against defined schemas                    ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * CIPHER-X: Request validation middleware
 * Checks for validation errors from express-validator rules
 * Returns standardized error responses for invalid data
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format the validation errors
    const formattedErrors = errors.array().map(err => {
      return {
        param: err.param,
        message: err.msg
      };
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formattedErrors,
      timestamp: new Date()
    });
  }
  
  next();
};

export default validate;
