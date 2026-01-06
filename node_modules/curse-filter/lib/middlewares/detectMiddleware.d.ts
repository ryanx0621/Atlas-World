import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to detect curse words in `req.body`.
 *
 * On profanity detection (in any string of the body object), it sends a response with the error message and the error code.
 *
 * For configuration, see {@link MiddlewaresConfig}.
 */
export declare const detectMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
