/*! THIS FILE IS AUTO-GENERATED */
import { AuthPlus } from 'googleapis-common';
import { discoveryengine_v1alpha } from './v1alpha';
import { discoveryengine_v1beta } from './v1beta';
export declare const VERSIONS: {
    v1alpha: typeof discoveryengine_v1alpha.Discoveryengine;
    v1beta: typeof discoveryengine_v1beta.Discoveryengine;
};
export declare function discoveryengine(version: 'v1alpha'): discoveryengine_v1alpha.Discoveryengine;
export declare function discoveryengine(options: discoveryengine_v1alpha.Options): discoveryengine_v1alpha.Discoveryengine;
export declare function discoveryengine(version: 'v1beta'): discoveryengine_v1beta.Discoveryengine;
export declare function discoveryengine(options: discoveryengine_v1beta.Options): discoveryengine_v1beta.Discoveryengine;
declare const auth: AuthPlus;
export { auth };
export { discoveryengine_v1alpha };
export { discoveryengine_v1beta };
export { AuthPlus, GlobalOptions, APIRequestContext, GoogleConfigurable, StreamMethodOptions, GaxiosPromise, MethodOptions, BodyResponseCallback, } from 'googleapis-common';
