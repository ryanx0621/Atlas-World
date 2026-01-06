import SupabaseClient from './SupabaseClient';
import type { SupabaseClientOptions } from './lib/types';
export * from '@supabase/auth-js';
export type { User as AuthUser, Session as AuthSession } from '@supabase/auth-js';
export { type PostgrestResponse, type PostgrestSingleResponse, type PostgrestMaybeSingleResponse, PostgrestError, } from '@supabase/postgrest-js';
export { FunctionsHttpError, FunctionsFetchError, FunctionsRelayError, FunctionsError, type FunctionInvokeOptions, FunctionRegion, } from '@supabase/functions-js';
export * from '@supabase/realtime-js';
export { default as SupabaseClient } from './SupabaseClient';
export type { SupabaseClientOptions, QueryResult, QueryData, QueryError } from './lib/types';
/**
 * Creates a new Supabase Client.
 */
export declare const createClient: <Database = any, SchemaNameOrClientOptions extends (string & Exclude<keyof Database, "__InternalSupabase">) | {
    PostgrestVersion: string;
} = "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<keyof Database, "__InternalSupabase">, SchemaName extends string & Exclude<keyof Database, "__InternalSupabase"> = SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? SchemaNameOrClientOptions : "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<Exclude<keyof Database, "__InternalSupabase">, "__InternalSupabase">>(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptions<SchemaName> | undefined) => SupabaseClient<Database, SchemaNameOrClientOptions, SchemaName, Omit<Database, "__InternalSupabase">[SchemaName] extends import("./lib/types").GenericSchema ? Omit<Database, "__InternalSupabase">[SchemaName] : never, SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? Database extends {
    __InternalSupabase: {
        PostgrestVersion: string;
    };
} ? Database["__InternalSupabase"] : {
    PostgrestVersion: "12";
} : SchemaNameOrClientOptions extends {
    PostgrestVersion: string;
} ? SchemaNameOrClientOptions : never>;
//# sourceMappingURL=index.d.ts.map