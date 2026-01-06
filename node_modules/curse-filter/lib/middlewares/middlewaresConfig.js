/**
 * @class MiddlewaresConfig
 * @description
 * This class is used to configure the middlewares for express.js.
 */
export class MiddlewaresConfig {}
/**
 * @property `detectOptions`
 * @description
 * Options to be passed to the `detect` function of middlewares.
 * @default {} // (no specific options are passed)
 */
MiddlewaresConfig.detectOptions = {};
/**
 * @property `errorMessage`
 * @description
 * Error message to be sent in response when a not allowed content is detected.
 * @default 'Not allowed content detected.'
 */
MiddlewaresConfig.errorMessage = 'Not allowed content detected.';
/**
 * @property `errorCode`
 * @description
 * Error code to be sent in response when a not allowed content is detected.
 * @default 422
 * @see [status codes](https://developer.mozilla.org/en-US/docs/web/http/status)
 * @see [code 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422)
 */
MiddlewaresConfig.errorCode = 422;
//# sourceMappingURL=middlewaresConfig.js.map
