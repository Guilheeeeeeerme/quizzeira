
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Source
 * 
 */
export type Source = $Result.DefaultSelection<Prisma.$SourcePayload>
/**
 * Model SourceProposal
 * 
 */
export type SourceProposal = $Result.DefaultSelection<Prisma.$SourceProposalPayload>
/**
 * Model Exam
 * 
 */
export type Exam = $Result.DefaultSelection<Prisma.$ExamPayload>
/**
 * Model Artifact
 * 
 */
export type Artifact = $Result.DefaultSelection<Prisma.$ArtifactPayload>
/**
 * Model ListingFingerprint
 * Per-source listing digest. A crawl pass that matches the stored digest is
 * skipped entirely, so unchanged portals cost one page fetch instead of a full
 * re-ingest. History rows make "this portal went stale" visible in admin.
 */
export type ListingFingerprint = $Result.DefaultSelection<Prisma.$ListingFingerprintPayload>
/**
 * Model ControlFlag
 * Small key/value control plane (admin "crawl now" handoff). Postgres-backed so
 * the flag outlives a crawler restart.
 */
export type ControlFlag = $Result.DefaultSelection<Prisma.$ControlFlagPayload>
/**
 * Model CrawlRun
 * 
 */
export type CrawlRun = $Result.DefaultSelection<Prisma.$CrawlRunPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SourceStatus: {
  active: 'active',
  broken: 'broken',
  proposed: 'proposed',
  disabled: 'disabled'
};

export type SourceStatus = (typeof SourceStatus)[keyof typeof SourceStatus]


export const SourceTrust: {
  high: 'high',
  medium: 'medium',
  low: 'low'
};

export type SourceTrust = (typeof SourceTrust)[keyof typeof SourceTrust]


export const CrawlStrategy: {
  listing_links: 'listing_links',
  banca_portal: 'banca_portal',
  fixture: 'fixture'
};

export type CrawlStrategy = (typeof CrawlStrategy)[keyof typeof CrawlStrategy]


export const ArtifactKind: {
  edital: 'edital',
  prova: 'prova',
  gabarito: 'gabarito',
  programa: 'programa',
  other: 'other'
};

export type ArtifactKind = (typeof ArtifactKind)[keyof typeof ArtifactKind]


export const ExamStatus: {
  open: 'open',
  closed: 'closed',
  unknown: 'unknown'
};

export type ExamStatus = (typeof ExamStatus)[keyof typeof ExamStatus]


export const CrawlRunStatus: {
  running: 'running',
  ok: 'ok',
  partial: 'partial',
  failed: 'failed'
};

export type CrawlRunStatus = (typeof CrawlRunStatus)[keyof typeof CrawlRunStatus]

}

export type SourceStatus = $Enums.SourceStatus

export const SourceStatus: typeof $Enums.SourceStatus

export type SourceTrust = $Enums.SourceTrust

export const SourceTrust: typeof $Enums.SourceTrust

export type CrawlStrategy = $Enums.CrawlStrategy

export const CrawlStrategy: typeof $Enums.CrawlStrategy

export type ArtifactKind = $Enums.ArtifactKind

export const ArtifactKind: typeof $Enums.ArtifactKind

export type ExamStatus = $Enums.ExamStatus

export const ExamStatus: typeof $Enums.ExamStatus

export type CrawlRunStatus = $Enums.CrawlRunStatus

export const CrawlRunStatus: typeof $Enums.CrawlRunStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Sources
 * const sources = await prisma.source.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Sources
   * const sources = await prisma.source.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.source`: Exposes CRUD operations for the **Source** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sources
    * const sources = await prisma.source.findMany()
    * ```
    */
  get source(): Prisma.SourceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sourceProposal`: Exposes CRUD operations for the **SourceProposal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SourceProposals
    * const sourceProposals = await prisma.sourceProposal.findMany()
    * ```
    */
  get sourceProposal(): Prisma.SourceProposalDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.exam`: Exposes CRUD operations for the **Exam** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Exams
    * const exams = await prisma.exam.findMany()
    * ```
    */
  get exam(): Prisma.ExamDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.artifact`: Exposes CRUD operations for the **Artifact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Artifacts
    * const artifacts = await prisma.artifact.findMany()
    * ```
    */
  get artifact(): Prisma.ArtifactDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.listingFingerprint`: Exposes CRUD operations for the **ListingFingerprint** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ListingFingerprints
    * const listingFingerprints = await prisma.listingFingerprint.findMany()
    * ```
    */
  get listingFingerprint(): Prisma.ListingFingerprintDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.controlFlag`: Exposes CRUD operations for the **ControlFlag** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ControlFlags
    * const controlFlags = await prisma.controlFlag.findMany()
    * ```
    */
  get controlFlag(): Prisma.ControlFlagDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.crawlRun`: Exposes CRUD operations for the **CrawlRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CrawlRuns
    * const crawlRuns = await prisma.crawlRun.findMany()
    * ```
    */
  get crawlRun(): Prisma.CrawlRunDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Source: 'Source',
    SourceProposal: 'SourceProposal',
    Exam: 'Exam',
    Artifact: 'Artifact',
    ListingFingerprint: 'ListingFingerprint',
    ControlFlag: 'ControlFlag',
    CrawlRun: 'CrawlRun'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "source" | "sourceProposal" | "exam" | "artifact" | "listingFingerprint" | "controlFlag" | "crawlRun"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Source: {
        payload: Prisma.$SourcePayload<ExtArgs>
        fields: Prisma.SourceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SourceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SourceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          findFirst: {
            args: Prisma.SourceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SourceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          findMany: {
            args: Prisma.SourceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>[]
          }
          create: {
            args: Prisma.SourceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          createMany: {
            args: Prisma.SourceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SourceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>[]
          }
          delete: {
            args: Prisma.SourceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          update: {
            args: Prisma.SourceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          deleteMany: {
            args: Prisma.SourceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SourceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SourceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>[]
          }
          upsert: {
            args: Prisma.SourceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourcePayload>
          }
          aggregate: {
            args: Prisma.SourceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSource>
          }
          groupBy: {
            args: Prisma.SourceGroupByArgs<ExtArgs>
            result: $Utils.Optional<SourceGroupByOutputType>[]
          }
          count: {
            args: Prisma.SourceCountArgs<ExtArgs>
            result: $Utils.Optional<SourceCountAggregateOutputType> | number
          }
        }
      }
      SourceProposal: {
        payload: Prisma.$SourceProposalPayload<ExtArgs>
        fields: Prisma.SourceProposalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SourceProposalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SourceProposalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          findFirst: {
            args: Prisma.SourceProposalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SourceProposalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          findMany: {
            args: Prisma.SourceProposalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>[]
          }
          create: {
            args: Prisma.SourceProposalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          createMany: {
            args: Prisma.SourceProposalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SourceProposalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>[]
          }
          delete: {
            args: Prisma.SourceProposalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          update: {
            args: Prisma.SourceProposalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          deleteMany: {
            args: Prisma.SourceProposalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SourceProposalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SourceProposalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>[]
          }
          upsert: {
            args: Prisma.SourceProposalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SourceProposalPayload>
          }
          aggregate: {
            args: Prisma.SourceProposalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSourceProposal>
          }
          groupBy: {
            args: Prisma.SourceProposalGroupByArgs<ExtArgs>
            result: $Utils.Optional<SourceProposalGroupByOutputType>[]
          }
          count: {
            args: Prisma.SourceProposalCountArgs<ExtArgs>
            result: $Utils.Optional<SourceProposalCountAggregateOutputType> | number
          }
        }
      }
      Exam: {
        payload: Prisma.$ExamPayload<ExtArgs>
        fields: Prisma.ExamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          findFirst: {
            args: Prisma.ExamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          findMany: {
            args: Prisma.ExamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>[]
          }
          create: {
            args: Prisma.ExamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          createMany: {
            args: Prisma.ExamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>[]
          }
          delete: {
            args: Prisma.ExamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          update: {
            args: Prisma.ExamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          deleteMany: {
            args: Prisma.ExamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ExamUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>[]
          }
          upsert: {
            args: Prisma.ExamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExamPayload>
          }
          aggregate: {
            args: Prisma.ExamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExam>
          }
          groupBy: {
            args: Prisma.ExamGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExamGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExamCountArgs<ExtArgs>
            result: $Utils.Optional<ExamCountAggregateOutputType> | number
          }
        }
      }
      Artifact: {
        payload: Prisma.$ArtifactPayload<ExtArgs>
        fields: Prisma.ArtifactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ArtifactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ArtifactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          findFirst: {
            args: Prisma.ArtifactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ArtifactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          findMany: {
            args: Prisma.ArtifactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>[]
          }
          create: {
            args: Prisma.ArtifactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          createMany: {
            args: Prisma.ArtifactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ArtifactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>[]
          }
          delete: {
            args: Prisma.ArtifactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          update: {
            args: Prisma.ArtifactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          deleteMany: {
            args: Prisma.ArtifactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ArtifactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ArtifactUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>[]
          }
          upsert: {
            args: Prisma.ArtifactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtifactPayload>
          }
          aggregate: {
            args: Prisma.ArtifactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateArtifact>
          }
          groupBy: {
            args: Prisma.ArtifactGroupByArgs<ExtArgs>
            result: $Utils.Optional<ArtifactGroupByOutputType>[]
          }
          count: {
            args: Prisma.ArtifactCountArgs<ExtArgs>
            result: $Utils.Optional<ArtifactCountAggregateOutputType> | number
          }
        }
      }
      ListingFingerprint: {
        payload: Prisma.$ListingFingerprintPayload<ExtArgs>
        fields: Prisma.ListingFingerprintFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ListingFingerprintFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ListingFingerprintFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          findFirst: {
            args: Prisma.ListingFingerprintFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ListingFingerprintFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          findMany: {
            args: Prisma.ListingFingerprintFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>[]
          }
          create: {
            args: Prisma.ListingFingerprintCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          createMany: {
            args: Prisma.ListingFingerprintCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ListingFingerprintCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>[]
          }
          delete: {
            args: Prisma.ListingFingerprintDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          update: {
            args: Prisma.ListingFingerprintUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          deleteMany: {
            args: Prisma.ListingFingerprintDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ListingFingerprintUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ListingFingerprintUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>[]
          }
          upsert: {
            args: Prisma.ListingFingerprintUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingFingerprintPayload>
          }
          aggregate: {
            args: Prisma.ListingFingerprintAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateListingFingerprint>
          }
          groupBy: {
            args: Prisma.ListingFingerprintGroupByArgs<ExtArgs>
            result: $Utils.Optional<ListingFingerprintGroupByOutputType>[]
          }
          count: {
            args: Prisma.ListingFingerprintCountArgs<ExtArgs>
            result: $Utils.Optional<ListingFingerprintCountAggregateOutputType> | number
          }
        }
      }
      ControlFlag: {
        payload: Prisma.$ControlFlagPayload<ExtArgs>
        fields: Prisma.ControlFlagFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ControlFlagFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ControlFlagFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          findFirst: {
            args: Prisma.ControlFlagFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ControlFlagFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          findMany: {
            args: Prisma.ControlFlagFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>[]
          }
          create: {
            args: Prisma.ControlFlagCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          createMany: {
            args: Prisma.ControlFlagCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ControlFlagCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>[]
          }
          delete: {
            args: Prisma.ControlFlagDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          update: {
            args: Prisma.ControlFlagUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          deleteMany: {
            args: Prisma.ControlFlagDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ControlFlagUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ControlFlagUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>[]
          }
          upsert: {
            args: Prisma.ControlFlagUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ControlFlagPayload>
          }
          aggregate: {
            args: Prisma.ControlFlagAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateControlFlag>
          }
          groupBy: {
            args: Prisma.ControlFlagGroupByArgs<ExtArgs>
            result: $Utils.Optional<ControlFlagGroupByOutputType>[]
          }
          count: {
            args: Prisma.ControlFlagCountArgs<ExtArgs>
            result: $Utils.Optional<ControlFlagCountAggregateOutputType> | number
          }
        }
      }
      CrawlRun: {
        payload: Prisma.$CrawlRunPayload<ExtArgs>
        fields: Prisma.CrawlRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrawlRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrawlRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          findFirst: {
            args: Prisma.CrawlRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrawlRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          findMany: {
            args: Prisma.CrawlRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>[]
          }
          create: {
            args: Prisma.CrawlRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          createMany: {
            args: Prisma.CrawlRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrawlRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>[]
          }
          delete: {
            args: Prisma.CrawlRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          update: {
            args: Prisma.CrawlRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          deleteMany: {
            args: Prisma.CrawlRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrawlRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CrawlRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>[]
          }
          upsert: {
            args: Prisma.CrawlRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrawlRunPayload>
          }
          aggregate: {
            args: Prisma.CrawlRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrawlRun>
          }
          groupBy: {
            args: Prisma.CrawlRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrawlRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrawlRunCountArgs<ExtArgs>
            result: $Utils.Optional<CrawlRunCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    source?: SourceOmit
    sourceProposal?: SourceProposalOmit
    exam?: ExamOmit
    artifact?: ArtifactOmit
    listingFingerprint?: ListingFingerprintOmit
    controlFlag?: ControlFlagOmit
    crawlRun?: CrawlRunOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type SourceCountOutputType
   */

  export type SourceCountOutputType = {
    exams: number
    artifacts: number
    proposals: number
    runs: number
    fingerprints: number
  }

  export type SourceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    exams?: boolean | SourceCountOutputTypeCountExamsArgs
    artifacts?: boolean | SourceCountOutputTypeCountArtifactsArgs
    proposals?: boolean | SourceCountOutputTypeCountProposalsArgs
    runs?: boolean | SourceCountOutputTypeCountRunsArgs
    fingerprints?: boolean | SourceCountOutputTypeCountFingerprintsArgs
  }

  // Custom InputTypes
  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceCountOutputType
     */
    select?: SourceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeCountExamsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExamWhereInput
  }

  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeCountArtifactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtifactWhereInput
  }

  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeCountProposalsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SourceProposalWhereInput
  }

  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeCountRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrawlRunWhereInput
  }

  /**
   * SourceCountOutputType without action
   */
  export type SourceCountOutputTypeCountFingerprintsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ListingFingerprintWhereInput
  }


  /**
   * Count Type ExamCountOutputType
   */

  export type ExamCountOutputType = {
    artifacts: number
  }

  export type ExamCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artifacts?: boolean | ExamCountOutputTypeCountArtifactsArgs
  }

  // Custom InputTypes
  /**
   * ExamCountOutputType without action
   */
  export type ExamCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ExamCountOutputType
     */
    select?: ExamCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ExamCountOutputType without action
   */
  export type ExamCountOutputTypeCountArtifactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtifactWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Source
   */

  export type AggregateSource = {
    _count: SourceCountAggregateOutputType | null
    _avg: SourceAvgAggregateOutputType | null
    _sum: SourceSumAggregateOutputType | null
    _min: SourceMinAggregateOutputType | null
    _max: SourceMaxAggregateOutputType | null
  }

  export type SourceAvgAggregateOutputType = {
    intervalSec: number | null
    politenessMs: number | null
    failCount: number | null
  }

  export type SourceSumAggregateOutputType = {
    intervalSec: number | null
    politenessMs: number | null
    failCount: number | null
  }

  export type SourceMinAggregateOutputType = {
    id: string | null
    domain: string | null
    name: string | null
    strategy: $Enums.CrawlStrategy | null
    linkSelector: string | null
    trust: $Enums.SourceTrust | null
    status: $Enums.SourceStatus | null
    enabled: boolean | null
    intervalSec: number | null
    politenessMs: number | null
    failCount: number | null
    lastOkAt: Date | null
    lastError: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SourceMaxAggregateOutputType = {
    id: string | null
    domain: string | null
    name: string | null
    strategy: $Enums.CrawlStrategy | null
    linkSelector: string | null
    trust: $Enums.SourceTrust | null
    status: $Enums.SourceStatus | null
    enabled: boolean | null
    intervalSec: number | null
    politenessMs: number | null
    failCount: number | null
    lastOkAt: Date | null
    lastError: string | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SourceCountAggregateOutputType = {
    id: number
    domain: number
    name: number
    startUrls: number
    strategy: number
    linkSelector: number
    linkPatterns: number
    openPatterns: number
    trust: number
    status: number
    enabled: number
    intervalSec: number
    politenessMs: number
    failCount: number
    lastOkAt: number
    lastError: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SourceAvgAggregateInputType = {
    intervalSec?: true
    politenessMs?: true
    failCount?: true
  }

  export type SourceSumAggregateInputType = {
    intervalSec?: true
    politenessMs?: true
    failCount?: true
  }

  export type SourceMinAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    strategy?: true
    linkSelector?: true
    trust?: true
    status?: true
    enabled?: true
    intervalSec?: true
    politenessMs?: true
    failCount?: true
    lastOkAt?: true
    lastError?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SourceMaxAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    strategy?: true
    linkSelector?: true
    trust?: true
    status?: true
    enabled?: true
    intervalSec?: true
    politenessMs?: true
    failCount?: true
    lastOkAt?: true
    lastError?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SourceCountAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    startUrls?: true
    strategy?: true
    linkSelector?: true
    linkPatterns?: true
    openPatterns?: true
    trust?: true
    status?: true
    enabled?: true
    intervalSec?: true
    politenessMs?: true
    failCount?: true
    lastOkAt?: true
    lastError?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SourceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Source to aggregate.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sources
    **/
    _count?: true | SourceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SourceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SourceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SourceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SourceMaxAggregateInputType
  }

  export type GetSourceAggregateType<T extends SourceAggregateArgs> = {
        [P in keyof T & keyof AggregateSource]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSource[P]>
      : GetScalarType<T[P], AggregateSource[P]>
  }




  export type SourceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SourceWhereInput
    orderBy?: SourceOrderByWithAggregationInput | SourceOrderByWithAggregationInput[]
    by: SourceScalarFieldEnum[] | SourceScalarFieldEnum
    having?: SourceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SourceCountAggregateInputType | true
    _avg?: SourceAvgAggregateInputType
    _sum?: SourceSumAggregateInputType
    _min?: SourceMinAggregateInputType
    _max?: SourceMaxAggregateInputType
  }

  export type SourceGroupByOutputType = {
    id: string
    domain: string
    name: string
    startUrls: JsonValue
    strategy: $Enums.CrawlStrategy
    linkSelector: string | null
    linkPatterns: JsonValue
    openPatterns: JsonValue
    trust: $Enums.SourceTrust
    status: $Enums.SourceStatus
    enabled: boolean
    intervalSec: number
    politenessMs: number
    failCount: number
    lastOkAt: Date | null
    lastError: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: SourceCountAggregateOutputType | null
    _avg: SourceAvgAggregateOutputType | null
    _sum: SourceSumAggregateOutputType | null
    _min: SourceMinAggregateOutputType | null
    _max: SourceMaxAggregateOutputType | null
  }

  type GetSourceGroupByPayload<T extends SourceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SourceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SourceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SourceGroupByOutputType[P]>
            : GetScalarType<T[P], SourceGroupByOutputType[P]>
        }
      >
    >


  export type SourceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    strategy?: boolean
    linkSelector?: boolean
    linkPatterns?: boolean
    openPatterns?: boolean
    trust?: boolean
    status?: boolean
    enabled?: boolean
    intervalSec?: boolean
    politenessMs?: boolean
    failCount?: boolean
    lastOkAt?: boolean
    lastError?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    exams?: boolean | Source$examsArgs<ExtArgs>
    artifacts?: boolean | Source$artifactsArgs<ExtArgs>
    proposals?: boolean | Source$proposalsArgs<ExtArgs>
    runs?: boolean | Source$runsArgs<ExtArgs>
    fingerprints?: boolean | Source$fingerprintsArgs<ExtArgs>
    _count?: boolean | SourceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["source"]>

  export type SourceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    strategy?: boolean
    linkSelector?: boolean
    linkPatterns?: boolean
    openPatterns?: boolean
    trust?: boolean
    status?: boolean
    enabled?: boolean
    intervalSec?: boolean
    politenessMs?: boolean
    failCount?: boolean
    lastOkAt?: boolean
    lastError?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["source"]>

  export type SourceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    strategy?: boolean
    linkSelector?: boolean
    linkPatterns?: boolean
    openPatterns?: boolean
    trust?: boolean
    status?: boolean
    enabled?: boolean
    intervalSec?: boolean
    politenessMs?: boolean
    failCount?: boolean
    lastOkAt?: boolean
    lastError?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["source"]>

  export type SourceSelectScalar = {
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    strategy?: boolean
    linkSelector?: boolean
    linkPatterns?: boolean
    openPatterns?: boolean
    trust?: boolean
    status?: boolean
    enabled?: boolean
    intervalSec?: boolean
    politenessMs?: boolean
    failCount?: boolean
    lastOkAt?: boolean
    lastError?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SourceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "domain" | "name" | "startUrls" | "strategy" | "linkSelector" | "linkPatterns" | "openPatterns" | "trust" | "status" | "enabled" | "intervalSec" | "politenessMs" | "failCount" | "lastOkAt" | "lastError" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["source"]>
  export type SourceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    exams?: boolean | Source$examsArgs<ExtArgs>
    artifacts?: boolean | Source$artifactsArgs<ExtArgs>
    proposals?: boolean | Source$proposalsArgs<ExtArgs>
    runs?: boolean | Source$runsArgs<ExtArgs>
    fingerprints?: boolean | Source$fingerprintsArgs<ExtArgs>
    _count?: boolean | SourceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SourceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SourceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SourcePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Source"
    objects: {
      exams: Prisma.$ExamPayload<ExtArgs>[]
      artifacts: Prisma.$ArtifactPayload<ExtArgs>[]
      proposals: Prisma.$SourceProposalPayload<ExtArgs>[]
      runs: Prisma.$CrawlRunPayload<ExtArgs>[]
      fingerprints: Prisma.$ListingFingerprintPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      domain: string
      name: string
      startUrls: Prisma.JsonValue
      strategy: $Enums.CrawlStrategy
      linkSelector: string | null
      linkPatterns: Prisma.JsonValue
      openPatterns: Prisma.JsonValue
      trust: $Enums.SourceTrust
      status: $Enums.SourceStatus
      enabled: boolean
      intervalSec: number
      politenessMs: number
      failCount: number
      lastOkAt: Date | null
      lastError: string | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["source"]>
    composites: {}
  }

  type SourceGetPayload<S extends boolean | null | undefined | SourceDefaultArgs> = $Result.GetResult<Prisma.$SourcePayload, S>

  type SourceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SourceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SourceCountAggregateInputType | true
    }

  export interface SourceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Source'], meta: { name: 'Source' } }
    /**
     * Find zero or one Source that matches the filter.
     * @param {SourceFindUniqueArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SourceFindUniqueArgs>(args: SelectSubset<T, SourceFindUniqueArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Source that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SourceFindUniqueOrThrowArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SourceFindUniqueOrThrowArgs>(args: SelectSubset<T, SourceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Source that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindFirstArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SourceFindFirstArgs>(args?: SelectSubset<T, SourceFindFirstArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Source that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindFirstOrThrowArgs} args - Arguments to find a Source
     * @example
     * // Get one Source
     * const source = await prisma.source.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SourceFindFirstOrThrowArgs>(args?: SelectSubset<T, SourceFindFirstOrThrowArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sources that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sources
     * const sources = await prisma.source.findMany()
     * 
     * // Get first 10 Sources
     * const sources = await prisma.source.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sourceWithIdOnly = await prisma.source.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SourceFindManyArgs>(args?: SelectSubset<T, SourceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Source.
     * @param {SourceCreateArgs} args - Arguments to create a Source.
     * @example
     * // Create one Source
     * const Source = await prisma.source.create({
     *   data: {
     *     // ... data to create a Source
     *   }
     * })
     * 
     */
    create<T extends SourceCreateArgs>(args: SelectSubset<T, SourceCreateArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sources.
     * @param {SourceCreateManyArgs} args - Arguments to create many Sources.
     * @example
     * // Create many Sources
     * const source = await prisma.source.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SourceCreateManyArgs>(args?: SelectSubset<T, SourceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sources and returns the data saved in the database.
     * @param {SourceCreateManyAndReturnArgs} args - Arguments to create many Sources.
     * @example
     * // Create many Sources
     * const source = await prisma.source.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sources and only return the `id`
     * const sourceWithIdOnly = await prisma.source.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SourceCreateManyAndReturnArgs>(args?: SelectSubset<T, SourceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Source.
     * @param {SourceDeleteArgs} args - Arguments to delete one Source.
     * @example
     * // Delete one Source
     * const Source = await prisma.source.delete({
     *   where: {
     *     // ... filter to delete one Source
     *   }
     * })
     * 
     */
    delete<T extends SourceDeleteArgs>(args: SelectSubset<T, SourceDeleteArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Source.
     * @param {SourceUpdateArgs} args - Arguments to update one Source.
     * @example
     * // Update one Source
     * const source = await prisma.source.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SourceUpdateArgs>(args: SelectSubset<T, SourceUpdateArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sources.
     * @param {SourceDeleteManyArgs} args - Arguments to filter Sources to delete.
     * @example
     * // Delete a few Sources
     * const { count } = await prisma.source.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SourceDeleteManyArgs>(args?: SelectSubset<T, SourceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sources
     * const source = await prisma.source.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SourceUpdateManyArgs>(args: SelectSubset<T, SourceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sources and returns the data updated in the database.
     * @param {SourceUpdateManyAndReturnArgs} args - Arguments to update many Sources.
     * @example
     * // Update many Sources
     * const source = await prisma.source.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sources and only return the `id`
     * const sourceWithIdOnly = await prisma.source.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SourceUpdateManyAndReturnArgs>(args: SelectSubset<T, SourceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Source.
     * @param {SourceUpsertArgs} args - Arguments to update or create a Source.
     * @example
     * // Update or create a Source
     * const source = await prisma.source.upsert({
     *   create: {
     *     // ... data to create a Source
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Source we want to update
     *   }
     * })
     */
    upsert<T extends SourceUpsertArgs>(args: SelectSubset<T, SourceUpsertArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceCountArgs} args - Arguments to filter Sources to count.
     * @example
     * // Count the number of Sources
     * const count = await prisma.source.count({
     *   where: {
     *     // ... the filter for the Sources we want to count
     *   }
     * })
    **/
    count<T extends SourceCountArgs>(
      args?: Subset<T, SourceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SourceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Source.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SourceAggregateArgs>(args: Subset<T, SourceAggregateArgs>): Prisma.PrismaPromise<GetSourceAggregateType<T>>

    /**
     * Group by Source.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SourceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SourceGroupByArgs['orderBy'] }
        : { orderBy?: SourceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SourceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSourceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Source model
   */
  readonly fields: SourceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Source.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SourceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    exams<T extends Source$examsArgs<ExtArgs> = {}>(args?: Subset<T, Source$examsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    artifacts<T extends Source$artifactsArgs<ExtArgs> = {}>(args?: Subset<T, Source$artifactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    proposals<T extends Source$proposalsArgs<ExtArgs> = {}>(args?: Subset<T, Source$proposalsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    runs<T extends Source$runsArgs<ExtArgs> = {}>(args?: Subset<T, Source$runsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    fingerprints<T extends Source$fingerprintsArgs<ExtArgs> = {}>(args?: Subset<T, Source$fingerprintsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Source model
   */
  interface SourceFieldRefs {
    readonly id: FieldRef<"Source", 'String'>
    readonly domain: FieldRef<"Source", 'String'>
    readonly name: FieldRef<"Source", 'String'>
    readonly startUrls: FieldRef<"Source", 'Json'>
    readonly strategy: FieldRef<"Source", 'CrawlStrategy'>
    readonly linkSelector: FieldRef<"Source", 'String'>
    readonly linkPatterns: FieldRef<"Source", 'Json'>
    readonly openPatterns: FieldRef<"Source", 'Json'>
    readonly trust: FieldRef<"Source", 'SourceTrust'>
    readonly status: FieldRef<"Source", 'SourceStatus'>
    readonly enabled: FieldRef<"Source", 'Boolean'>
    readonly intervalSec: FieldRef<"Source", 'Int'>
    readonly politenessMs: FieldRef<"Source", 'Int'>
    readonly failCount: FieldRef<"Source", 'Int'>
    readonly lastOkAt: FieldRef<"Source", 'DateTime'>
    readonly lastError: FieldRef<"Source", 'String'>
    readonly notes: FieldRef<"Source", 'String'>
    readonly createdAt: FieldRef<"Source", 'DateTime'>
    readonly updatedAt: FieldRef<"Source", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Source findUnique
   */
  export type SourceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source findUniqueOrThrow
   */
  export type SourceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source findFirst
   */
  export type SourceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sources.
     */
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source findFirstOrThrow
   */
  export type SourceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Source to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sources.
     */
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source findMany
   */
  export type SourceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter, which Sources to fetch.
     */
    where?: SourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sources to fetch.
     */
    orderBy?: SourceOrderByWithRelationInput | SourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sources.
     */
    cursor?: SourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sources.
     */
    skip?: number
    distinct?: SourceScalarFieldEnum | SourceScalarFieldEnum[]
  }

  /**
   * Source create
   */
  export type SourceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The data needed to create a Source.
     */
    data: XOR<SourceCreateInput, SourceUncheckedCreateInput>
  }

  /**
   * Source createMany
   */
  export type SourceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sources.
     */
    data: SourceCreateManyInput | SourceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Source createManyAndReturn
   */
  export type SourceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * The data used to create many Sources.
     */
    data: SourceCreateManyInput | SourceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Source update
   */
  export type SourceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The data needed to update a Source.
     */
    data: XOR<SourceUpdateInput, SourceUncheckedUpdateInput>
    /**
     * Choose, which Source to update.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source updateMany
   */
  export type SourceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sources.
     */
    data: XOR<SourceUpdateManyMutationInput, SourceUncheckedUpdateManyInput>
    /**
     * Filter which Sources to update
     */
    where?: SourceWhereInput
    /**
     * Limit how many Sources to update.
     */
    limit?: number
  }

  /**
   * Source updateManyAndReturn
   */
  export type SourceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * The data used to update Sources.
     */
    data: XOR<SourceUpdateManyMutationInput, SourceUncheckedUpdateManyInput>
    /**
     * Filter which Sources to update
     */
    where?: SourceWhereInput
    /**
     * Limit how many Sources to update.
     */
    limit?: number
  }

  /**
   * Source upsert
   */
  export type SourceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * The filter to search for the Source to update in case it exists.
     */
    where: SourceWhereUniqueInput
    /**
     * In case the Source found by the `where` argument doesn't exist, create a new Source with this data.
     */
    create: XOR<SourceCreateInput, SourceUncheckedCreateInput>
    /**
     * In case the Source was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SourceUpdateInput, SourceUncheckedUpdateInput>
  }

  /**
   * Source delete
   */
  export type SourceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    /**
     * Filter which Source to delete.
     */
    where: SourceWhereUniqueInput
  }

  /**
   * Source deleteMany
   */
  export type SourceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sources to delete
     */
    where?: SourceWhereInput
    /**
     * Limit how many Sources to delete.
     */
    limit?: number
  }

  /**
   * Source.exams
   */
  export type Source$examsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    where?: ExamWhereInput
    orderBy?: ExamOrderByWithRelationInput | ExamOrderByWithRelationInput[]
    cursor?: ExamWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * Source.artifacts
   */
  export type Source$artifactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    where?: ArtifactWhereInput
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    cursor?: ArtifactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtifactScalarFieldEnum | ArtifactScalarFieldEnum[]
  }

  /**
   * Source.proposals
   */
  export type Source$proposalsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    where?: SourceProposalWhereInput
    orderBy?: SourceProposalOrderByWithRelationInput | SourceProposalOrderByWithRelationInput[]
    cursor?: SourceProposalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SourceProposalScalarFieldEnum | SourceProposalScalarFieldEnum[]
  }

  /**
   * Source.runs
   */
  export type Source$runsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    where?: CrawlRunWhereInput
    orderBy?: CrawlRunOrderByWithRelationInput | CrawlRunOrderByWithRelationInput[]
    cursor?: CrawlRunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CrawlRunScalarFieldEnum | CrawlRunScalarFieldEnum[]
  }

  /**
   * Source.fingerprints
   */
  export type Source$fingerprintsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    where?: ListingFingerprintWhereInput
    orderBy?: ListingFingerprintOrderByWithRelationInput | ListingFingerprintOrderByWithRelationInput[]
    cursor?: ListingFingerprintWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingFingerprintScalarFieldEnum | ListingFingerprintScalarFieldEnum[]
  }

  /**
   * Source without action
   */
  export type SourceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
  }


  /**
   * Model SourceProposal
   */

  export type AggregateSourceProposal = {
    _count: SourceProposalCountAggregateOutputType | null
    _min: SourceProposalMinAggregateOutputType | null
    _max: SourceProposalMaxAggregateOutputType | null
  }

  export type SourceProposalMinAggregateOutputType = {
    id: string | null
    domain: string | null
    name: string | null
    reason: string | null
    status: $Enums.SourceStatus | null
    sourceId: string | null
    createdAt: Date | null
    reviewedAt: Date | null
  }

  export type SourceProposalMaxAggregateOutputType = {
    id: string | null
    domain: string | null
    name: string | null
    reason: string | null
    status: $Enums.SourceStatus | null
    sourceId: string | null
    createdAt: Date | null
    reviewedAt: Date | null
  }

  export type SourceProposalCountAggregateOutputType = {
    id: number
    domain: number
    name: number
    startUrls: number
    reason: number
    status: number
    sourceId: number
    createdAt: number
    reviewedAt: number
    _all: number
  }


  export type SourceProposalMinAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    reason?: true
    status?: true
    sourceId?: true
    createdAt?: true
    reviewedAt?: true
  }

  export type SourceProposalMaxAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    reason?: true
    status?: true
    sourceId?: true
    createdAt?: true
    reviewedAt?: true
  }

  export type SourceProposalCountAggregateInputType = {
    id?: true
    domain?: true
    name?: true
    startUrls?: true
    reason?: true
    status?: true
    sourceId?: true
    createdAt?: true
    reviewedAt?: true
    _all?: true
  }

  export type SourceProposalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SourceProposal to aggregate.
     */
    where?: SourceProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SourceProposals to fetch.
     */
    orderBy?: SourceProposalOrderByWithRelationInput | SourceProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SourceProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SourceProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SourceProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SourceProposals
    **/
    _count?: true | SourceProposalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SourceProposalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SourceProposalMaxAggregateInputType
  }

  export type GetSourceProposalAggregateType<T extends SourceProposalAggregateArgs> = {
        [P in keyof T & keyof AggregateSourceProposal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSourceProposal[P]>
      : GetScalarType<T[P], AggregateSourceProposal[P]>
  }




  export type SourceProposalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SourceProposalWhereInput
    orderBy?: SourceProposalOrderByWithAggregationInput | SourceProposalOrderByWithAggregationInput[]
    by: SourceProposalScalarFieldEnum[] | SourceProposalScalarFieldEnum
    having?: SourceProposalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SourceProposalCountAggregateInputType | true
    _min?: SourceProposalMinAggregateInputType
    _max?: SourceProposalMaxAggregateInputType
  }

  export type SourceProposalGroupByOutputType = {
    id: string
    domain: string
    name: string
    startUrls: JsonValue
    reason: string | null
    status: $Enums.SourceStatus
    sourceId: string | null
    createdAt: Date
    reviewedAt: Date | null
    _count: SourceProposalCountAggregateOutputType | null
    _min: SourceProposalMinAggregateOutputType | null
    _max: SourceProposalMaxAggregateOutputType | null
  }

  type GetSourceProposalGroupByPayload<T extends SourceProposalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SourceProposalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SourceProposalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SourceProposalGroupByOutputType[P]>
            : GetScalarType<T[P], SourceProposalGroupByOutputType[P]>
        }
      >
    >


  export type SourceProposalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    reason?: boolean
    status?: boolean
    sourceId?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["sourceProposal"]>

  export type SourceProposalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    reason?: boolean
    status?: boolean
    sourceId?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["sourceProposal"]>

  export type SourceProposalSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    reason?: boolean
    status?: boolean
    sourceId?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["sourceProposal"]>

  export type SourceProposalSelectScalar = {
    id?: boolean
    domain?: boolean
    name?: boolean
    startUrls?: boolean
    reason?: boolean
    status?: boolean
    sourceId?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
  }

  export type SourceProposalOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "domain" | "name" | "startUrls" | "reason" | "status" | "sourceId" | "createdAt" | "reviewedAt", ExtArgs["result"]["sourceProposal"]>
  export type SourceProposalInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }
  export type SourceProposalIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }
  export type SourceProposalIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceProposal$sourceArgs<ExtArgs>
  }

  export type $SourceProposalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SourceProposal"
    objects: {
      source: Prisma.$SourcePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      domain: string
      name: string
      startUrls: Prisma.JsonValue
      reason: string | null
      status: $Enums.SourceStatus
      sourceId: string | null
      createdAt: Date
      reviewedAt: Date | null
    }, ExtArgs["result"]["sourceProposal"]>
    composites: {}
  }

  type SourceProposalGetPayload<S extends boolean | null | undefined | SourceProposalDefaultArgs> = $Result.GetResult<Prisma.$SourceProposalPayload, S>

  type SourceProposalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SourceProposalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SourceProposalCountAggregateInputType | true
    }

  export interface SourceProposalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SourceProposal'], meta: { name: 'SourceProposal' } }
    /**
     * Find zero or one SourceProposal that matches the filter.
     * @param {SourceProposalFindUniqueArgs} args - Arguments to find a SourceProposal
     * @example
     * // Get one SourceProposal
     * const sourceProposal = await prisma.sourceProposal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SourceProposalFindUniqueArgs>(args: SelectSubset<T, SourceProposalFindUniqueArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SourceProposal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SourceProposalFindUniqueOrThrowArgs} args - Arguments to find a SourceProposal
     * @example
     * // Get one SourceProposal
     * const sourceProposal = await prisma.sourceProposal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SourceProposalFindUniqueOrThrowArgs>(args: SelectSubset<T, SourceProposalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SourceProposal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalFindFirstArgs} args - Arguments to find a SourceProposal
     * @example
     * // Get one SourceProposal
     * const sourceProposal = await prisma.sourceProposal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SourceProposalFindFirstArgs>(args?: SelectSubset<T, SourceProposalFindFirstArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SourceProposal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalFindFirstOrThrowArgs} args - Arguments to find a SourceProposal
     * @example
     * // Get one SourceProposal
     * const sourceProposal = await prisma.sourceProposal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SourceProposalFindFirstOrThrowArgs>(args?: SelectSubset<T, SourceProposalFindFirstOrThrowArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SourceProposals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SourceProposals
     * const sourceProposals = await prisma.sourceProposal.findMany()
     * 
     * // Get first 10 SourceProposals
     * const sourceProposals = await prisma.sourceProposal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sourceProposalWithIdOnly = await prisma.sourceProposal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SourceProposalFindManyArgs>(args?: SelectSubset<T, SourceProposalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SourceProposal.
     * @param {SourceProposalCreateArgs} args - Arguments to create a SourceProposal.
     * @example
     * // Create one SourceProposal
     * const SourceProposal = await prisma.sourceProposal.create({
     *   data: {
     *     // ... data to create a SourceProposal
     *   }
     * })
     * 
     */
    create<T extends SourceProposalCreateArgs>(args: SelectSubset<T, SourceProposalCreateArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SourceProposals.
     * @param {SourceProposalCreateManyArgs} args - Arguments to create many SourceProposals.
     * @example
     * // Create many SourceProposals
     * const sourceProposal = await prisma.sourceProposal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SourceProposalCreateManyArgs>(args?: SelectSubset<T, SourceProposalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SourceProposals and returns the data saved in the database.
     * @param {SourceProposalCreateManyAndReturnArgs} args - Arguments to create many SourceProposals.
     * @example
     * // Create many SourceProposals
     * const sourceProposal = await prisma.sourceProposal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SourceProposals and only return the `id`
     * const sourceProposalWithIdOnly = await prisma.sourceProposal.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SourceProposalCreateManyAndReturnArgs>(args?: SelectSubset<T, SourceProposalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SourceProposal.
     * @param {SourceProposalDeleteArgs} args - Arguments to delete one SourceProposal.
     * @example
     * // Delete one SourceProposal
     * const SourceProposal = await prisma.sourceProposal.delete({
     *   where: {
     *     // ... filter to delete one SourceProposal
     *   }
     * })
     * 
     */
    delete<T extends SourceProposalDeleteArgs>(args: SelectSubset<T, SourceProposalDeleteArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SourceProposal.
     * @param {SourceProposalUpdateArgs} args - Arguments to update one SourceProposal.
     * @example
     * // Update one SourceProposal
     * const sourceProposal = await prisma.sourceProposal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SourceProposalUpdateArgs>(args: SelectSubset<T, SourceProposalUpdateArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SourceProposals.
     * @param {SourceProposalDeleteManyArgs} args - Arguments to filter SourceProposals to delete.
     * @example
     * // Delete a few SourceProposals
     * const { count } = await prisma.sourceProposal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SourceProposalDeleteManyArgs>(args?: SelectSubset<T, SourceProposalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SourceProposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SourceProposals
     * const sourceProposal = await prisma.sourceProposal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SourceProposalUpdateManyArgs>(args: SelectSubset<T, SourceProposalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SourceProposals and returns the data updated in the database.
     * @param {SourceProposalUpdateManyAndReturnArgs} args - Arguments to update many SourceProposals.
     * @example
     * // Update many SourceProposals
     * const sourceProposal = await prisma.sourceProposal.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SourceProposals and only return the `id`
     * const sourceProposalWithIdOnly = await prisma.sourceProposal.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SourceProposalUpdateManyAndReturnArgs>(args: SelectSubset<T, SourceProposalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SourceProposal.
     * @param {SourceProposalUpsertArgs} args - Arguments to update or create a SourceProposal.
     * @example
     * // Update or create a SourceProposal
     * const sourceProposal = await prisma.sourceProposal.upsert({
     *   create: {
     *     // ... data to create a SourceProposal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SourceProposal we want to update
     *   }
     * })
     */
    upsert<T extends SourceProposalUpsertArgs>(args: SelectSubset<T, SourceProposalUpsertArgs<ExtArgs>>): Prisma__SourceProposalClient<$Result.GetResult<Prisma.$SourceProposalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SourceProposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalCountArgs} args - Arguments to filter SourceProposals to count.
     * @example
     * // Count the number of SourceProposals
     * const count = await prisma.sourceProposal.count({
     *   where: {
     *     // ... the filter for the SourceProposals we want to count
     *   }
     * })
    **/
    count<T extends SourceProposalCountArgs>(
      args?: Subset<T, SourceProposalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SourceProposalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SourceProposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SourceProposalAggregateArgs>(args: Subset<T, SourceProposalAggregateArgs>): Prisma.PrismaPromise<GetSourceProposalAggregateType<T>>

    /**
     * Group by SourceProposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SourceProposalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SourceProposalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SourceProposalGroupByArgs['orderBy'] }
        : { orderBy?: SourceProposalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SourceProposalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSourceProposalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SourceProposal model
   */
  readonly fields: SourceProposalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SourceProposal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SourceProposalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    source<T extends SourceProposal$sourceArgs<ExtArgs> = {}>(args?: Subset<T, SourceProposal$sourceArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SourceProposal model
   */
  interface SourceProposalFieldRefs {
    readonly id: FieldRef<"SourceProposal", 'String'>
    readonly domain: FieldRef<"SourceProposal", 'String'>
    readonly name: FieldRef<"SourceProposal", 'String'>
    readonly startUrls: FieldRef<"SourceProposal", 'Json'>
    readonly reason: FieldRef<"SourceProposal", 'String'>
    readonly status: FieldRef<"SourceProposal", 'SourceStatus'>
    readonly sourceId: FieldRef<"SourceProposal", 'String'>
    readonly createdAt: FieldRef<"SourceProposal", 'DateTime'>
    readonly reviewedAt: FieldRef<"SourceProposal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SourceProposal findUnique
   */
  export type SourceProposalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter, which SourceProposal to fetch.
     */
    where: SourceProposalWhereUniqueInput
  }

  /**
   * SourceProposal findUniqueOrThrow
   */
  export type SourceProposalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter, which SourceProposal to fetch.
     */
    where: SourceProposalWhereUniqueInput
  }

  /**
   * SourceProposal findFirst
   */
  export type SourceProposalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter, which SourceProposal to fetch.
     */
    where?: SourceProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SourceProposals to fetch.
     */
    orderBy?: SourceProposalOrderByWithRelationInput | SourceProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SourceProposals.
     */
    cursor?: SourceProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SourceProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SourceProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SourceProposals.
     */
    distinct?: SourceProposalScalarFieldEnum | SourceProposalScalarFieldEnum[]
  }

  /**
   * SourceProposal findFirstOrThrow
   */
  export type SourceProposalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter, which SourceProposal to fetch.
     */
    where?: SourceProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SourceProposals to fetch.
     */
    orderBy?: SourceProposalOrderByWithRelationInput | SourceProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SourceProposals.
     */
    cursor?: SourceProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SourceProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SourceProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SourceProposals.
     */
    distinct?: SourceProposalScalarFieldEnum | SourceProposalScalarFieldEnum[]
  }

  /**
   * SourceProposal findMany
   */
  export type SourceProposalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter, which SourceProposals to fetch.
     */
    where?: SourceProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SourceProposals to fetch.
     */
    orderBy?: SourceProposalOrderByWithRelationInput | SourceProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SourceProposals.
     */
    cursor?: SourceProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SourceProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SourceProposals.
     */
    skip?: number
    distinct?: SourceProposalScalarFieldEnum | SourceProposalScalarFieldEnum[]
  }

  /**
   * SourceProposal create
   */
  export type SourceProposalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * The data needed to create a SourceProposal.
     */
    data: XOR<SourceProposalCreateInput, SourceProposalUncheckedCreateInput>
  }

  /**
   * SourceProposal createMany
   */
  export type SourceProposalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SourceProposals.
     */
    data: SourceProposalCreateManyInput | SourceProposalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SourceProposal createManyAndReturn
   */
  export type SourceProposalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * The data used to create many SourceProposals.
     */
    data: SourceProposalCreateManyInput | SourceProposalCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SourceProposal update
   */
  export type SourceProposalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * The data needed to update a SourceProposal.
     */
    data: XOR<SourceProposalUpdateInput, SourceProposalUncheckedUpdateInput>
    /**
     * Choose, which SourceProposal to update.
     */
    where: SourceProposalWhereUniqueInput
  }

  /**
   * SourceProposal updateMany
   */
  export type SourceProposalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SourceProposals.
     */
    data: XOR<SourceProposalUpdateManyMutationInput, SourceProposalUncheckedUpdateManyInput>
    /**
     * Filter which SourceProposals to update
     */
    where?: SourceProposalWhereInput
    /**
     * Limit how many SourceProposals to update.
     */
    limit?: number
  }

  /**
   * SourceProposal updateManyAndReturn
   */
  export type SourceProposalUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * The data used to update SourceProposals.
     */
    data: XOR<SourceProposalUpdateManyMutationInput, SourceProposalUncheckedUpdateManyInput>
    /**
     * Filter which SourceProposals to update
     */
    where?: SourceProposalWhereInput
    /**
     * Limit how many SourceProposals to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SourceProposal upsert
   */
  export type SourceProposalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * The filter to search for the SourceProposal to update in case it exists.
     */
    where: SourceProposalWhereUniqueInput
    /**
     * In case the SourceProposal found by the `where` argument doesn't exist, create a new SourceProposal with this data.
     */
    create: XOR<SourceProposalCreateInput, SourceProposalUncheckedCreateInput>
    /**
     * In case the SourceProposal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SourceProposalUpdateInput, SourceProposalUncheckedUpdateInput>
  }

  /**
   * SourceProposal delete
   */
  export type SourceProposalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
    /**
     * Filter which SourceProposal to delete.
     */
    where: SourceProposalWhereUniqueInput
  }

  /**
   * SourceProposal deleteMany
   */
  export type SourceProposalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SourceProposals to delete
     */
    where?: SourceProposalWhereInput
    /**
     * Limit how many SourceProposals to delete.
     */
    limit?: number
  }

  /**
   * SourceProposal.source
   */
  export type SourceProposal$sourceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    where?: SourceWhereInput
  }

  /**
   * SourceProposal without action
   */
  export type SourceProposalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SourceProposal
     */
    select?: SourceProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SourceProposal
     */
    omit?: SourceProposalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceProposalInclude<ExtArgs> | null
  }


  /**
   * Model Exam
   */

  export type AggregateExam = {
    _count: ExamCountAggregateOutputType | null
    _min: ExamMinAggregateOutputType | null
    _max: ExamMaxAggregateOutputType | null
  }

  export type ExamMinAggregateOutputType = {
    id: string | null
    examSlug: string | null
    title: string | null
    org: string | null
    banca: string | null
    editalUrl: string | null
    listingUrl: string | null
    status: $Enums.ExamStatus | null
    sourceId: string | null
    sourceDomain: string | null
    discoveredAt: Date | null
    lastSeenAt: Date | null
  }

  export type ExamMaxAggregateOutputType = {
    id: string | null
    examSlug: string | null
    title: string | null
    org: string | null
    banca: string | null
    editalUrl: string | null
    listingUrl: string | null
    status: $Enums.ExamStatus | null
    sourceId: string | null
    sourceDomain: string | null
    discoveredAt: Date | null
    lastSeenAt: Date | null
  }

  export type ExamCountAggregateOutputType = {
    id: number
    examSlug: number
    title: number
    org: number
    banca: number
    emphasis: number
    editalUrl: number
    listingUrl: number
    status: number
    sourceId: number
    sourceDomain: number
    discoveredAt: number
    lastSeenAt: number
    _all: number
  }


  export type ExamMinAggregateInputType = {
    id?: true
    examSlug?: true
    title?: true
    org?: true
    banca?: true
    editalUrl?: true
    listingUrl?: true
    status?: true
    sourceId?: true
    sourceDomain?: true
    discoveredAt?: true
    lastSeenAt?: true
  }

  export type ExamMaxAggregateInputType = {
    id?: true
    examSlug?: true
    title?: true
    org?: true
    banca?: true
    editalUrl?: true
    listingUrl?: true
    status?: true
    sourceId?: true
    sourceDomain?: true
    discoveredAt?: true
    lastSeenAt?: true
  }

  export type ExamCountAggregateInputType = {
    id?: true
    examSlug?: true
    title?: true
    org?: true
    banca?: true
    emphasis?: true
    editalUrl?: true
    listingUrl?: true
    status?: true
    sourceId?: true
    sourceDomain?: true
    discoveredAt?: true
    lastSeenAt?: true
    _all?: true
  }

  export type ExamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Exam to aggregate.
     */
    where?: ExamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exams to fetch.
     */
    orderBy?: ExamOrderByWithRelationInput | ExamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Exams
    **/
    _count?: true | ExamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExamMaxAggregateInputType
  }

  export type GetExamAggregateType<T extends ExamAggregateArgs> = {
        [P in keyof T & keyof AggregateExam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExam[P]>
      : GetScalarType<T[P], AggregateExam[P]>
  }




  export type ExamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExamWhereInput
    orderBy?: ExamOrderByWithAggregationInput | ExamOrderByWithAggregationInput[]
    by: ExamScalarFieldEnum[] | ExamScalarFieldEnum
    having?: ExamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExamCountAggregateInputType | true
    _min?: ExamMinAggregateInputType
    _max?: ExamMaxAggregateInputType
  }

  export type ExamGroupByOutputType = {
    id: string
    examSlug: string
    title: string
    org: string | null
    banca: string | null
    emphasis: JsonValue
    editalUrl: string | null
    listingUrl: string
    status: $Enums.ExamStatus
    sourceId: string
    sourceDomain: string
    discoveredAt: Date
    lastSeenAt: Date
    _count: ExamCountAggregateOutputType | null
    _min: ExamMinAggregateOutputType | null
    _max: ExamMaxAggregateOutputType | null
  }

  type GetExamGroupByPayload<T extends ExamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExamGroupByOutputType[P]>
            : GetScalarType<T[P], ExamGroupByOutputType[P]>
        }
      >
    >


  export type ExamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    title?: boolean
    org?: boolean
    banca?: boolean
    emphasis?: boolean
    editalUrl?: boolean
    listingUrl?: boolean
    status?: boolean
    sourceId?: boolean
    sourceDomain?: boolean
    discoveredAt?: boolean
    lastSeenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
    artifacts?: boolean | Exam$artifactsArgs<ExtArgs>
    _count?: boolean | ExamCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["exam"]>

  export type ExamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    title?: boolean
    org?: boolean
    banca?: boolean
    emphasis?: boolean
    editalUrl?: boolean
    listingUrl?: boolean
    status?: boolean
    sourceId?: boolean
    sourceDomain?: boolean
    discoveredAt?: boolean
    lastSeenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["exam"]>

  export type ExamSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    title?: boolean
    org?: boolean
    banca?: boolean
    emphasis?: boolean
    editalUrl?: boolean
    listingUrl?: boolean
    status?: boolean
    sourceId?: boolean
    sourceDomain?: boolean
    discoveredAt?: boolean
    lastSeenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["exam"]>

  export type ExamSelectScalar = {
    id?: boolean
    examSlug?: boolean
    title?: boolean
    org?: boolean
    banca?: boolean
    emphasis?: boolean
    editalUrl?: boolean
    listingUrl?: boolean
    status?: boolean
    sourceId?: boolean
    sourceDomain?: boolean
    discoveredAt?: boolean
    lastSeenAt?: boolean
  }

  export type ExamOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "examSlug" | "title" | "org" | "banca" | "emphasis" | "editalUrl" | "listingUrl" | "status" | "sourceId" | "sourceDomain" | "discoveredAt" | "lastSeenAt", ExtArgs["result"]["exam"]>
  export type ExamInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
    artifacts?: boolean | Exam$artifactsArgs<ExtArgs>
    _count?: boolean | ExamCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ExamIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }
  export type ExamIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }

  export type $ExamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Exam"
    objects: {
      source: Prisma.$SourcePayload<ExtArgs>
      artifacts: Prisma.$ArtifactPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      examSlug: string
      title: string
      org: string | null
      banca: string | null
      emphasis: Prisma.JsonValue
      editalUrl: string | null
      listingUrl: string
      status: $Enums.ExamStatus
      sourceId: string
      sourceDomain: string
      discoveredAt: Date
      lastSeenAt: Date
    }, ExtArgs["result"]["exam"]>
    composites: {}
  }

  type ExamGetPayload<S extends boolean | null | undefined | ExamDefaultArgs> = $Result.GetResult<Prisma.$ExamPayload, S>

  type ExamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ExamFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ExamCountAggregateInputType | true
    }

  export interface ExamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Exam'], meta: { name: 'Exam' } }
    /**
     * Find zero or one Exam that matches the filter.
     * @param {ExamFindUniqueArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExamFindUniqueArgs>(args: SelectSubset<T, ExamFindUniqueArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Exam that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExamFindUniqueOrThrowArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExamFindUniqueOrThrowArgs>(args: SelectSubset<T, ExamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exam that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamFindFirstArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExamFindFirstArgs>(args?: SelectSubset<T, ExamFindFirstArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exam that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamFindFirstOrThrowArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExamFindFirstOrThrowArgs>(args?: SelectSubset<T, ExamFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Exams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Exams
     * const exams = await prisma.exam.findMany()
     * 
     * // Get first 10 Exams
     * const exams = await prisma.exam.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const examWithIdOnly = await prisma.exam.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExamFindManyArgs>(args?: SelectSubset<T, ExamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Exam.
     * @param {ExamCreateArgs} args - Arguments to create a Exam.
     * @example
     * // Create one Exam
     * const Exam = await prisma.exam.create({
     *   data: {
     *     // ... data to create a Exam
     *   }
     * })
     * 
     */
    create<T extends ExamCreateArgs>(args: SelectSubset<T, ExamCreateArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Exams.
     * @param {ExamCreateManyArgs} args - Arguments to create many Exams.
     * @example
     * // Create many Exams
     * const exam = await prisma.exam.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExamCreateManyArgs>(args?: SelectSubset<T, ExamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Exams and returns the data saved in the database.
     * @param {ExamCreateManyAndReturnArgs} args - Arguments to create many Exams.
     * @example
     * // Create many Exams
     * const exam = await prisma.exam.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Exams and only return the `id`
     * const examWithIdOnly = await prisma.exam.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExamCreateManyAndReturnArgs>(args?: SelectSubset<T, ExamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Exam.
     * @param {ExamDeleteArgs} args - Arguments to delete one Exam.
     * @example
     * // Delete one Exam
     * const Exam = await prisma.exam.delete({
     *   where: {
     *     // ... filter to delete one Exam
     *   }
     * })
     * 
     */
    delete<T extends ExamDeleteArgs>(args: SelectSubset<T, ExamDeleteArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Exam.
     * @param {ExamUpdateArgs} args - Arguments to update one Exam.
     * @example
     * // Update one Exam
     * const exam = await prisma.exam.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExamUpdateArgs>(args: SelectSubset<T, ExamUpdateArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Exams.
     * @param {ExamDeleteManyArgs} args - Arguments to filter Exams to delete.
     * @example
     * // Delete a few Exams
     * const { count } = await prisma.exam.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExamDeleteManyArgs>(args?: SelectSubset<T, ExamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Exams
     * const exam = await prisma.exam.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExamUpdateManyArgs>(args: SelectSubset<T, ExamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exams and returns the data updated in the database.
     * @param {ExamUpdateManyAndReturnArgs} args - Arguments to update many Exams.
     * @example
     * // Update many Exams
     * const exam = await prisma.exam.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Exams and only return the `id`
     * const examWithIdOnly = await prisma.exam.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ExamUpdateManyAndReturnArgs>(args: SelectSubset<T, ExamUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Exam.
     * @param {ExamUpsertArgs} args - Arguments to update or create a Exam.
     * @example
     * // Update or create a Exam
     * const exam = await prisma.exam.upsert({
     *   create: {
     *     // ... data to create a Exam
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Exam we want to update
     *   }
     * })
     */
    upsert<T extends ExamUpsertArgs>(args: SelectSubset<T, ExamUpsertArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Exams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamCountArgs} args - Arguments to filter Exams to count.
     * @example
     * // Count the number of Exams
     * const count = await prisma.exam.count({
     *   where: {
     *     // ... the filter for the Exams we want to count
     *   }
     * })
    **/
    count<T extends ExamCountArgs>(
      args?: Subset<T, ExamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Exam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExamAggregateArgs>(args: Subset<T, ExamAggregateArgs>): Prisma.PrismaPromise<GetExamAggregateType<T>>

    /**
     * Group by Exam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ExamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExamGroupByArgs['orderBy'] }
        : { orderBy?: ExamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ExamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Exam model
   */
  readonly fields: ExamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Exam.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    source<T extends SourceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SourceDefaultArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    artifacts<T extends Exam$artifactsArgs<ExtArgs> = {}>(args?: Subset<T, Exam$artifactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Exam model
   */
  interface ExamFieldRefs {
    readonly id: FieldRef<"Exam", 'String'>
    readonly examSlug: FieldRef<"Exam", 'String'>
    readonly title: FieldRef<"Exam", 'String'>
    readonly org: FieldRef<"Exam", 'String'>
    readonly banca: FieldRef<"Exam", 'String'>
    readonly emphasis: FieldRef<"Exam", 'Json'>
    readonly editalUrl: FieldRef<"Exam", 'String'>
    readonly listingUrl: FieldRef<"Exam", 'String'>
    readonly status: FieldRef<"Exam", 'ExamStatus'>
    readonly sourceId: FieldRef<"Exam", 'String'>
    readonly sourceDomain: FieldRef<"Exam", 'String'>
    readonly discoveredAt: FieldRef<"Exam", 'DateTime'>
    readonly lastSeenAt: FieldRef<"Exam", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Exam findUnique
   */
  export type ExamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter, which Exam to fetch.
     */
    where: ExamWhereUniqueInput
  }

  /**
   * Exam findUniqueOrThrow
   */
  export type ExamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter, which Exam to fetch.
     */
    where: ExamWhereUniqueInput
  }

  /**
   * Exam findFirst
   */
  export type ExamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter, which Exam to fetch.
     */
    where?: ExamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exams to fetch.
     */
    orderBy?: ExamOrderByWithRelationInput | ExamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Exams.
     */
    cursor?: ExamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Exams.
     */
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * Exam findFirstOrThrow
   */
  export type ExamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter, which Exam to fetch.
     */
    where?: ExamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exams to fetch.
     */
    orderBy?: ExamOrderByWithRelationInput | ExamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Exams.
     */
    cursor?: ExamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Exams.
     */
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * Exam findMany
   */
  export type ExamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter, which Exams to fetch.
     */
    where?: ExamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exams to fetch.
     */
    orderBy?: ExamOrderByWithRelationInput | ExamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Exams.
     */
    cursor?: ExamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exams.
     */
    skip?: number
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * Exam create
   */
  export type ExamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * The data needed to create a Exam.
     */
    data: XOR<ExamCreateInput, ExamUncheckedCreateInput>
  }

  /**
   * Exam createMany
   */
  export type ExamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Exams.
     */
    data: ExamCreateManyInput | ExamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Exam createManyAndReturn
   */
  export type ExamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * The data used to create many Exams.
     */
    data: ExamCreateManyInput | ExamCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Exam update
   */
  export type ExamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * The data needed to update a Exam.
     */
    data: XOR<ExamUpdateInput, ExamUncheckedUpdateInput>
    /**
     * Choose, which Exam to update.
     */
    where: ExamWhereUniqueInput
  }

  /**
   * Exam updateMany
   */
  export type ExamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Exams.
     */
    data: XOR<ExamUpdateManyMutationInput, ExamUncheckedUpdateManyInput>
    /**
     * Filter which Exams to update
     */
    where?: ExamWhereInput
    /**
     * Limit how many Exams to update.
     */
    limit?: number
  }

  /**
   * Exam updateManyAndReturn
   */
  export type ExamUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * The data used to update Exams.
     */
    data: XOR<ExamUpdateManyMutationInput, ExamUncheckedUpdateManyInput>
    /**
     * Filter which Exams to update
     */
    where?: ExamWhereInput
    /**
     * Limit how many Exams to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Exam upsert
   */
  export type ExamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * The filter to search for the Exam to update in case it exists.
     */
    where: ExamWhereUniqueInput
    /**
     * In case the Exam found by the `where` argument doesn't exist, create a new Exam with this data.
     */
    create: XOR<ExamCreateInput, ExamUncheckedCreateInput>
    /**
     * In case the Exam was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExamUpdateInput, ExamUncheckedUpdateInput>
  }

  /**
   * Exam delete
   */
  export type ExamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    /**
     * Filter which Exam to delete.
     */
    where: ExamWhereUniqueInput
  }

  /**
   * Exam deleteMany
   */
  export type ExamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Exams to delete
     */
    where?: ExamWhereInput
    /**
     * Limit how many Exams to delete.
     */
    limit?: number
  }

  /**
   * Exam.artifacts
   */
  export type Exam$artifactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    where?: ArtifactWhereInput
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    cursor?: ArtifactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtifactScalarFieldEnum | ArtifactScalarFieldEnum[]
  }

  /**
   * Exam without action
   */
  export type ExamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
  }


  /**
   * Model Artifact
   */

  export type AggregateArtifact = {
    _count: ArtifactCountAggregateOutputType | null
    _avg: ArtifactAvgAggregateOutputType | null
    _sum: ArtifactSumAggregateOutputType | null
    _min: ArtifactMinAggregateOutputType | null
    _max: ArtifactMaxAggregateOutputType | null
  }

  export type ArtifactAvgAggregateOutputType = {
    byteSize: number | null
  }

  export type ArtifactSumAggregateOutputType = {
    byteSize: number | null
  }

  export type ArtifactMinAggregateOutputType = {
    id: string | null
    examId: string | null
    sourceId: string | null
    kind: $Enums.ArtifactKind | null
    url: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    byteSize: number | null
    fetchedAt: Date | null
    published: boolean | null
  }

  export type ArtifactMaxAggregateOutputType = {
    id: string | null
    examId: string | null
    sourceId: string | null
    kind: $Enums.ArtifactKind | null
    url: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    byteSize: number | null
    fetchedAt: Date | null
    published: boolean | null
  }

  export type ArtifactCountAggregateOutputType = {
    id: number
    examId: number
    sourceId: number
    kind: number
    url: number
    storageKey: number
    checksum: number
    contentType: number
    byteSize: number
    fetchedAt: number
    published: number
    _all: number
  }


  export type ArtifactAvgAggregateInputType = {
    byteSize?: true
  }

  export type ArtifactSumAggregateInputType = {
    byteSize?: true
  }

  export type ArtifactMinAggregateInputType = {
    id?: true
    examId?: true
    sourceId?: true
    kind?: true
    url?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    byteSize?: true
    fetchedAt?: true
    published?: true
  }

  export type ArtifactMaxAggregateInputType = {
    id?: true
    examId?: true
    sourceId?: true
    kind?: true
    url?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    byteSize?: true
    fetchedAt?: true
    published?: true
  }

  export type ArtifactCountAggregateInputType = {
    id?: true
    examId?: true
    sourceId?: true
    kind?: true
    url?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    byteSize?: true
    fetchedAt?: true
    published?: true
    _all?: true
  }

  export type ArtifactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artifact to aggregate.
     */
    where?: ArtifactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artifacts to fetch.
     */
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ArtifactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artifacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artifacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Artifacts
    **/
    _count?: true | ArtifactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ArtifactAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ArtifactSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ArtifactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ArtifactMaxAggregateInputType
  }

  export type GetArtifactAggregateType<T extends ArtifactAggregateArgs> = {
        [P in keyof T & keyof AggregateArtifact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateArtifact[P]>
      : GetScalarType<T[P], AggregateArtifact[P]>
  }




  export type ArtifactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtifactWhereInput
    orderBy?: ArtifactOrderByWithAggregationInput | ArtifactOrderByWithAggregationInput[]
    by: ArtifactScalarFieldEnum[] | ArtifactScalarFieldEnum
    having?: ArtifactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ArtifactCountAggregateInputType | true
    _avg?: ArtifactAvgAggregateInputType
    _sum?: ArtifactSumAggregateInputType
    _min?: ArtifactMinAggregateInputType
    _max?: ArtifactMaxAggregateInputType
  }

  export type ArtifactGroupByOutputType = {
    id: string
    examId: string | null
    sourceId: string | null
    kind: $Enums.ArtifactKind
    url: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    byteSize: number | null
    fetchedAt: Date
    published: boolean
    _count: ArtifactCountAggregateOutputType | null
    _avg: ArtifactAvgAggregateOutputType | null
    _sum: ArtifactSumAggregateOutputType | null
    _min: ArtifactMinAggregateOutputType | null
    _max: ArtifactMaxAggregateOutputType | null
  }

  type GetArtifactGroupByPayload<T extends ArtifactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ArtifactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ArtifactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ArtifactGroupByOutputType[P]>
            : GetScalarType<T[P], ArtifactGroupByOutputType[P]>
        }
      >
    >


  export type ArtifactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examId?: boolean
    sourceId?: boolean
    kind?: boolean
    url?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    byteSize?: boolean
    fetchedAt?: boolean
    published?: boolean
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["artifact"]>

  export type ArtifactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examId?: boolean
    sourceId?: boolean
    kind?: boolean
    url?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    byteSize?: boolean
    fetchedAt?: boolean
    published?: boolean
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["artifact"]>

  export type ArtifactSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examId?: boolean
    sourceId?: boolean
    kind?: boolean
    url?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    byteSize?: boolean
    fetchedAt?: boolean
    published?: boolean
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["artifact"]>

  export type ArtifactSelectScalar = {
    id?: boolean
    examId?: boolean
    sourceId?: boolean
    kind?: boolean
    url?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    byteSize?: boolean
    fetchedAt?: boolean
    published?: boolean
  }

  export type ArtifactOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "examId" | "sourceId" | "kind" | "url" | "storageKey" | "checksum" | "contentType" | "byteSize" | "fetchedAt" | "published", ExtArgs["result"]["artifact"]>
  export type ArtifactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }
  export type ArtifactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }
  export type ArtifactIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    exam?: boolean | Artifact$examArgs<ExtArgs>
    source?: boolean | Artifact$sourceArgs<ExtArgs>
  }

  export type $ArtifactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Artifact"
    objects: {
      exam: Prisma.$ExamPayload<ExtArgs> | null
      source: Prisma.$SourcePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      examId: string | null
      sourceId: string | null
      kind: $Enums.ArtifactKind
      url: string | null
      storageKey: string | null
      checksum: string | null
      contentType: string | null
      byteSize: number | null
      fetchedAt: Date
      published: boolean
    }, ExtArgs["result"]["artifact"]>
    composites: {}
  }

  type ArtifactGetPayload<S extends boolean | null | undefined | ArtifactDefaultArgs> = $Result.GetResult<Prisma.$ArtifactPayload, S>

  type ArtifactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ArtifactFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ArtifactCountAggregateInputType | true
    }

  export interface ArtifactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Artifact'], meta: { name: 'Artifact' } }
    /**
     * Find zero or one Artifact that matches the filter.
     * @param {ArtifactFindUniqueArgs} args - Arguments to find a Artifact
     * @example
     * // Get one Artifact
     * const artifact = await prisma.artifact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ArtifactFindUniqueArgs>(args: SelectSubset<T, ArtifactFindUniqueArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Artifact that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ArtifactFindUniqueOrThrowArgs} args - Arguments to find a Artifact
     * @example
     * // Get one Artifact
     * const artifact = await prisma.artifact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ArtifactFindUniqueOrThrowArgs>(args: SelectSubset<T, ArtifactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artifact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactFindFirstArgs} args - Arguments to find a Artifact
     * @example
     * // Get one Artifact
     * const artifact = await prisma.artifact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ArtifactFindFirstArgs>(args?: SelectSubset<T, ArtifactFindFirstArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artifact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactFindFirstOrThrowArgs} args - Arguments to find a Artifact
     * @example
     * // Get one Artifact
     * const artifact = await prisma.artifact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ArtifactFindFirstOrThrowArgs>(args?: SelectSubset<T, ArtifactFindFirstOrThrowArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Artifacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Artifacts
     * const artifacts = await prisma.artifact.findMany()
     * 
     * // Get first 10 Artifacts
     * const artifacts = await prisma.artifact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const artifactWithIdOnly = await prisma.artifact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ArtifactFindManyArgs>(args?: SelectSubset<T, ArtifactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Artifact.
     * @param {ArtifactCreateArgs} args - Arguments to create a Artifact.
     * @example
     * // Create one Artifact
     * const Artifact = await prisma.artifact.create({
     *   data: {
     *     // ... data to create a Artifact
     *   }
     * })
     * 
     */
    create<T extends ArtifactCreateArgs>(args: SelectSubset<T, ArtifactCreateArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Artifacts.
     * @param {ArtifactCreateManyArgs} args - Arguments to create many Artifacts.
     * @example
     * // Create many Artifacts
     * const artifact = await prisma.artifact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ArtifactCreateManyArgs>(args?: SelectSubset<T, ArtifactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Artifacts and returns the data saved in the database.
     * @param {ArtifactCreateManyAndReturnArgs} args - Arguments to create many Artifacts.
     * @example
     * // Create many Artifacts
     * const artifact = await prisma.artifact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Artifacts and only return the `id`
     * const artifactWithIdOnly = await prisma.artifact.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ArtifactCreateManyAndReturnArgs>(args?: SelectSubset<T, ArtifactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Artifact.
     * @param {ArtifactDeleteArgs} args - Arguments to delete one Artifact.
     * @example
     * // Delete one Artifact
     * const Artifact = await prisma.artifact.delete({
     *   where: {
     *     // ... filter to delete one Artifact
     *   }
     * })
     * 
     */
    delete<T extends ArtifactDeleteArgs>(args: SelectSubset<T, ArtifactDeleteArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Artifact.
     * @param {ArtifactUpdateArgs} args - Arguments to update one Artifact.
     * @example
     * // Update one Artifact
     * const artifact = await prisma.artifact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ArtifactUpdateArgs>(args: SelectSubset<T, ArtifactUpdateArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Artifacts.
     * @param {ArtifactDeleteManyArgs} args - Arguments to filter Artifacts to delete.
     * @example
     * // Delete a few Artifacts
     * const { count } = await prisma.artifact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ArtifactDeleteManyArgs>(args?: SelectSubset<T, ArtifactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artifacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Artifacts
     * const artifact = await prisma.artifact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ArtifactUpdateManyArgs>(args: SelectSubset<T, ArtifactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artifacts and returns the data updated in the database.
     * @param {ArtifactUpdateManyAndReturnArgs} args - Arguments to update many Artifacts.
     * @example
     * // Update many Artifacts
     * const artifact = await prisma.artifact.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Artifacts and only return the `id`
     * const artifactWithIdOnly = await prisma.artifact.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ArtifactUpdateManyAndReturnArgs>(args: SelectSubset<T, ArtifactUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Artifact.
     * @param {ArtifactUpsertArgs} args - Arguments to update or create a Artifact.
     * @example
     * // Update or create a Artifact
     * const artifact = await prisma.artifact.upsert({
     *   create: {
     *     // ... data to create a Artifact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Artifact we want to update
     *   }
     * })
     */
    upsert<T extends ArtifactUpsertArgs>(args: SelectSubset<T, ArtifactUpsertArgs<ExtArgs>>): Prisma__ArtifactClient<$Result.GetResult<Prisma.$ArtifactPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Artifacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactCountArgs} args - Arguments to filter Artifacts to count.
     * @example
     * // Count the number of Artifacts
     * const count = await prisma.artifact.count({
     *   where: {
     *     // ... the filter for the Artifacts we want to count
     *   }
     * })
    **/
    count<T extends ArtifactCountArgs>(
      args?: Subset<T, ArtifactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ArtifactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Artifact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ArtifactAggregateArgs>(args: Subset<T, ArtifactAggregateArgs>): Prisma.PrismaPromise<GetArtifactAggregateType<T>>

    /**
     * Group by Artifact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtifactGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ArtifactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ArtifactGroupByArgs['orderBy'] }
        : { orderBy?: ArtifactGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ArtifactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetArtifactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Artifact model
   */
  readonly fields: ArtifactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Artifact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ArtifactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    exam<T extends Artifact$examArgs<ExtArgs> = {}>(args?: Subset<T, Artifact$examArgs<ExtArgs>>): Prisma__ExamClient<$Result.GetResult<Prisma.$ExamPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    source<T extends Artifact$sourceArgs<ExtArgs> = {}>(args?: Subset<T, Artifact$sourceArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Artifact model
   */
  interface ArtifactFieldRefs {
    readonly id: FieldRef<"Artifact", 'String'>
    readonly examId: FieldRef<"Artifact", 'String'>
    readonly sourceId: FieldRef<"Artifact", 'String'>
    readonly kind: FieldRef<"Artifact", 'ArtifactKind'>
    readonly url: FieldRef<"Artifact", 'String'>
    readonly storageKey: FieldRef<"Artifact", 'String'>
    readonly checksum: FieldRef<"Artifact", 'String'>
    readonly contentType: FieldRef<"Artifact", 'String'>
    readonly byteSize: FieldRef<"Artifact", 'Int'>
    readonly fetchedAt: FieldRef<"Artifact", 'DateTime'>
    readonly published: FieldRef<"Artifact", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Artifact findUnique
   */
  export type ArtifactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter, which Artifact to fetch.
     */
    where: ArtifactWhereUniqueInput
  }

  /**
   * Artifact findUniqueOrThrow
   */
  export type ArtifactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter, which Artifact to fetch.
     */
    where: ArtifactWhereUniqueInput
  }

  /**
   * Artifact findFirst
   */
  export type ArtifactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter, which Artifact to fetch.
     */
    where?: ArtifactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artifacts to fetch.
     */
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artifacts.
     */
    cursor?: ArtifactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artifacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artifacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artifacts.
     */
    distinct?: ArtifactScalarFieldEnum | ArtifactScalarFieldEnum[]
  }

  /**
   * Artifact findFirstOrThrow
   */
  export type ArtifactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter, which Artifact to fetch.
     */
    where?: ArtifactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artifacts to fetch.
     */
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artifacts.
     */
    cursor?: ArtifactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artifacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artifacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artifacts.
     */
    distinct?: ArtifactScalarFieldEnum | ArtifactScalarFieldEnum[]
  }

  /**
   * Artifact findMany
   */
  export type ArtifactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter, which Artifacts to fetch.
     */
    where?: ArtifactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artifacts to fetch.
     */
    orderBy?: ArtifactOrderByWithRelationInput | ArtifactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Artifacts.
     */
    cursor?: ArtifactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artifacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artifacts.
     */
    skip?: number
    distinct?: ArtifactScalarFieldEnum | ArtifactScalarFieldEnum[]
  }

  /**
   * Artifact create
   */
  export type ArtifactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * The data needed to create a Artifact.
     */
    data: XOR<ArtifactCreateInput, ArtifactUncheckedCreateInput>
  }

  /**
   * Artifact createMany
   */
  export type ArtifactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Artifacts.
     */
    data: ArtifactCreateManyInput | ArtifactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artifact createManyAndReturn
   */
  export type ArtifactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * The data used to create many Artifacts.
     */
    data: ArtifactCreateManyInput | ArtifactCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Artifact update
   */
  export type ArtifactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * The data needed to update a Artifact.
     */
    data: XOR<ArtifactUpdateInput, ArtifactUncheckedUpdateInput>
    /**
     * Choose, which Artifact to update.
     */
    where: ArtifactWhereUniqueInput
  }

  /**
   * Artifact updateMany
   */
  export type ArtifactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Artifacts.
     */
    data: XOR<ArtifactUpdateManyMutationInput, ArtifactUncheckedUpdateManyInput>
    /**
     * Filter which Artifacts to update
     */
    where?: ArtifactWhereInput
    /**
     * Limit how many Artifacts to update.
     */
    limit?: number
  }

  /**
   * Artifact updateManyAndReturn
   */
  export type ArtifactUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * The data used to update Artifacts.
     */
    data: XOR<ArtifactUpdateManyMutationInput, ArtifactUncheckedUpdateManyInput>
    /**
     * Filter which Artifacts to update
     */
    where?: ArtifactWhereInput
    /**
     * Limit how many Artifacts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Artifact upsert
   */
  export type ArtifactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * The filter to search for the Artifact to update in case it exists.
     */
    where: ArtifactWhereUniqueInput
    /**
     * In case the Artifact found by the `where` argument doesn't exist, create a new Artifact with this data.
     */
    create: XOR<ArtifactCreateInput, ArtifactUncheckedCreateInput>
    /**
     * In case the Artifact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ArtifactUpdateInput, ArtifactUncheckedUpdateInput>
  }

  /**
   * Artifact delete
   */
  export type ArtifactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
    /**
     * Filter which Artifact to delete.
     */
    where: ArtifactWhereUniqueInput
  }

  /**
   * Artifact deleteMany
   */
  export type ArtifactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artifacts to delete
     */
    where?: ArtifactWhereInput
    /**
     * Limit how many Artifacts to delete.
     */
    limit?: number
  }

  /**
   * Artifact.exam
   */
  export type Artifact$examArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exam
     */
    select?: ExamSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exam
     */
    omit?: ExamOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ExamInclude<ExtArgs> | null
    where?: ExamWhereInput
  }

  /**
   * Artifact.source
   */
  export type Artifact$sourceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    where?: SourceWhereInput
  }

  /**
   * Artifact without action
   */
  export type ArtifactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artifact
     */
    select?: ArtifactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artifact
     */
    omit?: ArtifactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtifactInclude<ExtArgs> | null
  }


  /**
   * Model ListingFingerprint
   */

  export type AggregateListingFingerprint = {
    _count: ListingFingerprintCountAggregateOutputType | null
    _avg: ListingFingerprintAvgAggregateOutputType | null
    _sum: ListingFingerprintSumAggregateOutputType | null
    _min: ListingFingerprintMinAggregateOutputType | null
    _max: ListingFingerprintMaxAggregateOutputType | null
  }

  export type ListingFingerprintAvgAggregateOutputType = {
    listingCount: number | null
  }

  export type ListingFingerprintSumAggregateOutputType = {
    listingCount: number | null
  }

  export type ListingFingerprintMinAggregateOutputType = {
    id: string | null
    sourceId: string | null
    startUrl: string | null
    fingerprint: string | null
    listingCount: number | null
    seenAt: Date | null
  }

  export type ListingFingerprintMaxAggregateOutputType = {
    id: string | null
    sourceId: string | null
    startUrl: string | null
    fingerprint: string | null
    listingCount: number | null
    seenAt: Date | null
  }

  export type ListingFingerprintCountAggregateOutputType = {
    id: number
    sourceId: number
    startUrl: number
    fingerprint: number
    listingCount: number
    seenAt: number
    _all: number
  }


  export type ListingFingerprintAvgAggregateInputType = {
    listingCount?: true
  }

  export type ListingFingerprintSumAggregateInputType = {
    listingCount?: true
  }

  export type ListingFingerprintMinAggregateInputType = {
    id?: true
    sourceId?: true
    startUrl?: true
    fingerprint?: true
    listingCount?: true
    seenAt?: true
  }

  export type ListingFingerprintMaxAggregateInputType = {
    id?: true
    sourceId?: true
    startUrl?: true
    fingerprint?: true
    listingCount?: true
    seenAt?: true
  }

  export type ListingFingerprintCountAggregateInputType = {
    id?: true
    sourceId?: true
    startUrl?: true
    fingerprint?: true
    listingCount?: true
    seenAt?: true
    _all?: true
  }

  export type ListingFingerprintAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ListingFingerprint to aggregate.
     */
    where?: ListingFingerprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingFingerprints to fetch.
     */
    orderBy?: ListingFingerprintOrderByWithRelationInput | ListingFingerprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ListingFingerprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingFingerprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingFingerprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ListingFingerprints
    **/
    _count?: true | ListingFingerprintCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ListingFingerprintAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ListingFingerprintSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ListingFingerprintMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ListingFingerprintMaxAggregateInputType
  }

  export type GetListingFingerprintAggregateType<T extends ListingFingerprintAggregateArgs> = {
        [P in keyof T & keyof AggregateListingFingerprint]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListingFingerprint[P]>
      : GetScalarType<T[P], AggregateListingFingerprint[P]>
  }




  export type ListingFingerprintGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ListingFingerprintWhereInput
    orderBy?: ListingFingerprintOrderByWithAggregationInput | ListingFingerprintOrderByWithAggregationInput[]
    by: ListingFingerprintScalarFieldEnum[] | ListingFingerprintScalarFieldEnum
    having?: ListingFingerprintScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListingFingerprintCountAggregateInputType | true
    _avg?: ListingFingerprintAvgAggregateInputType
    _sum?: ListingFingerprintSumAggregateInputType
    _min?: ListingFingerprintMinAggregateInputType
    _max?: ListingFingerprintMaxAggregateInputType
  }

  export type ListingFingerprintGroupByOutputType = {
    id: string
    sourceId: string
    startUrl: string
    fingerprint: string
    listingCount: number
    seenAt: Date
    _count: ListingFingerprintCountAggregateOutputType | null
    _avg: ListingFingerprintAvgAggregateOutputType | null
    _sum: ListingFingerprintSumAggregateOutputType | null
    _min: ListingFingerprintMinAggregateOutputType | null
    _max: ListingFingerprintMaxAggregateOutputType | null
  }

  type GetListingFingerprintGroupByPayload<T extends ListingFingerprintGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ListingFingerprintGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ListingFingerprintGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListingFingerprintGroupByOutputType[P]>
            : GetScalarType<T[P], ListingFingerprintGroupByOutputType[P]>
        }
      >
    >


  export type ListingFingerprintSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startUrl?: boolean
    fingerprint?: boolean
    listingCount?: boolean
    seenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingFingerprint"]>

  export type ListingFingerprintSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startUrl?: boolean
    fingerprint?: boolean
    listingCount?: boolean
    seenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingFingerprint"]>

  export type ListingFingerprintSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startUrl?: boolean
    fingerprint?: boolean
    listingCount?: boolean
    seenAt?: boolean
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingFingerprint"]>

  export type ListingFingerprintSelectScalar = {
    id?: boolean
    sourceId?: boolean
    startUrl?: boolean
    fingerprint?: boolean
    listingCount?: boolean
    seenAt?: boolean
  }

  export type ListingFingerprintOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sourceId" | "startUrl" | "fingerprint" | "listingCount" | "seenAt", ExtArgs["result"]["listingFingerprint"]>
  export type ListingFingerprintInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }
  export type ListingFingerprintIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }
  export type ListingFingerprintIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | SourceDefaultArgs<ExtArgs>
  }

  export type $ListingFingerprintPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ListingFingerprint"
    objects: {
      source: Prisma.$SourcePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sourceId: string
      startUrl: string
      fingerprint: string
      listingCount: number
      seenAt: Date
    }, ExtArgs["result"]["listingFingerprint"]>
    composites: {}
  }

  type ListingFingerprintGetPayload<S extends boolean | null | undefined | ListingFingerprintDefaultArgs> = $Result.GetResult<Prisma.$ListingFingerprintPayload, S>

  type ListingFingerprintCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ListingFingerprintFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ListingFingerprintCountAggregateInputType | true
    }

  export interface ListingFingerprintDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ListingFingerprint'], meta: { name: 'ListingFingerprint' } }
    /**
     * Find zero or one ListingFingerprint that matches the filter.
     * @param {ListingFingerprintFindUniqueArgs} args - Arguments to find a ListingFingerprint
     * @example
     * // Get one ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingFingerprintFindUniqueArgs>(args: SelectSubset<T, ListingFingerprintFindUniqueArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ListingFingerprint that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingFingerprintFindUniqueOrThrowArgs} args - Arguments to find a ListingFingerprint
     * @example
     * // Get one ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingFingerprintFindUniqueOrThrowArgs>(args: SelectSubset<T, ListingFingerprintFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ListingFingerprint that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintFindFirstArgs} args - Arguments to find a ListingFingerprint
     * @example
     * // Get one ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingFingerprintFindFirstArgs>(args?: SelectSubset<T, ListingFingerprintFindFirstArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ListingFingerprint that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintFindFirstOrThrowArgs} args - Arguments to find a ListingFingerprint
     * @example
     * // Get one ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingFingerprintFindFirstOrThrowArgs>(args?: SelectSubset<T, ListingFingerprintFindFirstOrThrowArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ListingFingerprints that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ListingFingerprints
     * const listingFingerprints = await prisma.listingFingerprint.findMany()
     * 
     * // Get first 10 ListingFingerprints
     * const listingFingerprints = await prisma.listingFingerprint.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const listingFingerprintWithIdOnly = await prisma.listingFingerprint.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ListingFingerprintFindManyArgs>(args?: SelectSubset<T, ListingFingerprintFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ListingFingerprint.
     * @param {ListingFingerprintCreateArgs} args - Arguments to create a ListingFingerprint.
     * @example
     * // Create one ListingFingerprint
     * const ListingFingerprint = await prisma.listingFingerprint.create({
     *   data: {
     *     // ... data to create a ListingFingerprint
     *   }
     * })
     * 
     */
    create<T extends ListingFingerprintCreateArgs>(args: SelectSubset<T, ListingFingerprintCreateArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ListingFingerprints.
     * @param {ListingFingerprintCreateManyArgs} args - Arguments to create many ListingFingerprints.
     * @example
     * // Create many ListingFingerprints
     * const listingFingerprint = await prisma.listingFingerprint.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ListingFingerprintCreateManyArgs>(args?: SelectSubset<T, ListingFingerprintCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ListingFingerprints and returns the data saved in the database.
     * @param {ListingFingerprintCreateManyAndReturnArgs} args - Arguments to create many ListingFingerprints.
     * @example
     * // Create many ListingFingerprints
     * const listingFingerprint = await prisma.listingFingerprint.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ListingFingerprints and only return the `id`
     * const listingFingerprintWithIdOnly = await prisma.listingFingerprint.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ListingFingerprintCreateManyAndReturnArgs>(args?: SelectSubset<T, ListingFingerprintCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ListingFingerprint.
     * @param {ListingFingerprintDeleteArgs} args - Arguments to delete one ListingFingerprint.
     * @example
     * // Delete one ListingFingerprint
     * const ListingFingerprint = await prisma.listingFingerprint.delete({
     *   where: {
     *     // ... filter to delete one ListingFingerprint
     *   }
     * })
     * 
     */
    delete<T extends ListingFingerprintDeleteArgs>(args: SelectSubset<T, ListingFingerprintDeleteArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ListingFingerprint.
     * @param {ListingFingerprintUpdateArgs} args - Arguments to update one ListingFingerprint.
     * @example
     * // Update one ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ListingFingerprintUpdateArgs>(args: SelectSubset<T, ListingFingerprintUpdateArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ListingFingerprints.
     * @param {ListingFingerprintDeleteManyArgs} args - Arguments to filter ListingFingerprints to delete.
     * @example
     * // Delete a few ListingFingerprints
     * const { count } = await prisma.listingFingerprint.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ListingFingerprintDeleteManyArgs>(args?: SelectSubset<T, ListingFingerprintDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingFingerprints.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ListingFingerprints
     * const listingFingerprint = await prisma.listingFingerprint.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ListingFingerprintUpdateManyArgs>(args: SelectSubset<T, ListingFingerprintUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingFingerprints and returns the data updated in the database.
     * @param {ListingFingerprintUpdateManyAndReturnArgs} args - Arguments to update many ListingFingerprints.
     * @example
     * // Update many ListingFingerprints
     * const listingFingerprint = await prisma.listingFingerprint.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ListingFingerprints and only return the `id`
     * const listingFingerprintWithIdOnly = await prisma.listingFingerprint.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ListingFingerprintUpdateManyAndReturnArgs>(args: SelectSubset<T, ListingFingerprintUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ListingFingerprint.
     * @param {ListingFingerprintUpsertArgs} args - Arguments to update or create a ListingFingerprint.
     * @example
     * // Update or create a ListingFingerprint
     * const listingFingerprint = await prisma.listingFingerprint.upsert({
     *   create: {
     *     // ... data to create a ListingFingerprint
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ListingFingerprint we want to update
     *   }
     * })
     */
    upsert<T extends ListingFingerprintUpsertArgs>(args: SelectSubset<T, ListingFingerprintUpsertArgs<ExtArgs>>): Prisma__ListingFingerprintClient<$Result.GetResult<Prisma.$ListingFingerprintPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ListingFingerprints.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintCountArgs} args - Arguments to filter ListingFingerprints to count.
     * @example
     * // Count the number of ListingFingerprints
     * const count = await prisma.listingFingerprint.count({
     *   where: {
     *     // ... the filter for the ListingFingerprints we want to count
     *   }
     * })
    **/
    count<T extends ListingFingerprintCountArgs>(
      args?: Subset<T, ListingFingerprintCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListingFingerprintCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ListingFingerprint.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ListingFingerprintAggregateArgs>(args: Subset<T, ListingFingerprintAggregateArgs>): Prisma.PrismaPromise<GetListingFingerprintAggregateType<T>>

    /**
     * Group by ListingFingerprint.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFingerprintGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ListingFingerprintGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListingFingerprintGroupByArgs['orderBy'] }
        : { orderBy?: ListingFingerprintGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ListingFingerprintGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListingFingerprintGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ListingFingerprint model
   */
  readonly fields: ListingFingerprintFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ListingFingerprint.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ListingFingerprintClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    source<T extends SourceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SourceDefaultArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ListingFingerprint model
   */
  interface ListingFingerprintFieldRefs {
    readonly id: FieldRef<"ListingFingerprint", 'String'>
    readonly sourceId: FieldRef<"ListingFingerprint", 'String'>
    readonly startUrl: FieldRef<"ListingFingerprint", 'String'>
    readonly fingerprint: FieldRef<"ListingFingerprint", 'String'>
    readonly listingCount: FieldRef<"ListingFingerprint", 'Int'>
    readonly seenAt: FieldRef<"ListingFingerprint", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ListingFingerprint findUnique
   */
  export type ListingFingerprintFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter, which ListingFingerprint to fetch.
     */
    where: ListingFingerprintWhereUniqueInput
  }

  /**
   * ListingFingerprint findUniqueOrThrow
   */
  export type ListingFingerprintFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter, which ListingFingerprint to fetch.
     */
    where: ListingFingerprintWhereUniqueInput
  }

  /**
   * ListingFingerprint findFirst
   */
  export type ListingFingerprintFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter, which ListingFingerprint to fetch.
     */
    where?: ListingFingerprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingFingerprints to fetch.
     */
    orderBy?: ListingFingerprintOrderByWithRelationInput | ListingFingerprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListingFingerprints.
     */
    cursor?: ListingFingerprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingFingerprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingFingerprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListingFingerprints.
     */
    distinct?: ListingFingerprintScalarFieldEnum | ListingFingerprintScalarFieldEnum[]
  }

  /**
   * ListingFingerprint findFirstOrThrow
   */
  export type ListingFingerprintFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter, which ListingFingerprint to fetch.
     */
    where?: ListingFingerprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingFingerprints to fetch.
     */
    orderBy?: ListingFingerprintOrderByWithRelationInput | ListingFingerprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListingFingerprints.
     */
    cursor?: ListingFingerprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingFingerprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingFingerprints.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListingFingerprints.
     */
    distinct?: ListingFingerprintScalarFieldEnum | ListingFingerprintScalarFieldEnum[]
  }

  /**
   * ListingFingerprint findMany
   */
  export type ListingFingerprintFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter, which ListingFingerprints to fetch.
     */
    where?: ListingFingerprintWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingFingerprints to fetch.
     */
    orderBy?: ListingFingerprintOrderByWithRelationInput | ListingFingerprintOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ListingFingerprints.
     */
    cursor?: ListingFingerprintWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingFingerprints from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingFingerprints.
     */
    skip?: number
    distinct?: ListingFingerprintScalarFieldEnum | ListingFingerprintScalarFieldEnum[]
  }

  /**
   * ListingFingerprint create
   */
  export type ListingFingerprintCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * The data needed to create a ListingFingerprint.
     */
    data: XOR<ListingFingerprintCreateInput, ListingFingerprintUncheckedCreateInput>
  }

  /**
   * ListingFingerprint createMany
   */
  export type ListingFingerprintCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ListingFingerprints.
     */
    data: ListingFingerprintCreateManyInput | ListingFingerprintCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ListingFingerprint createManyAndReturn
   */
  export type ListingFingerprintCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * The data used to create many ListingFingerprints.
     */
    data: ListingFingerprintCreateManyInput | ListingFingerprintCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingFingerprint update
   */
  export type ListingFingerprintUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * The data needed to update a ListingFingerprint.
     */
    data: XOR<ListingFingerprintUpdateInput, ListingFingerprintUncheckedUpdateInput>
    /**
     * Choose, which ListingFingerprint to update.
     */
    where: ListingFingerprintWhereUniqueInput
  }

  /**
   * ListingFingerprint updateMany
   */
  export type ListingFingerprintUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ListingFingerprints.
     */
    data: XOR<ListingFingerprintUpdateManyMutationInput, ListingFingerprintUncheckedUpdateManyInput>
    /**
     * Filter which ListingFingerprints to update
     */
    where?: ListingFingerprintWhereInput
    /**
     * Limit how many ListingFingerprints to update.
     */
    limit?: number
  }

  /**
   * ListingFingerprint updateManyAndReturn
   */
  export type ListingFingerprintUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * The data used to update ListingFingerprints.
     */
    data: XOR<ListingFingerprintUpdateManyMutationInput, ListingFingerprintUncheckedUpdateManyInput>
    /**
     * Filter which ListingFingerprints to update
     */
    where?: ListingFingerprintWhereInput
    /**
     * Limit how many ListingFingerprints to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingFingerprint upsert
   */
  export type ListingFingerprintUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * The filter to search for the ListingFingerprint to update in case it exists.
     */
    where: ListingFingerprintWhereUniqueInput
    /**
     * In case the ListingFingerprint found by the `where` argument doesn't exist, create a new ListingFingerprint with this data.
     */
    create: XOR<ListingFingerprintCreateInput, ListingFingerprintUncheckedCreateInput>
    /**
     * In case the ListingFingerprint was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListingFingerprintUpdateInput, ListingFingerprintUncheckedUpdateInput>
  }

  /**
   * ListingFingerprint delete
   */
  export type ListingFingerprintDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
    /**
     * Filter which ListingFingerprint to delete.
     */
    where: ListingFingerprintWhereUniqueInput
  }

  /**
   * ListingFingerprint deleteMany
   */
  export type ListingFingerprintDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ListingFingerprints to delete
     */
    where?: ListingFingerprintWhereInput
    /**
     * Limit how many ListingFingerprints to delete.
     */
    limit?: number
  }

  /**
   * ListingFingerprint without action
   */
  export type ListingFingerprintDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingFingerprint
     */
    select?: ListingFingerprintSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingFingerprint
     */
    omit?: ListingFingerprintOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingFingerprintInclude<ExtArgs> | null
  }


  /**
   * Model ControlFlag
   */

  export type AggregateControlFlag = {
    _count: ControlFlagCountAggregateOutputType | null
    _min: ControlFlagMinAggregateOutputType | null
    _max: ControlFlagMaxAggregateOutputType | null
  }

  export type ControlFlagMinAggregateOutputType = {
    id: string | null
    updatedAt: Date | null
  }

  export type ControlFlagMaxAggregateOutputType = {
    id: string | null
    updatedAt: Date | null
  }

  export type ControlFlagCountAggregateOutputType = {
    id: number
    value: number
    updatedAt: number
    _all: number
  }


  export type ControlFlagMinAggregateInputType = {
    id?: true
    updatedAt?: true
  }

  export type ControlFlagMaxAggregateInputType = {
    id?: true
    updatedAt?: true
  }

  export type ControlFlagCountAggregateInputType = {
    id?: true
    value?: true
    updatedAt?: true
    _all?: true
  }

  export type ControlFlagAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ControlFlag to aggregate.
     */
    where?: ControlFlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ControlFlags to fetch.
     */
    orderBy?: ControlFlagOrderByWithRelationInput | ControlFlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ControlFlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ControlFlags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ControlFlags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ControlFlags
    **/
    _count?: true | ControlFlagCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ControlFlagMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ControlFlagMaxAggregateInputType
  }

  export type GetControlFlagAggregateType<T extends ControlFlagAggregateArgs> = {
        [P in keyof T & keyof AggregateControlFlag]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateControlFlag[P]>
      : GetScalarType<T[P], AggregateControlFlag[P]>
  }




  export type ControlFlagGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ControlFlagWhereInput
    orderBy?: ControlFlagOrderByWithAggregationInput | ControlFlagOrderByWithAggregationInput[]
    by: ControlFlagScalarFieldEnum[] | ControlFlagScalarFieldEnum
    having?: ControlFlagScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ControlFlagCountAggregateInputType | true
    _min?: ControlFlagMinAggregateInputType
    _max?: ControlFlagMaxAggregateInputType
  }

  export type ControlFlagGroupByOutputType = {
    id: string
    value: JsonValue
    updatedAt: Date
    _count: ControlFlagCountAggregateOutputType | null
    _min: ControlFlagMinAggregateOutputType | null
    _max: ControlFlagMaxAggregateOutputType | null
  }

  type GetControlFlagGroupByPayload<T extends ControlFlagGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ControlFlagGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ControlFlagGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ControlFlagGroupByOutputType[P]>
            : GetScalarType<T[P], ControlFlagGroupByOutputType[P]>
        }
      >
    >


  export type ControlFlagSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["controlFlag"]>

  export type ControlFlagSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["controlFlag"]>

  export type ControlFlagSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["controlFlag"]>

  export type ControlFlagSelectScalar = {
    id?: boolean
    value?: boolean
    updatedAt?: boolean
  }

  export type ControlFlagOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "value" | "updatedAt", ExtArgs["result"]["controlFlag"]>

  export type $ControlFlagPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ControlFlag"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      value: Prisma.JsonValue
      updatedAt: Date
    }, ExtArgs["result"]["controlFlag"]>
    composites: {}
  }

  type ControlFlagGetPayload<S extends boolean | null | undefined | ControlFlagDefaultArgs> = $Result.GetResult<Prisma.$ControlFlagPayload, S>

  type ControlFlagCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ControlFlagFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ControlFlagCountAggregateInputType | true
    }

  export interface ControlFlagDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ControlFlag'], meta: { name: 'ControlFlag' } }
    /**
     * Find zero or one ControlFlag that matches the filter.
     * @param {ControlFlagFindUniqueArgs} args - Arguments to find a ControlFlag
     * @example
     * // Get one ControlFlag
     * const controlFlag = await prisma.controlFlag.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ControlFlagFindUniqueArgs>(args: SelectSubset<T, ControlFlagFindUniqueArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ControlFlag that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ControlFlagFindUniqueOrThrowArgs} args - Arguments to find a ControlFlag
     * @example
     * // Get one ControlFlag
     * const controlFlag = await prisma.controlFlag.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ControlFlagFindUniqueOrThrowArgs>(args: SelectSubset<T, ControlFlagFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ControlFlag that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagFindFirstArgs} args - Arguments to find a ControlFlag
     * @example
     * // Get one ControlFlag
     * const controlFlag = await prisma.controlFlag.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ControlFlagFindFirstArgs>(args?: SelectSubset<T, ControlFlagFindFirstArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ControlFlag that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagFindFirstOrThrowArgs} args - Arguments to find a ControlFlag
     * @example
     * // Get one ControlFlag
     * const controlFlag = await prisma.controlFlag.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ControlFlagFindFirstOrThrowArgs>(args?: SelectSubset<T, ControlFlagFindFirstOrThrowArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ControlFlags that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ControlFlags
     * const controlFlags = await prisma.controlFlag.findMany()
     * 
     * // Get first 10 ControlFlags
     * const controlFlags = await prisma.controlFlag.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const controlFlagWithIdOnly = await prisma.controlFlag.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ControlFlagFindManyArgs>(args?: SelectSubset<T, ControlFlagFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ControlFlag.
     * @param {ControlFlagCreateArgs} args - Arguments to create a ControlFlag.
     * @example
     * // Create one ControlFlag
     * const ControlFlag = await prisma.controlFlag.create({
     *   data: {
     *     // ... data to create a ControlFlag
     *   }
     * })
     * 
     */
    create<T extends ControlFlagCreateArgs>(args: SelectSubset<T, ControlFlagCreateArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ControlFlags.
     * @param {ControlFlagCreateManyArgs} args - Arguments to create many ControlFlags.
     * @example
     * // Create many ControlFlags
     * const controlFlag = await prisma.controlFlag.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ControlFlagCreateManyArgs>(args?: SelectSubset<T, ControlFlagCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ControlFlags and returns the data saved in the database.
     * @param {ControlFlagCreateManyAndReturnArgs} args - Arguments to create many ControlFlags.
     * @example
     * // Create many ControlFlags
     * const controlFlag = await prisma.controlFlag.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ControlFlags and only return the `id`
     * const controlFlagWithIdOnly = await prisma.controlFlag.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ControlFlagCreateManyAndReturnArgs>(args?: SelectSubset<T, ControlFlagCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ControlFlag.
     * @param {ControlFlagDeleteArgs} args - Arguments to delete one ControlFlag.
     * @example
     * // Delete one ControlFlag
     * const ControlFlag = await prisma.controlFlag.delete({
     *   where: {
     *     // ... filter to delete one ControlFlag
     *   }
     * })
     * 
     */
    delete<T extends ControlFlagDeleteArgs>(args: SelectSubset<T, ControlFlagDeleteArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ControlFlag.
     * @param {ControlFlagUpdateArgs} args - Arguments to update one ControlFlag.
     * @example
     * // Update one ControlFlag
     * const controlFlag = await prisma.controlFlag.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ControlFlagUpdateArgs>(args: SelectSubset<T, ControlFlagUpdateArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ControlFlags.
     * @param {ControlFlagDeleteManyArgs} args - Arguments to filter ControlFlags to delete.
     * @example
     * // Delete a few ControlFlags
     * const { count } = await prisma.controlFlag.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ControlFlagDeleteManyArgs>(args?: SelectSubset<T, ControlFlagDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ControlFlags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ControlFlags
     * const controlFlag = await prisma.controlFlag.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ControlFlagUpdateManyArgs>(args: SelectSubset<T, ControlFlagUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ControlFlags and returns the data updated in the database.
     * @param {ControlFlagUpdateManyAndReturnArgs} args - Arguments to update many ControlFlags.
     * @example
     * // Update many ControlFlags
     * const controlFlag = await prisma.controlFlag.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ControlFlags and only return the `id`
     * const controlFlagWithIdOnly = await prisma.controlFlag.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ControlFlagUpdateManyAndReturnArgs>(args: SelectSubset<T, ControlFlagUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ControlFlag.
     * @param {ControlFlagUpsertArgs} args - Arguments to update or create a ControlFlag.
     * @example
     * // Update or create a ControlFlag
     * const controlFlag = await prisma.controlFlag.upsert({
     *   create: {
     *     // ... data to create a ControlFlag
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ControlFlag we want to update
     *   }
     * })
     */
    upsert<T extends ControlFlagUpsertArgs>(args: SelectSubset<T, ControlFlagUpsertArgs<ExtArgs>>): Prisma__ControlFlagClient<$Result.GetResult<Prisma.$ControlFlagPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ControlFlags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagCountArgs} args - Arguments to filter ControlFlags to count.
     * @example
     * // Count the number of ControlFlags
     * const count = await prisma.controlFlag.count({
     *   where: {
     *     // ... the filter for the ControlFlags we want to count
     *   }
     * })
    **/
    count<T extends ControlFlagCountArgs>(
      args?: Subset<T, ControlFlagCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ControlFlagCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ControlFlag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ControlFlagAggregateArgs>(args: Subset<T, ControlFlagAggregateArgs>): Prisma.PrismaPromise<GetControlFlagAggregateType<T>>

    /**
     * Group by ControlFlag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ControlFlagGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ControlFlagGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ControlFlagGroupByArgs['orderBy'] }
        : { orderBy?: ControlFlagGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ControlFlagGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetControlFlagGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ControlFlag model
   */
  readonly fields: ControlFlagFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ControlFlag.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ControlFlagClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ControlFlag model
   */
  interface ControlFlagFieldRefs {
    readonly id: FieldRef<"ControlFlag", 'String'>
    readonly value: FieldRef<"ControlFlag", 'Json'>
    readonly updatedAt: FieldRef<"ControlFlag", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ControlFlag findUnique
   */
  export type ControlFlagFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter, which ControlFlag to fetch.
     */
    where: ControlFlagWhereUniqueInput
  }

  /**
   * ControlFlag findUniqueOrThrow
   */
  export type ControlFlagFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter, which ControlFlag to fetch.
     */
    where: ControlFlagWhereUniqueInput
  }

  /**
   * ControlFlag findFirst
   */
  export type ControlFlagFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter, which ControlFlag to fetch.
     */
    where?: ControlFlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ControlFlags to fetch.
     */
    orderBy?: ControlFlagOrderByWithRelationInput | ControlFlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ControlFlags.
     */
    cursor?: ControlFlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ControlFlags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ControlFlags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ControlFlags.
     */
    distinct?: ControlFlagScalarFieldEnum | ControlFlagScalarFieldEnum[]
  }

  /**
   * ControlFlag findFirstOrThrow
   */
  export type ControlFlagFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter, which ControlFlag to fetch.
     */
    where?: ControlFlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ControlFlags to fetch.
     */
    orderBy?: ControlFlagOrderByWithRelationInput | ControlFlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ControlFlags.
     */
    cursor?: ControlFlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ControlFlags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ControlFlags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ControlFlags.
     */
    distinct?: ControlFlagScalarFieldEnum | ControlFlagScalarFieldEnum[]
  }

  /**
   * ControlFlag findMany
   */
  export type ControlFlagFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter, which ControlFlags to fetch.
     */
    where?: ControlFlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ControlFlags to fetch.
     */
    orderBy?: ControlFlagOrderByWithRelationInput | ControlFlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ControlFlags.
     */
    cursor?: ControlFlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ControlFlags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ControlFlags.
     */
    skip?: number
    distinct?: ControlFlagScalarFieldEnum | ControlFlagScalarFieldEnum[]
  }

  /**
   * ControlFlag create
   */
  export type ControlFlagCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * The data needed to create a ControlFlag.
     */
    data: XOR<ControlFlagCreateInput, ControlFlagUncheckedCreateInput>
  }

  /**
   * ControlFlag createMany
   */
  export type ControlFlagCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ControlFlags.
     */
    data: ControlFlagCreateManyInput | ControlFlagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ControlFlag createManyAndReturn
   */
  export type ControlFlagCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * The data used to create many ControlFlags.
     */
    data: ControlFlagCreateManyInput | ControlFlagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ControlFlag update
   */
  export type ControlFlagUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * The data needed to update a ControlFlag.
     */
    data: XOR<ControlFlagUpdateInput, ControlFlagUncheckedUpdateInput>
    /**
     * Choose, which ControlFlag to update.
     */
    where: ControlFlagWhereUniqueInput
  }

  /**
   * ControlFlag updateMany
   */
  export type ControlFlagUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ControlFlags.
     */
    data: XOR<ControlFlagUpdateManyMutationInput, ControlFlagUncheckedUpdateManyInput>
    /**
     * Filter which ControlFlags to update
     */
    where?: ControlFlagWhereInput
    /**
     * Limit how many ControlFlags to update.
     */
    limit?: number
  }

  /**
   * ControlFlag updateManyAndReturn
   */
  export type ControlFlagUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * The data used to update ControlFlags.
     */
    data: XOR<ControlFlagUpdateManyMutationInput, ControlFlagUncheckedUpdateManyInput>
    /**
     * Filter which ControlFlags to update
     */
    where?: ControlFlagWhereInput
    /**
     * Limit how many ControlFlags to update.
     */
    limit?: number
  }

  /**
   * ControlFlag upsert
   */
  export type ControlFlagUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * The filter to search for the ControlFlag to update in case it exists.
     */
    where: ControlFlagWhereUniqueInput
    /**
     * In case the ControlFlag found by the `where` argument doesn't exist, create a new ControlFlag with this data.
     */
    create: XOR<ControlFlagCreateInput, ControlFlagUncheckedCreateInput>
    /**
     * In case the ControlFlag was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ControlFlagUpdateInput, ControlFlagUncheckedUpdateInput>
  }

  /**
   * ControlFlag delete
   */
  export type ControlFlagDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
    /**
     * Filter which ControlFlag to delete.
     */
    where: ControlFlagWhereUniqueInput
  }

  /**
   * ControlFlag deleteMany
   */
  export type ControlFlagDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ControlFlags to delete
     */
    where?: ControlFlagWhereInput
    /**
     * Limit how many ControlFlags to delete.
     */
    limit?: number
  }

  /**
   * ControlFlag without action
   */
  export type ControlFlagDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ControlFlag
     */
    select?: ControlFlagSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ControlFlag
     */
    omit?: ControlFlagOmit<ExtArgs> | null
  }


  /**
   * Model CrawlRun
   */

  export type AggregateCrawlRun = {
    _count: CrawlRunCountAggregateOutputType | null
    _avg: CrawlRunAvgAggregateOutputType | null
    _sum: CrawlRunSumAggregateOutputType | null
    _min: CrawlRunMinAggregateOutputType | null
    _max: CrawlRunMaxAggregateOutputType | null
  }

  export type CrawlRunAvgAggregateOutputType = {
    sourcesOk: number | null
    sourcesFailed: number | null
    openDiscovered: number | null
    proposedSources: number | null
  }

  export type CrawlRunSumAggregateOutputType = {
    sourcesOk: number | null
    sourcesFailed: number | null
    openDiscovered: number | null
    proposedSources: number | null
  }

  export type CrawlRunMinAggregateOutputType = {
    id: string | null
    sourceId: string | null
    startedAt: Date | null
    finishedAt: Date | null
    status: $Enums.CrawlRunStatus | null
    sourcesOk: number | null
    sourcesFailed: number | null
    openDiscovered: number | null
    proposedSources: number | null
  }

  export type CrawlRunMaxAggregateOutputType = {
    id: string | null
    sourceId: string | null
    startedAt: Date | null
    finishedAt: Date | null
    status: $Enums.CrawlRunStatus | null
    sourcesOk: number | null
    sourcesFailed: number | null
    openDiscovered: number | null
    proposedSources: number | null
  }

  export type CrawlRunCountAggregateOutputType = {
    id: number
    sourceId: number
    startedAt: number
    finishedAt: number
    status: number
    sourcesOk: number
    sourcesFailed: number
    openDiscovered: number
    proposedSources: number
    errors: number
    _all: number
  }


  export type CrawlRunAvgAggregateInputType = {
    sourcesOk?: true
    sourcesFailed?: true
    openDiscovered?: true
    proposedSources?: true
  }

  export type CrawlRunSumAggregateInputType = {
    sourcesOk?: true
    sourcesFailed?: true
    openDiscovered?: true
    proposedSources?: true
  }

  export type CrawlRunMinAggregateInputType = {
    id?: true
    sourceId?: true
    startedAt?: true
    finishedAt?: true
    status?: true
    sourcesOk?: true
    sourcesFailed?: true
    openDiscovered?: true
    proposedSources?: true
  }

  export type CrawlRunMaxAggregateInputType = {
    id?: true
    sourceId?: true
    startedAt?: true
    finishedAt?: true
    status?: true
    sourcesOk?: true
    sourcesFailed?: true
    openDiscovered?: true
    proposedSources?: true
  }

  export type CrawlRunCountAggregateInputType = {
    id?: true
    sourceId?: true
    startedAt?: true
    finishedAt?: true
    status?: true
    sourcesOk?: true
    sourcesFailed?: true
    openDiscovered?: true
    proposedSources?: true
    errors?: true
    _all?: true
  }

  export type CrawlRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrawlRun to aggregate.
     */
    where?: CrawlRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrawlRuns to fetch.
     */
    orderBy?: CrawlRunOrderByWithRelationInput | CrawlRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrawlRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrawlRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrawlRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CrawlRuns
    **/
    _count?: true | CrawlRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CrawlRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CrawlRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrawlRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrawlRunMaxAggregateInputType
  }

  export type GetCrawlRunAggregateType<T extends CrawlRunAggregateArgs> = {
        [P in keyof T & keyof AggregateCrawlRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrawlRun[P]>
      : GetScalarType<T[P], AggregateCrawlRun[P]>
  }




  export type CrawlRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrawlRunWhereInput
    orderBy?: CrawlRunOrderByWithAggregationInput | CrawlRunOrderByWithAggregationInput[]
    by: CrawlRunScalarFieldEnum[] | CrawlRunScalarFieldEnum
    having?: CrawlRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrawlRunCountAggregateInputType | true
    _avg?: CrawlRunAvgAggregateInputType
    _sum?: CrawlRunSumAggregateInputType
    _min?: CrawlRunMinAggregateInputType
    _max?: CrawlRunMaxAggregateInputType
  }

  export type CrawlRunGroupByOutputType = {
    id: string
    sourceId: string | null
    startedAt: Date
    finishedAt: Date | null
    status: $Enums.CrawlRunStatus
    sourcesOk: number
    sourcesFailed: number
    openDiscovered: number
    proposedSources: number
    errors: JsonValue
    _count: CrawlRunCountAggregateOutputType | null
    _avg: CrawlRunAvgAggregateOutputType | null
    _sum: CrawlRunSumAggregateOutputType | null
    _min: CrawlRunMinAggregateOutputType | null
    _max: CrawlRunMaxAggregateOutputType | null
  }

  type GetCrawlRunGroupByPayload<T extends CrawlRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrawlRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrawlRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrawlRunGroupByOutputType[P]>
            : GetScalarType<T[P], CrawlRunGroupByOutputType[P]>
        }
      >
    >


  export type CrawlRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    status?: boolean
    sourcesOk?: boolean
    sourcesFailed?: boolean
    openDiscovered?: boolean
    proposedSources?: boolean
    errors?: boolean
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["crawlRun"]>

  export type CrawlRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    status?: boolean
    sourcesOk?: boolean
    sourcesFailed?: boolean
    openDiscovered?: boolean
    proposedSources?: boolean
    errors?: boolean
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["crawlRun"]>

  export type CrawlRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sourceId?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    status?: boolean
    sourcesOk?: boolean
    sourcesFailed?: boolean
    openDiscovered?: boolean
    proposedSources?: boolean
    errors?: boolean
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }, ExtArgs["result"]["crawlRun"]>

  export type CrawlRunSelectScalar = {
    id?: boolean
    sourceId?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    status?: boolean
    sourcesOk?: boolean
    sourcesFailed?: boolean
    openDiscovered?: boolean
    proposedSources?: boolean
    errors?: boolean
  }

  export type CrawlRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sourceId" | "startedAt" | "finishedAt" | "status" | "sourcesOk" | "sourcesFailed" | "openDiscovered" | "proposedSources" | "errors", ExtArgs["result"]["crawlRun"]>
  export type CrawlRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }
  export type CrawlRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }
  export type CrawlRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    source?: boolean | CrawlRun$sourceArgs<ExtArgs>
  }

  export type $CrawlRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CrawlRun"
    objects: {
      source: Prisma.$SourcePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sourceId: string | null
      startedAt: Date
      finishedAt: Date | null
      status: $Enums.CrawlRunStatus
      sourcesOk: number
      sourcesFailed: number
      openDiscovered: number
      proposedSources: number
      errors: Prisma.JsonValue
    }, ExtArgs["result"]["crawlRun"]>
    composites: {}
  }

  type CrawlRunGetPayload<S extends boolean | null | undefined | CrawlRunDefaultArgs> = $Result.GetResult<Prisma.$CrawlRunPayload, S>

  type CrawlRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CrawlRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CrawlRunCountAggregateInputType | true
    }

  export interface CrawlRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CrawlRun'], meta: { name: 'CrawlRun' } }
    /**
     * Find zero or one CrawlRun that matches the filter.
     * @param {CrawlRunFindUniqueArgs} args - Arguments to find a CrawlRun
     * @example
     * // Get one CrawlRun
     * const crawlRun = await prisma.crawlRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrawlRunFindUniqueArgs>(args: SelectSubset<T, CrawlRunFindUniqueArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CrawlRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CrawlRunFindUniqueOrThrowArgs} args - Arguments to find a CrawlRun
     * @example
     * // Get one CrawlRun
     * const crawlRun = await prisma.crawlRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrawlRunFindUniqueOrThrowArgs>(args: SelectSubset<T, CrawlRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CrawlRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunFindFirstArgs} args - Arguments to find a CrawlRun
     * @example
     * // Get one CrawlRun
     * const crawlRun = await prisma.crawlRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrawlRunFindFirstArgs>(args?: SelectSubset<T, CrawlRunFindFirstArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CrawlRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunFindFirstOrThrowArgs} args - Arguments to find a CrawlRun
     * @example
     * // Get one CrawlRun
     * const crawlRun = await prisma.crawlRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrawlRunFindFirstOrThrowArgs>(args?: SelectSubset<T, CrawlRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CrawlRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CrawlRuns
     * const crawlRuns = await prisma.crawlRun.findMany()
     * 
     * // Get first 10 CrawlRuns
     * const crawlRuns = await prisma.crawlRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crawlRunWithIdOnly = await prisma.crawlRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrawlRunFindManyArgs>(args?: SelectSubset<T, CrawlRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CrawlRun.
     * @param {CrawlRunCreateArgs} args - Arguments to create a CrawlRun.
     * @example
     * // Create one CrawlRun
     * const CrawlRun = await prisma.crawlRun.create({
     *   data: {
     *     // ... data to create a CrawlRun
     *   }
     * })
     * 
     */
    create<T extends CrawlRunCreateArgs>(args: SelectSubset<T, CrawlRunCreateArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CrawlRuns.
     * @param {CrawlRunCreateManyArgs} args - Arguments to create many CrawlRuns.
     * @example
     * // Create many CrawlRuns
     * const crawlRun = await prisma.crawlRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrawlRunCreateManyArgs>(args?: SelectSubset<T, CrawlRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CrawlRuns and returns the data saved in the database.
     * @param {CrawlRunCreateManyAndReturnArgs} args - Arguments to create many CrawlRuns.
     * @example
     * // Create many CrawlRuns
     * const crawlRun = await prisma.crawlRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CrawlRuns and only return the `id`
     * const crawlRunWithIdOnly = await prisma.crawlRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrawlRunCreateManyAndReturnArgs>(args?: SelectSubset<T, CrawlRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CrawlRun.
     * @param {CrawlRunDeleteArgs} args - Arguments to delete one CrawlRun.
     * @example
     * // Delete one CrawlRun
     * const CrawlRun = await prisma.crawlRun.delete({
     *   where: {
     *     // ... filter to delete one CrawlRun
     *   }
     * })
     * 
     */
    delete<T extends CrawlRunDeleteArgs>(args: SelectSubset<T, CrawlRunDeleteArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CrawlRun.
     * @param {CrawlRunUpdateArgs} args - Arguments to update one CrawlRun.
     * @example
     * // Update one CrawlRun
     * const crawlRun = await prisma.crawlRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrawlRunUpdateArgs>(args: SelectSubset<T, CrawlRunUpdateArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CrawlRuns.
     * @param {CrawlRunDeleteManyArgs} args - Arguments to filter CrawlRuns to delete.
     * @example
     * // Delete a few CrawlRuns
     * const { count } = await prisma.crawlRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrawlRunDeleteManyArgs>(args?: SelectSubset<T, CrawlRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrawlRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CrawlRuns
     * const crawlRun = await prisma.crawlRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrawlRunUpdateManyArgs>(args: SelectSubset<T, CrawlRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrawlRuns and returns the data updated in the database.
     * @param {CrawlRunUpdateManyAndReturnArgs} args - Arguments to update many CrawlRuns.
     * @example
     * // Update many CrawlRuns
     * const crawlRun = await prisma.crawlRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CrawlRuns and only return the `id`
     * const crawlRunWithIdOnly = await prisma.crawlRun.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CrawlRunUpdateManyAndReturnArgs>(args: SelectSubset<T, CrawlRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CrawlRun.
     * @param {CrawlRunUpsertArgs} args - Arguments to update or create a CrawlRun.
     * @example
     * // Update or create a CrawlRun
     * const crawlRun = await prisma.crawlRun.upsert({
     *   create: {
     *     // ... data to create a CrawlRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CrawlRun we want to update
     *   }
     * })
     */
    upsert<T extends CrawlRunUpsertArgs>(args: SelectSubset<T, CrawlRunUpsertArgs<ExtArgs>>): Prisma__CrawlRunClient<$Result.GetResult<Prisma.$CrawlRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CrawlRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunCountArgs} args - Arguments to filter CrawlRuns to count.
     * @example
     * // Count the number of CrawlRuns
     * const count = await prisma.crawlRun.count({
     *   where: {
     *     // ... the filter for the CrawlRuns we want to count
     *   }
     * })
    **/
    count<T extends CrawlRunCountArgs>(
      args?: Subset<T, CrawlRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrawlRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CrawlRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CrawlRunAggregateArgs>(args: Subset<T, CrawlRunAggregateArgs>): Prisma.PrismaPromise<GetCrawlRunAggregateType<T>>

    /**
     * Group by CrawlRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrawlRunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CrawlRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrawlRunGroupByArgs['orderBy'] }
        : { orderBy?: CrawlRunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CrawlRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrawlRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CrawlRun model
   */
  readonly fields: CrawlRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CrawlRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrawlRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    source<T extends CrawlRun$sourceArgs<ExtArgs> = {}>(args?: Subset<T, CrawlRun$sourceArgs<ExtArgs>>): Prisma__SourceClient<$Result.GetResult<Prisma.$SourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CrawlRun model
   */
  interface CrawlRunFieldRefs {
    readonly id: FieldRef<"CrawlRun", 'String'>
    readonly sourceId: FieldRef<"CrawlRun", 'String'>
    readonly startedAt: FieldRef<"CrawlRun", 'DateTime'>
    readonly finishedAt: FieldRef<"CrawlRun", 'DateTime'>
    readonly status: FieldRef<"CrawlRun", 'CrawlRunStatus'>
    readonly sourcesOk: FieldRef<"CrawlRun", 'Int'>
    readonly sourcesFailed: FieldRef<"CrawlRun", 'Int'>
    readonly openDiscovered: FieldRef<"CrawlRun", 'Int'>
    readonly proposedSources: FieldRef<"CrawlRun", 'Int'>
    readonly errors: FieldRef<"CrawlRun", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * CrawlRun findUnique
   */
  export type CrawlRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter, which CrawlRun to fetch.
     */
    where: CrawlRunWhereUniqueInput
  }

  /**
   * CrawlRun findUniqueOrThrow
   */
  export type CrawlRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter, which CrawlRun to fetch.
     */
    where: CrawlRunWhereUniqueInput
  }

  /**
   * CrawlRun findFirst
   */
  export type CrawlRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter, which CrawlRun to fetch.
     */
    where?: CrawlRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrawlRuns to fetch.
     */
    orderBy?: CrawlRunOrderByWithRelationInput | CrawlRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrawlRuns.
     */
    cursor?: CrawlRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrawlRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrawlRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrawlRuns.
     */
    distinct?: CrawlRunScalarFieldEnum | CrawlRunScalarFieldEnum[]
  }

  /**
   * CrawlRun findFirstOrThrow
   */
  export type CrawlRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter, which CrawlRun to fetch.
     */
    where?: CrawlRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrawlRuns to fetch.
     */
    orderBy?: CrawlRunOrderByWithRelationInput | CrawlRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrawlRuns.
     */
    cursor?: CrawlRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrawlRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrawlRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrawlRuns.
     */
    distinct?: CrawlRunScalarFieldEnum | CrawlRunScalarFieldEnum[]
  }

  /**
   * CrawlRun findMany
   */
  export type CrawlRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter, which CrawlRuns to fetch.
     */
    where?: CrawlRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrawlRuns to fetch.
     */
    orderBy?: CrawlRunOrderByWithRelationInput | CrawlRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CrawlRuns.
     */
    cursor?: CrawlRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrawlRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrawlRuns.
     */
    skip?: number
    distinct?: CrawlRunScalarFieldEnum | CrawlRunScalarFieldEnum[]
  }

  /**
   * CrawlRun create
   */
  export type CrawlRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * The data needed to create a CrawlRun.
     */
    data: XOR<CrawlRunCreateInput, CrawlRunUncheckedCreateInput>
  }

  /**
   * CrawlRun createMany
   */
  export type CrawlRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CrawlRuns.
     */
    data: CrawlRunCreateManyInput | CrawlRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrawlRun createManyAndReturn
   */
  export type CrawlRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * The data used to create many CrawlRuns.
     */
    data: CrawlRunCreateManyInput | CrawlRunCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CrawlRun update
   */
  export type CrawlRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * The data needed to update a CrawlRun.
     */
    data: XOR<CrawlRunUpdateInput, CrawlRunUncheckedUpdateInput>
    /**
     * Choose, which CrawlRun to update.
     */
    where: CrawlRunWhereUniqueInput
  }

  /**
   * CrawlRun updateMany
   */
  export type CrawlRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CrawlRuns.
     */
    data: XOR<CrawlRunUpdateManyMutationInput, CrawlRunUncheckedUpdateManyInput>
    /**
     * Filter which CrawlRuns to update
     */
    where?: CrawlRunWhereInput
    /**
     * Limit how many CrawlRuns to update.
     */
    limit?: number
  }

  /**
   * CrawlRun updateManyAndReturn
   */
  export type CrawlRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * The data used to update CrawlRuns.
     */
    data: XOR<CrawlRunUpdateManyMutationInput, CrawlRunUncheckedUpdateManyInput>
    /**
     * Filter which CrawlRuns to update
     */
    where?: CrawlRunWhereInput
    /**
     * Limit how many CrawlRuns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CrawlRun upsert
   */
  export type CrawlRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * The filter to search for the CrawlRun to update in case it exists.
     */
    where: CrawlRunWhereUniqueInput
    /**
     * In case the CrawlRun found by the `where` argument doesn't exist, create a new CrawlRun with this data.
     */
    create: XOR<CrawlRunCreateInput, CrawlRunUncheckedCreateInput>
    /**
     * In case the CrawlRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrawlRunUpdateInput, CrawlRunUncheckedUpdateInput>
  }

  /**
   * CrawlRun delete
   */
  export type CrawlRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
    /**
     * Filter which CrawlRun to delete.
     */
    where: CrawlRunWhereUniqueInput
  }

  /**
   * CrawlRun deleteMany
   */
  export type CrawlRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrawlRuns to delete
     */
    where?: CrawlRunWhereInput
    /**
     * Limit how many CrawlRuns to delete.
     */
    limit?: number
  }

  /**
   * CrawlRun.source
   */
  export type CrawlRun$sourceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Source
     */
    select?: SourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Source
     */
    omit?: SourceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SourceInclude<ExtArgs> | null
    where?: SourceWhereInput
  }

  /**
   * CrawlRun without action
   */
  export type CrawlRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrawlRun
     */
    select?: CrawlRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrawlRun
     */
    omit?: CrawlRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrawlRunInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const SourceScalarFieldEnum: {
    id: 'id',
    domain: 'domain',
    name: 'name',
    startUrls: 'startUrls',
    strategy: 'strategy',
    linkSelector: 'linkSelector',
    linkPatterns: 'linkPatterns',
    openPatterns: 'openPatterns',
    trust: 'trust',
    status: 'status',
    enabled: 'enabled',
    intervalSec: 'intervalSec',
    politenessMs: 'politenessMs',
    failCount: 'failCount',
    lastOkAt: 'lastOkAt',
    lastError: 'lastError',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SourceScalarFieldEnum = (typeof SourceScalarFieldEnum)[keyof typeof SourceScalarFieldEnum]


  export const SourceProposalScalarFieldEnum: {
    id: 'id',
    domain: 'domain',
    name: 'name',
    startUrls: 'startUrls',
    reason: 'reason',
    status: 'status',
    sourceId: 'sourceId',
    createdAt: 'createdAt',
    reviewedAt: 'reviewedAt'
  };

  export type SourceProposalScalarFieldEnum = (typeof SourceProposalScalarFieldEnum)[keyof typeof SourceProposalScalarFieldEnum]


  export const ExamScalarFieldEnum: {
    id: 'id',
    examSlug: 'examSlug',
    title: 'title',
    org: 'org',
    banca: 'banca',
    emphasis: 'emphasis',
    editalUrl: 'editalUrl',
    listingUrl: 'listingUrl',
    status: 'status',
    sourceId: 'sourceId',
    sourceDomain: 'sourceDomain',
    discoveredAt: 'discoveredAt',
    lastSeenAt: 'lastSeenAt'
  };

  export type ExamScalarFieldEnum = (typeof ExamScalarFieldEnum)[keyof typeof ExamScalarFieldEnum]


  export const ArtifactScalarFieldEnum: {
    id: 'id',
    examId: 'examId',
    sourceId: 'sourceId',
    kind: 'kind',
    url: 'url',
    storageKey: 'storageKey',
    checksum: 'checksum',
    contentType: 'contentType',
    byteSize: 'byteSize',
    fetchedAt: 'fetchedAt',
    published: 'published'
  };

  export type ArtifactScalarFieldEnum = (typeof ArtifactScalarFieldEnum)[keyof typeof ArtifactScalarFieldEnum]


  export const ListingFingerprintScalarFieldEnum: {
    id: 'id',
    sourceId: 'sourceId',
    startUrl: 'startUrl',
    fingerprint: 'fingerprint',
    listingCount: 'listingCount',
    seenAt: 'seenAt'
  };

  export type ListingFingerprintScalarFieldEnum = (typeof ListingFingerprintScalarFieldEnum)[keyof typeof ListingFingerprintScalarFieldEnum]


  export const ControlFlagScalarFieldEnum: {
    id: 'id',
    value: 'value',
    updatedAt: 'updatedAt'
  };

  export type ControlFlagScalarFieldEnum = (typeof ControlFlagScalarFieldEnum)[keyof typeof ControlFlagScalarFieldEnum]


  export const CrawlRunScalarFieldEnum: {
    id: 'id',
    sourceId: 'sourceId',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt',
    status: 'status',
    sourcesOk: 'sourcesOk',
    sourcesFailed: 'sourcesFailed',
    openDiscovered: 'openDiscovered',
    proposedSources: 'proposedSources',
    errors: 'errors'
  };

  export type CrawlRunScalarFieldEnum = (typeof CrawlRunScalarFieldEnum)[keyof typeof CrawlRunScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'CrawlStrategy'
   */
  export type EnumCrawlStrategyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrawlStrategy'>
    


  /**
   * Reference to a field of type 'CrawlStrategy[]'
   */
  export type ListEnumCrawlStrategyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrawlStrategy[]'>
    


  /**
   * Reference to a field of type 'SourceTrust'
   */
  export type EnumSourceTrustFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SourceTrust'>
    


  /**
   * Reference to a field of type 'SourceTrust[]'
   */
  export type ListEnumSourceTrustFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SourceTrust[]'>
    


  /**
   * Reference to a field of type 'SourceStatus'
   */
  export type EnumSourceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SourceStatus'>
    


  /**
   * Reference to a field of type 'SourceStatus[]'
   */
  export type ListEnumSourceStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SourceStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ExamStatus'
   */
  export type EnumExamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExamStatus'>
    


  /**
   * Reference to a field of type 'ExamStatus[]'
   */
  export type ListEnumExamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExamStatus[]'>
    


  /**
   * Reference to a field of type 'ArtifactKind'
   */
  export type EnumArtifactKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ArtifactKind'>
    


  /**
   * Reference to a field of type 'ArtifactKind[]'
   */
  export type ListEnumArtifactKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ArtifactKind[]'>
    


  /**
   * Reference to a field of type 'CrawlRunStatus'
   */
  export type EnumCrawlRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrawlRunStatus'>
    


  /**
   * Reference to a field of type 'CrawlRunStatus[]'
   */
  export type ListEnumCrawlRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrawlRunStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type SourceWhereInput = {
    AND?: SourceWhereInput | SourceWhereInput[]
    OR?: SourceWhereInput[]
    NOT?: SourceWhereInput | SourceWhereInput[]
    id?: StringFilter<"Source"> | string
    domain?: StringFilter<"Source"> | string
    name?: StringFilter<"Source"> | string
    startUrls?: JsonFilter<"Source">
    strategy?: EnumCrawlStrategyFilter<"Source"> | $Enums.CrawlStrategy
    linkSelector?: StringNullableFilter<"Source"> | string | null
    linkPatterns?: JsonFilter<"Source">
    openPatterns?: JsonFilter<"Source">
    trust?: EnumSourceTrustFilter<"Source"> | $Enums.SourceTrust
    status?: EnumSourceStatusFilter<"Source"> | $Enums.SourceStatus
    enabled?: BoolFilter<"Source"> | boolean
    intervalSec?: IntFilter<"Source"> | number
    politenessMs?: IntFilter<"Source"> | number
    failCount?: IntFilter<"Source"> | number
    lastOkAt?: DateTimeNullableFilter<"Source"> | Date | string | null
    lastError?: StringNullableFilter<"Source"> | string | null
    notes?: StringNullableFilter<"Source"> | string | null
    createdAt?: DateTimeFilter<"Source"> | Date | string
    updatedAt?: DateTimeFilter<"Source"> | Date | string
    exams?: ExamListRelationFilter
    artifacts?: ArtifactListRelationFilter
    proposals?: SourceProposalListRelationFilter
    runs?: CrawlRunListRelationFilter
    fingerprints?: ListingFingerprintListRelationFilter
  }

  export type SourceOrderByWithRelationInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    strategy?: SortOrder
    linkSelector?: SortOrderInput | SortOrder
    linkPatterns?: SortOrder
    openPatterns?: SortOrder
    trust?: SortOrder
    status?: SortOrder
    enabled?: SortOrder
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
    lastOkAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    exams?: ExamOrderByRelationAggregateInput
    artifacts?: ArtifactOrderByRelationAggregateInput
    proposals?: SourceProposalOrderByRelationAggregateInput
    runs?: CrawlRunOrderByRelationAggregateInput
    fingerprints?: ListingFingerprintOrderByRelationAggregateInput
  }

  export type SourceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SourceWhereInput | SourceWhereInput[]
    OR?: SourceWhereInput[]
    NOT?: SourceWhereInput | SourceWhereInput[]
    domain?: StringFilter<"Source"> | string
    name?: StringFilter<"Source"> | string
    startUrls?: JsonFilter<"Source">
    strategy?: EnumCrawlStrategyFilter<"Source"> | $Enums.CrawlStrategy
    linkSelector?: StringNullableFilter<"Source"> | string | null
    linkPatterns?: JsonFilter<"Source">
    openPatterns?: JsonFilter<"Source">
    trust?: EnumSourceTrustFilter<"Source"> | $Enums.SourceTrust
    status?: EnumSourceStatusFilter<"Source"> | $Enums.SourceStatus
    enabled?: BoolFilter<"Source"> | boolean
    intervalSec?: IntFilter<"Source"> | number
    politenessMs?: IntFilter<"Source"> | number
    failCount?: IntFilter<"Source"> | number
    lastOkAt?: DateTimeNullableFilter<"Source"> | Date | string | null
    lastError?: StringNullableFilter<"Source"> | string | null
    notes?: StringNullableFilter<"Source"> | string | null
    createdAt?: DateTimeFilter<"Source"> | Date | string
    updatedAt?: DateTimeFilter<"Source"> | Date | string
    exams?: ExamListRelationFilter
    artifacts?: ArtifactListRelationFilter
    proposals?: SourceProposalListRelationFilter
    runs?: CrawlRunListRelationFilter
    fingerprints?: ListingFingerprintListRelationFilter
  }, "id">

  export type SourceOrderByWithAggregationInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    strategy?: SortOrder
    linkSelector?: SortOrderInput | SortOrder
    linkPatterns?: SortOrder
    openPatterns?: SortOrder
    trust?: SortOrder
    status?: SortOrder
    enabled?: SortOrder
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
    lastOkAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SourceCountOrderByAggregateInput
    _avg?: SourceAvgOrderByAggregateInput
    _max?: SourceMaxOrderByAggregateInput
    _min?: SourceMinOrderByAggregateInput
    _sum?: SourceSumOrderByAggregateInput
  }

  export type SourceScalarWhereWithAggregatesInput = {
    AND?: SourceScalarWhereWithAggregatesInput | SourceScalarWhereWithAggregatesInput[]
    OR?: SourceScalarWhereWithAggregatesInput[]
    NOT?: SourceScalarWhereWithAggregatesInput | SourceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Source"> | string
    domain?: StringWithAggregatesFilter<"Source"> | string
    name?: StringWithAggregatesFilter<"Source"> | string
    startUrls?: JsonWithAggregatesFilter<"Source">
    strategy?: EnumCrawlStrategyWithAggregatesFilter<"Source"> | $Enums.CrawlStrategy
    linkSelector?: StringNullableWithAggregatesFilter<"Source"> | string | null
    linkPatterns?: JsonWithAggregatesFilter<"Source">
    openPatterns?: JsonWithAggregatesFilter<"Source">
    trust?: EnumSourceTrustWithAggregatesFilter<"Source"> | $Enums.SourceTrust
    status?: EnumSourceStatusWithAggregatesFilter<"Source"> | $Enums.SourceStatus
    enabled?: BoolWithAggregatesFilter<"Source"> | boolean
    intervalSec?: IntWithAggregatesFilter<"Source"> | number
    politenessMs?: IntWithAggregatesFilter<"Source"> | number
    failCount?: IntWithAggregatesFilter<"Source"> | number
    lastOkAt?: DateTimeNullableWithAggregatesFilter<"Source"> | Date | string | null
    lastError?: StringNullableWithAggregatesFilter<"Source"> | string | null
    notes?: StringNullableWithAggregatesFilter<"Source"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Source"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Source"> | Date | string
  }

  export type SourceProposalWhereInput = {
    AND?: SourceProposalWhereInput | SourceProposalWhereInput[]
    OR?: SourceProposalWhereInput[]
    NOT?: SourceProposalWhereInput | SourceProposalWhereInput[]
    id?: StringFilter<"SourceProposal"> | string
    domain?: StringFilter<"SourceProposal"> | string
    name?: StringFilter<"SourceProposal"> | string
    startUrls?: JsonFilter<"SourceProposal">
    reason?: StringNullableFilter<"SourceProposal"> | string | null
    status?: EnumSourceStatusFilter<"SourceProposal"> | $Enums.SourceStatus
    sourceId?: StringNullableFilter<"SourceProposal"> | string | null
    createdAt?: DateTimeFilter<"SourceProposal"> | Date | string
    reviewedAt?: DateTimeNullableFilter<"SourceProposal"> | Date | string | null
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }

  export type SourceProposalOrderByWithRelationInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    reason?: SortOrderInput | SortOrder
    status?: SortOrder
    sourceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    source?: SourceOrderByWithRelationInput
  }

  export type SourceProposalWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SourceProposalWhereInput | SourceProposalWhereInput[]
    OR?: SourceProposalWhereInput[]
    NOT?: SourceProposalWhereInput | SourceProposalWhereInput[]
    domain?: StringFilter<"SourceProposal"> | string
    name?: StringFilter<"SourceProposal"> | string
    startUrls?: JsonFilter<"SourceProposal">
    reason?: StringNullableFilter<"SourceProposal"> | string | null
    status?: EnumSourceStatusFilter<"SourceProposal"> | $Enums.SourceStatus
    sourceId?: StringNullableFilter<"SourceProposal"> | string | null
    createdAt?: DateTimeFilter<"SourceProposal"> | Date | string
    reviewedAt?: DateTimeNullableFilter<"SourceProposal"> | Date | string | null
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }, "id">

  export type SourceProposalOrderByWithAggregationInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    reason?: SortOrderInput | SortOrder
    status?: SortOrder
    sourceId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    _count?: SourceProposalCountOrderByAggregateInput
    _max?: SourceProposalMaxOrderByAggregateInput
    _min?: SourceProposalMinOrderByAggregateInput
  }

  export type SourceProposalScalarWhereWithAggregatesInput = {
    AND?: SourceProposalScalarWhereWithAggregatesInput | SourceProposalScalarWhereWithAggregatesInput[]
    OR?: SourceProposalScalarWhereWithAggregatesInput[]
    NOT?: SourceProposalScalarWhereWithAggregatesInput | SourceProposalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SourceProposal"> | string
    domain?: StringWithAggregatesFilter<"SourceProposal"> | string
    name?: StringWithAggregatesFilter<"SourceProposal"> | string
    startUrls?: JsonWithAggregatesFilter<"SourceProposal">
    reason?: StringNullableWithAggregatesFilter<"SourceProposal"> | string | null
    status?: EnumSourceStatusWithAggregatesFilter<"SourceProposal"> | $Enums.SourceStatus
    sourceId?: StringNullableWithAggregatesFilter<"SourceProposal"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SourceProposal"> | Date | string
    reviewedAt?: DateTimeNullableWithAggregatesFilter<"SourceProposal"> | Date | string | null
  }

  export type ExamWhereInput = {
    AND?: ExamWhereInput | ExamWhereInput[]
    OR?: ExamWhereInput[]
    NOT?: ExamWhereInput | ExamWhereInput[]
    id?: StringFilter<"Exam"> | string
    examSlug?: StringFilter<"Exam"> | string
    title?: StringFilter<"Exam"> | string
    org?: StringNullableFilter<"Exam"> | string | null
    banca?: StringNullableFilter<"Exam"> | string | null
    emphasis?: JsonFilter<"Exam">
    editalUrl?: StringNullableFilter<"Exam"> | string | null
    listingUrl?: StringFilter<"Exam"> | string
    status?: EnumExamStatusFilter<"Exam"> | $Enums.ExamStatus
    sourceId?: StringFilter<"Exam"> | string
    sourceDomain?: StringFilter<"Exam"> | string
    discoveredAt?: DateTimeFilter<"Exam"> | Date | string
    lastSeenAt?: DateTimeFilter<"Exam"> | Date | string
    source?: XOR<SourceScalarRelationFilter, SourceWhereInput>
    artifacts?: ArtifactListRelationFilter
  }

  export type ExamOrderByWithRelationInput = {
    id?: SortOrder
    examSlug?: SortOrder
    title?: SortOrder
    org?: SortOrderInput | SortOrder
    banca?: SortOrderInput | SortOrder
    emphasis?: SortOrder
    editalUrl?: SortOrderInput | SortOrder
    listingUrl?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    sourceDomain?: SortOrder
    discoveredAt?: SortOrder
    lastSeenAt?: SortOrder
    source?: SourceOrderByWithRelationInput
    artifacts?: ArtifactOrderByRelationAggregateInput
  }

  export type ExamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    examSlug_listingUrl?: ExamExamSlugListingUrlCompoundUniqueInput
    AND?: ExamWhereInput | ExamWhereInput[]
    OR?: ExamWhereInput[]
    NOT?: ExamWhereInput | ExamWhereInput[]
    examSlug?: StringFilter<"Exam"> | string
    title?: StringFilter<"Exam"> | string
    org?: StringNullableFilter<"Exam"> | string | null
    banca?: StringNullableFilter<"Exam"> | string | null
    emphasis?: JsonFilter<"Exam">
    editalUrl?: StringNullableFilter<"Exam"> | string | null
    listingUrl?: StringFilter<"Exam"> | string
    status?: EnumExamStatusFilter<"Exam"> | $Enums.ExamStatus
    sourceId?: StringFilter<"Exam"> | string
    sourceDomain?: StringFilter<"Exam"> | string
    discoveredAt?: DateTimeFilter<"Exam"> | Date | string
    lastSeenAt?: DateTimeFilter<"Exam"> | Date | string
    source?: XOR<SourceScalarRelationFilter, SourceWhereInput>
    artifacts?: ArtifactListRelationFilter
  }, "id" | "examSlug_listingUrl">

  export type ExamOrderByWithAggregationInput = {
    id?: SortOrder
    examSlug?: SortOrder
    title?: SortOrder
    org?: SortOrderInput | SortOrder
    banca?: SortOrderInput | SortOrder
    emphasis?: SortOrder
    editalUrl?: SortOrderInput | SortOrder
    listingUrl?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    sourceDomain?: SortOrder
    discoveredAt?: SortOrder
    lastSeenAt?: SortOrder
    _count?: ExamCountOrderByAggregateInput
    _max?: ExamMaxOrderByAggregateInput
    _min?: ExamMinOrderByAggregateInput
  }

  export type ExamScalarWhereWithAggregatesInput = {
    AND?: ExamScalarWhereWithAggregatesInput | ExamScalarWhereWithAggregatesInput[]
    OR?: ExamScalarWhereWithAggregatesInput[]
    NOT?: ExamScalarWhereWithAggregatesInput | ExamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Exam"> | string
    examSlug?: StringWithAggregatesFilter<"Exam"> | string
    title?: StringWithAggregatesFilter<"Exam"> | string
    org?: StringNullableWithAggregatesFilter<"Exam"> | string | null
    banca?: StringNullableWithAggregatesFilter<"Exam"> | string | null
    emphasis?: JsonWithAggregatesFilter<"Exam">
    editalUrl?: StringNullableWithAggregatesFilter<"Exam"> | string | null
    listingUrl?: StringWithAggregatesFilter<"Exam"> | string
    status?: EnumExamStatusWithAggregatesFilter<"Exam"> | $Enums.ExamStatus
    sourceId?: StringWithAggregatesFilter<"Exam"> | string
    sourceDomain?: StringWithAggregatesFilter<"Exam"> | string
    discoveredAt?: DateTimeWithAggregatesFilter<"Exam"> | Date | string
    lastSeenAt?: DateTimeWithAggregatesFilter<"Exam"> | Date | string
  }

  export type ArtifactWhereInput = {
    AND?: ArtifactWhereInput | ArtifactWhereInput[]
    OR?: ArtifactWhereInput[]
    NOT?: ArtifactWhereInput | ArtifactWhereInput[]
    id?: StringFilter<"Artifact"> | string
    examId?: StringNullableFilter<"Artifact"> | string | null
    sourceId?: StringNullableFilter<"Artifact"> | string | null
    kind?: EnumArtifactKindFilter<"Artifact"> | $Enums.ArtifactKind
    url?: StringNullableFilter<"Artifact"> | string | null
    storageKey?: StringNullableFilter<"Artifact"> | string | null
    checksum?: StringNullableFilter<"Artifact"> | string | null
    contentType?: StringNullableFilter<"Artifact"> | string | null
    byteSize?: IntNullableFilter<"Artifact"> | number | null
    fetchedAt?: DateTimeFilter<"Artifact"> | Date | string
    published?: BoolFilter<"Artifact"> | boolean
    exam?: XOR<ExamNullableScalarRelationFilter, ExamWhereInput> | null
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }

  export type ArtifactOrderByWithRelationInput = {
    id?: SortOrder
    examId?: SortOrderInput | SortOrder
    sourceId?: SortOrderInput | SortOrder
    kind?: SortOrder
    url?: SortOrderInput | SortOrder
    storageKey?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    contentType?: SortOrderInput | SortOrder
    byteSize?: SortOrderInput | SortOrder
    fetchedAt?: SortOrder
    published?: SortOrder
    exam?: ExamOrderByWithRelationInput
    source?: SourceOrderByWithRelationInput
  }

  export type ArtifactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ArtifactWhereInput | ArtifactWhereInput[]
    OR?: ArtifactWhereInput[]
    NOT?: ArtifactWhereInput | ArtifactWhereInput[]
    examId?: StringNullableFilter<"Artifact"> | string | null
    sourceId?: StringNullableFilter<"Artifact"> | string | null
    kind?: EnumArtifactKindFilter<"Artifact"> | $Enums.ArtifactKind
    url?: StringNullableFilter<"Artifact"> | string | null
    storageKey?: StringNullableFilter<"Artifact"> | string | null
    checksum?: StringNullableFilter<"Artifact"> | string | null
    contentType?: StringNullableFilter<"Artifact"> | string | null
    byteSize?: IntNullableFilter<"Artifact"> | number | null
    fetchedAt?: DateTimeFilter<"Artifact"> | Date | string
    published?: BoolFilter<"Artifact"> | boolean
    exam?: XOR<ExamNullableScalarRelationFilter, ExamWhereInput> | null
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }, "id">

  export type ArtifactOrderByWithAggregationInput = {
    id?: SortOrder
    examId?: SortOrderInput | SortOrder
    sourceId?: SortOrderInput | SortOrder
    kind?: SortOrder
    url?: SortOrderInput | SortOrder
    storageKey?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    contentType?: SortOrderInput | SortOrder
    byteSize?: SortOrderInput | SortOrder
    fetchedAt?: SortOrder
    published?: SortOrder
    _count?: ArtifactCountOrderByAggregateInput
    _avg?: ArtifactAvgOrderByAggregateInput
    _max?: ArtifactMaxOrderByAggregateInput
    _min?: ArtifactMinOrderByAggregateInput
    _sum?: ArtifactSumOrderByAggregateInput
  }

  export type ArtifactScalarWhereWithAggregatesInput = {
    AND?: ArtifactScalarWhereWithAggregatesInput | ArtifactScalarWhereWithAggregatesInput[]
    OR?: ArtifactScalarWhereWithAggregatesInput[]
    NOT?: ArtifactScalarWhereWithAggregatesInput | ArtifactScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Artifact"> | string
    examId?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    sourceId?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    kind?: EnumArtifactKindWithAggregatesFilter<"Artifact"> | $Enums.ArtifactKind
    url?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    storageKey?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    checksum?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    contentType?: StringNullableWithAggregatesFilter<"Artifact"> | string | null
    byteSize?: IntNullableWithAggregatesFilter<"Artifact"> | number | null
    fetchedAt?: DateTimeWithAggregatesFilter<"Artifact"> | Date | string
    published?: BoolWithAggregatesFilter<"Artifact"> | boolean
  }

  export type ListingFingerprintWhereInput = {
    AND?: ListingFingerprintWhereInput | ListingFingerprintWhereInput[]
    OR?: ListingFingerprintWhereInput[]
    NOT?: ListingFingerprintWhereInput | ListingFingerprintWhereInput[]
    id?: StringFilter<"ListingFingerprint"> | string
    sourceId?: StringFilter<"ListingFingerprint"> | string
    startUrl?: StringFilter<"ListingFingerprint"> | string
    fingerprint?: StringFilter<"ListingFingerprint"> | string
    listingCount?: IntFilter<"ListingFingerprint"> | number
    seenAt?: DateTimeFilter<"ListingFingerprint"> | Date | string
    source?: XOR<SourceScalarRelationFilter, SourceWhereInput>
  }

  export type ListingFingerprintOrderByWithRelationInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startUrl?: SortOrder
    fingerprint?: SortOrder
    listingCount?: SortOrder
    seenAt?: SortOrder
    source?: SourceOrderByWithRelationInput
  }

  export type ListingFingerprintWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sourceId_startUrl?: ListingFingerprintSourceIdStartUrlCompoundUniqueInput
    AND?: ListingFingerprintWhereInput | ListingFingerprintWhereInput[]
    OR?: ListingFingerprintWhereInput[]
    NOT?: ListingFingerprintWhereInput | ListingFingerprintWhereInput[]
    sourceId?: StringFilter<"ListingFingerprint"> | string
    startUrl?: StringFilter<"ListingFingerprint"> | string
    fingerprint?: StringFilter<"ListingFingerprint"> | string
    listingCount?: IntFilter<"ListingFingerprint"> | number
    seenAt?: DateTimeFilter<"ListingFingerprint"> | Date | string
    source?: XOR<SourceScalarRelationFilter, SourceWhereInput>
  }, "id" | "sourceId_startUrl">

  export type ListingFingerprintOrderByWithAggregationInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startUrl?: SortOrder
    fingerprint?: SortOrder
    listingCount?: SortOrder
    seenAt?: SortOrder
    _count?: ListingFingerprintCountOrderByAggregateInput
    _avg?: ListingFingerprintAvgOrderByAggregateInput
    _max?: ListingFingerprintMaxOrderByAggregateInput
    _min?: ListingFingerprintMinOrderByAggregateInput
    _sum?: ListingFingerprintSumOrderByAggregateInput
  }

  export type ListingFingerprintScalarWhereWithAggregatesInput = {
    AND?: ListingFingerprintScalarWhereWithAggregatesInput | ListingFingerprintScalarWhereWithAggregatesInput[]
    OR?: ListingFingerprintScalarWhereWithAggregatesInput[]
    NOT?: ListingFingerprintScalarWhereWithAggregatesInput | ListingFingerprintScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ListingFingerprint"> | string
    sourceId?: StringWithAggregatesFilter<"ListingFingerprint"> | string
    startUrl?: StringWithAggregatesFilter<"ListingFingerprint"> | string
    fingerprint?: StringWithAggregatesFilter<"ListingFingerprint"> | string
    listingCount?: IntWithAggregatesFilter<"ListingFingerprint"> | number
    seenAt?: DateTimeWithAggregatesFilter<"ListingFingerprint"> | Date | string
  }

  export type ControlFlagWhereInput = {
    AND?: ControlFlagWhereInput | ControlFlagWhereInput[]
    OR?: ControlFlagWhereInput[]
    NOT?: ControlFlagWhereInput | ControlFlagWhereInput[]
    id?: StringFilter<"ControlFlag"> | string
    value?: JsonFilter<"ControlFlag">
    updatedAt?: DateTimeFilter<"ControlFlag"> | Date | string
  }

  export type ControlFlagOrderByWithRelationInput = {
    id?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type ControlFlagWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ControlFlagWhereInput | ControlFlagWhereInput[]
    OR?: ControlFlagWhereInput[]
    NOT?: ControlFlagWhereInput | ControlFlagWhereInput[]
    value?: JsonFilter<"ControlFlag">
    updatedAt?: DateTimeFilter<"ControlFlag"> | Date | string
  }, "id">

  export type ControlFlagOrderByWithAggregationInput = {
    id?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
    _count?: ControlFlagCountOrderByAggregateInput
    _max?: ControlFlagMaxOrderByAggregateInput
    _min?: ControlFlagMinOrderByAggregateInput
  }

  export type ControlFlagScalarWhereWithAggregatesInput = {
    AND?: ControlFlagScalarWhereWithAggregatesInput | ControlFlagScalarWhereWithAggregatesInput[]
    OR?: ControlFlagScalarWhereWithAggregatesInput[]
    NOT?: ControlFlagScalarWhereWithAggregatesInput | ControlFlagScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ControlFlag"> | string
    value?: JsonWithAggregatesFilter<"ControlFlag">
    updatedAt?: DateTimeWithAggregatesFilter<"ControlFlag"> | Date | string
  }

  export type CrawlRunWhereInput = {
    AND?: CrawlRunWhereInput | CrawlRunWhereInput[]
    OR?: CrawlRunWhereInput[]
    NOT?: CrawlRunWhereInput | CrawlRunWhereInput[]
    id?: StringFilter<"CrawlRun"> | string
    sourceId?: StringNullableFilter<"CrawlRun"> | string | null
    startedAt?: DateTimeFilter<"CrawlRun"> | Date | string
    finishedAt?: DateTimeNullableFilter<"CrawlRun"> | Date | string | null
    status?: EnumCrawlRunStatusFilter<"CrawlRun"> | $Enums.CrawlRunStatus
    sourcesOk?: IntFilter<"CrawlRun"> | number
    sourcesFailed?: IntFilter<"CrawlRun"> | number
    openDiscovered?: IntFilter<"CrawlRun"> | number
    proposedSources?: IntFilter<"CrawlRun"> | number
    errors?: JsonFilter<"CrawlRun">
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }

  export type CrawlRunOrderByWithRelationInput = {
    id?: SortOrder
    sourceId?: SortOrderInput | SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
    errors?: SortOrder
    source?: SourceOrderByWithRelationInput
  }

  export type CrawlRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CrawlRunWhereInput | CrawlRunWhereInput[]
    OR?: CrawlRunWhereInput[]
    NOT?: CrawlRunWhereInput | CrawlRunWhereInput[]
    sourceId?: StringNullableFilter<"CrawlRun"> | string | null
    startedAt?: DateTimeFilter<"CrawlRun"> | Date | string
    finishedAt?: DateTimeNullableFilter<"CrawlRun"> | Date | string | null
    status?: EnumCrawlRunStatusFilter<"CrawlRun"> | $Enums.CrawlRunStatus
    sourcesOk?: IntFilter<"CrawlRun"> | number
    sourcesFailed?: IntFilter<"CrawlRun"> | number
    openDiscovered?: IntFilter<"CrawlRun"> | number
    proposedSources?: IntFilter<"CrawlRun"> | number
    errors?: JsonFilter<"CrawlRun">
    source?: XOR<SourceNullableScalarRelationFilter, SourceWhereInput> | null
  }, "id">

  export type CrawlRunOrderByWithAggregationInput = {
    id?: SortOrder
    sourceId?: SortOrderInput | SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
    errors?: SortOrder
    _count?: CrawlRunCountOrderByAggregateInput
    _avg?: CrawlRunAvgOrderByAggregateInput
    _max?: CrawlRunMaxOrderByAggregateInput
    _min?: CrawlRunMinOrderByAggregateInput
    _sum?: CrawlRunSumOrderByAggregateInput
  }

  export type CrawlRunScalarWhereWithAggregatesInput = {
    AND?: CrawlRunScalarWhereWithAggregatesInput | CrawlRunScalarWhereWithAggregatesInput[]
    OR?: CrawlRunScalarWhereWithAggregatesInput[]
    NOT?: CrawlRunScalarWhereWithAggregatesInput | CrawlRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CrawlRun"> | string
    sourceId?: StringNullableWithAggregatesFilter<"CrawlRun"> | string | null
    startedAt?: DateTimeWithAggregatesFilter<"CrawlRun"> | Date | string
    finishedAt?: DateTimeNullableWithAggregatesFilter<"CrawlRun"> | Date | string | null
    status?: EnumCrawlRunStatusWithAggregatesFilter<"CrawlRun"> | $Enums.CrawlRunStatus
    sourcesOk?: IntWithAggregatesFilter<"CrawlRun"> | number
    sourcesFailed?: IntWithAggregatesFilter<"CrawlRun"> | number
    openDiscovered?: IntWithAggregatesFilter<"CrawlRun"> | number
    proposedSources?: IntWithAggregatesFilter<"CrawlRun"> | number
    errors?: JsonWithAggregatesFilter<"CrawlRun">
  }

  export type SourceCreateInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalCreateNestedManyWithoutSourceInput
    runs?: CrawlRunCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamUncheckedCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalUncheckedCreateNestedManyWithoutSourceInput
    runs?: CrawlRunUncheckedCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUncheckedUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUncheckedUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUncheckedUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUncheckedUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type SourceCreateManyInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SourceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SourceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SourceProposalCreateInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
    source?: SourceCreateNestedOneWithoutProposalsInput
  }

  export type SourceProposalUncheckedCreateInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    sourceId?: string | null
    createdAt?: Date | string
    reviewedAt?: Date | string | null
  }

  export type SourceProposalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    source?: SourceUpdateOneWithoutProposalsNestedInput
  }

  export type SourceProposalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SourceProposalCreateManyInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    sourceId?: string | null
    createdAt?: Date | string
    reviewedAt?: Date | string | null
  }

  export type SourceProposalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SourceProposalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ExamCreateInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
    source: SourceCreateNestedOneWithoutExamsInput
    artifacts?: ArtifactCreateNestedManyWithoutExamInput
  }

  export type ExamUncheckedCreateInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceId: string
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutExamInput
  }

  export type ExamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: SourceUpdateOneRequiredWithoutExamsNestedInput
    artifacts?: ArtifactUpdateManyWithoutExamNestedInput
  }

  export type ExamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artifacts?: ArtifactUncheckedUpdateManyWithoutExamNestedInput
  }

  export type ExamCreateManyInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceId: string
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
  }

  export type ExamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtifactCreateInput = {
    id?: string
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
    exam?: ExamCreateNestedOneWithoutArtifactsInput
    source?: SourceCreateNestedOneWithoutArtifactsInput
  }

  export type ArtifactUncheckedCreateInput = {
    id?: string
    examId?: string | null
    sourceId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type ArtifactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
    exam?: ExamUpdateOneWithoutArtifactsNestedInput
    source?: SourceUpdateOneWithoutArtifactsNestedInput
  }

  export type ArtifactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    examId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ArtifactCreateManyInput = {
    id?: string
    examId?: string | null
    sourceId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type ArtifactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ArtifactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    examId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ListingFingerprintCreateInput = {
    id?: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
    source: SourceCreateNestedOneWithoutFingerprintsInput
  }

  export type ListingFingerprintUncheckedCreateInput = {
    id?: string
    sourceId: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
  }

  export type ListingFingerprintUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: SourceUpdateOneRequiredWithoutFingerprintsNestedInput
  }

  export type ListingFingerprintUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingFingerprintCreateManyInput = {
    id?: string
    sourceId: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
  }

  export type ListingFingerprintUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingFingerprintUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ControlFlagCreateInput = {
    id: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type ControlFlagUncheckedCreateInput = {
    id: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type ControlFlagUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ControlFlagUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ControlFlagCreateManyInput = {
    id: string
    value: JsonNullValueInput | InputJsonValue
    updatedAt?: Date | string
  }

  export type ControlFlagUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ControlFlagUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrawlRunCreateInput = {
    id: string
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
    source?: SourceCreateNestedOneWithoutRunsInput
  }

  export type CrawlRunUncheckedCreateInput = {
    id: string
    sourceId?: string | null
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
    source?: SourceUpdateOneWithoutRunsNestedInput
  }

  export type CrawlRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunCreateManyInput = {
    id: string
    sourceId?: string | null
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EnumCrawlStrategyFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlStrategy | EnumCrawlStrategyFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlStrategyFilter<$PrismaModel> | $Enums.CrawlStrategy
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumSourceTrustFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceTrust | EnumSourceTrustFieldRefInput<$PrismaModel>
    in?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceTrustFilter<$PrismaModel> | $Enums.SourceTrust
  }

  export type EnumSourceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceStatus | EnumSourceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceStatusFilter<$PrismaModel> | $Enums.SourceStatus
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ExamListRelationFilter = {
    every?: ExamWhereInput
    some?: ExamWhereInput
    none?: ExamWhereInput
  }

  export type ArtifactListRelationFilter = {
    every?: ArtifactWhereInput
    some?: ArtifactWhereInput
    none?: ArtifactWhereInput
  }

  export type SourceProposalListRelationFilter = {
    every?: SourceProposalWhereInput
    some?: SourceProposalWhereInput
    none?: SourceProposalWhereInput
  }

  export type CrawlRunListRelationFilter = {
    every?: CrawlRunWhereInput
    some?: CrawlRunWhereInput
    none?: CrawlRunWhereInput
  }

  export type ListingFingerprintListRelationFilter = {
    every?: ListingFingerprintWhereInput
    some?: ListingFingerprintWhereInput
    none?: ListingFingerprintWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ExamOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ArtifactOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SourceProposalOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CrawlRunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ListingFingerprintOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SourceCountOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    strategy?: SortOrder
    linkSelector?: SortOrder
    linkPatterns?: SortOrder
    openPatterns?: SortOrder
    trust?: SortOrder
    status?: SortOrder
    enabled?: SortOrder
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
    lastOkAt?: SortOrder
    lastError?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SourceAvgOrderByAggregateInput = {
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
  }

  export type SourceMaxOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    strategy?: SortOrder
    linkSelector?: SortOrder
    trust?: SortOrder
    status?: SortOrder
    enabled?: SortOrder
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
    lastOkAt?: SortOrder
    lastError?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SourceMinOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    strategy?: SortOrder
    linkSelector?: SortOrder
    trust?: SortOrder
    status?: SortOrder
    enabled?: SortOrder
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
    lastOkAt?: SortOrder
    lastError?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SourceSumOrderByAggregateInput = {
    intervalSec?: SortOrder
    politenessMs?: SortOrder
    failCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type EnumCrawlStrategyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlStrategy | EnumCrawlStrategyFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlStrategyWithAggregatesFilter<$PrismaModel> | $Enums.CrawlStrategy
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrawlStrategyFilter<$PrismaModel>
    _max?: NestedEnumCrawlStrategyFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumSourceTrustWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceTrust | EnumSourceTrustFieldRefInput<$PrismaModel>
    in?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceTrustWithAggregatesFilter<$PrismaModel> | $Enums.SourceTrust
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSourceTrustFilter<$PrismaModel>
    _max?: NestedEnumSourceTrustFilter<$PrismaModel>
  }

  export type EnumSourceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceStatus | EnumSourceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceStatusWithAggregatesFilter<$PrismaModel> | $Enums.SourceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSourceStatusFilter<$PrismaModel>
    _max?: NestedEnumSourceStatusFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type SourceNullableScalarRelationFilter = {
    is?: SourceWhereInput | null
    isNot?: SourceWhereInput | null
  }

  export type SourceProposalCountOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    startUrls?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
  }

  export type SourceProposalMaxOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
  }

  export type SourceProposalMinOrderByAggregateInput = {
    id?: SortOrder
    domain?: SortOrder
    name?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
  }

  export type EnumExamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamStatus | EnumExamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExamStatusFilter<$PrismaModel> | $Enums.ExamStatus
  }

  export type SourceScalarRelationFilter = {
    is?: SourceWhereInput
    isNot?: SourceWhereInput
  }

  export type ExamExamSlugListingUrlCompoundUniqueInput = {
    examSlug: string
    listingUrl: string
  }

  export type ExamCountOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    title?: SortOrder
    org?: SortOrder
    banca?: SortOrder
    emphasis?: SortOrder
    editalUrl?: SortOrder
    listingUrl?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    sourceDomain?: SortOrder
    discoveredAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type ExamMaxOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    title?: SortOrder
    org?: SortOrder
    banca?: SortOrder
    editalUrl?: SortOrder
    listingUrl?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    sourceDomain?: SortOrder
    discoveredAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type ExamMinOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    title?: SortOrder
    org?: SortOrder
    banca?: SortOrder
    editalUrl?: SortOrder
    listingUrl?: SortOrder
    status?: SortOrder
    sourceId?: SortOrder
    sourceDomain?: SortOrder
    discoveredAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type EnumExamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamStatus | EnumExamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExamStatusWithAggregatesFilter<$PrismaModel> | $Enums.ExamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExamStatusFilter<$PrismaModel>
    _max?: NestedEnumExamStatusFilter<$PrismaModel>
  }

  export type EnumArtifactKindFilter<$PrismaModel = never> = {
    equals?: $Enums.ArtifactKind | EnumArtifactKindFieldRefInput<$PrismaModel>
    in?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    not?: NestedEnumArtifactKindFilter<$PrismaModel> | $Enums.ArtifactKind
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type ExamNullableScalarRelationFilter = {
    is?: ExamWhereInput | null
    isNot?: ExamWhereInput | null
  }

  export type ArtifactCountOrderByAggregateInput = {
    id?: SortOrder
    examId?: SortOrder
    sourceId?: SortOrder
    kind?: SortOrder
    url?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    byteSize?: SortOrder
    fetchedAt?: SortOrder
    published?: SortOrder
  }

  export type ArtifactAvgOrderByAggregateInput = {
    byteSize?: SortOrder
  }

  export type ArtifactMaxOrderByAggregateInput = {
    id?: SortOrder
    examId?: SortOrder
    sourceId?: SortOrder
    kind?: SortOrder
    url?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    byteSize?: SortOrder
    fetchedAt?: SortOrder
    published?: SortOrder
  }

  export type ArtifactMinOrderByAggregateInput = {
    id?: SortOrder
    examId?: SortOrder
    sourceId?: SortOrder
    kind?: SortOrder
    url?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    byteSize?: SortOrder
    fetchedAt?: SortOrder
    published?: SortOrder
  }

  export type ArtifactSumOrderByAggregateInput = {
    byteSize?: SortOrder
  }

  export type EnumArtifactKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ArtifactKind | EnumArtifactKindFieldRefInput<$PrismaModel>
    in?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    not?: NestedEnumArtifactKindWithAggregatesFilter<$PrismaModel> | $Enums.ArtifactKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumArtifactKindFilter<$PrismaModel>
    _max?: NestedEnumArtifactKindFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type ListingFingerprintSourceIdStartUrlCompoundUniqueInput = {
    sourceId: string
    startUrl: string
  }

  export type ListingFingerprintCountOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startUrl?: SortOrder
    fingerprint?: SortOrder
    listingCount?: SortOrder
    seenAt?: SortOrder
  }

  export type ListingFingerprintAvgOrderByAggregateInput = {
    listingCount?: SortOrder
  }

  export type ListingFingerprintMaxOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startUrl?: SortOrder
    fingerprint?: SortOrder
    listingCount?: SortOrder
    seenAt?: SortOrder
  }

  export type ListingFingerprintMinOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startUrl?: SortOrder
    fingerprint?: SortOrder
    listingCount?: SortOrder
    seenAt?: SortOrder
  }

  export type ListingFingerprintSumOrderByAggregateInput = {
    listingCount?: SortOrder
  }

  export type ControlFlagCountOrderByAggregateInput = {
    id?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type ControlFlagMaxOrderByAggregateInput = {
    id?: SortOrder
    updatedAt?: SortOrder
  }

  export type ControlFlagMinOrderByAggregateInput = {
    id?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumCrawlRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlRunStatus | EnumCrawlRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlRunStatusFilter<$PrismaModel> | $Enums.CrawlRunStatus
  }

  export type CrawlRunCountOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    status?: SortOrder
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
    errors?: SortOrder
  }

  export type CrawlRunAvgOrderByAggregateInput = {
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
  }

  export type CrawlRunMaxOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    status?: SortOrder
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
  }

  export type CrawlRunMinOrderByAggregateInput = {
    id?: SortOrder
    sourceId?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    status?: SortOrder
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
  }

  export type CrawlRunSumOrderByAggregateInput = {
    sourcesOk?: SortOrder
    sourcesFailed?: SortOrder
    openDiscovered?: SortOrder
    proposedSources?: SortOrder
  }

  export type EnumCrawlRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlRunStatus | EnumCrawlRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrawlRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrawlRunStatusFilter<$PrismaModel>
    _max?: NestedEnumCrawlRunStatusFilter<$PrismaModel>
  }

  export type ExamCreateNestedManyWithoutSourceInput = {
    create?: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput> | ExamCreateWithoutSourceInput[] | ExamUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ExamCreateOrConnectWithoutSourceInput | ExamCreateOrConnectWithoutSourceInput[]
    createMany?: ExamCreateManySourceInputEnvelope
    connect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
  }

  export type ArtifactCreateNestedManyWithoutSourceInput = {
    create?: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput> | ArtifactCreateWithoutSourceInput[] | ArtifactUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutSourceInput | ArtifactCreateOrConnectWithoutSourceInput[]
    createMany?: ArtifactCreateManySourceInputEnvelope
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
  }

  export type SourceProposalCreateNestedManyWithoutSourceInput = {
    create?: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput> | SourceProposalCreateWithoutSourceInput[] | SourceProposalUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: SourceProposalCreateOrConnectWithoutSourceInput | SourceProposalCreateOrConnectWithoutSourceInput[]
    createMany?: SourceProposalCreateManySourceInputEnvelope
    connect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
  }

  export type CrawlRunCreateNestedManyWithoutSourceInput = {
    create?: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput> | CrawlRunCreateWithoutSourceInput[] | CrawlRunUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: CrawlRunCreateOrConnectWithoutSourceInput | CrawlRunCreateOrConnectWithoutSourceInput[]
    createMany?: CrawlRunCreateManySourceInputEnvelope
    connect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
  }

  export type ListingFingerprintCreateNestedManyWithoutSourceInput = {
    create?: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput> | ListingFingerprintCreateWithoutSourceInput[] | ListingFingerprintUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ListingFingerprintCreateOrConnectWithoutSourceInput | ListingFingerprintCreateOrConnectWithoutSourceInput[]
    createMany?: ListingFingerprintCreateManySourceInputEnvelope
    connect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
  }

  export type ExamUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput> | ExamCreateWithoutSourceInput[] | ExamUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ExamCreateOrConnectWithoutSourceInput | ExamCreateOrConnectWithoutSourceInput[]
    createMany?: ExamCreateManySourceInputEnvelope
    connect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
  }

  export type ArtifactUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput> | ArtifactCreateWithoutSourceInput[] | ArtifactUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutSourceInput | ArtifactCreateOrConnectWithoutSourceInput[]
    createMany?: ArtifactCreateManySourceInputEnvelope
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
  }

  export type SourceProposalUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput> | SourceProposalCreateWithoutSourceInput[] | SourceProposalUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: SourceProposalCreateOrConnectWithoutSourceInput | SourceProposalCreateOrConnectWithoutSourceInput[]
    createMany?: SourceProposalCreateManySourceInputEnvelope
    connect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
  }

  export type CrawlRunUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput> | CrawlRunCreateWithoutSourceInput[] | CrawlRunUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: CrawlRunCreateOrConnectWithoutSourceInput | CrawlRunCreateOrConnectWithoutSourceInput[]
    createMany?: CrawlRunCreateManySourceInputEnvelope
    connect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
  }

  export type ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput = {
    create?: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput> | ListingFingerprintCreateWithoutSourceInput[] | ListingFingerprintUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ListingFingerprintCreateOrConnectWithoutSourceInput | ListingFingerprintCreateOrConnectWithoutSourceInput[]
    createMany?: ListingFingerprintCreateManySourceInputEnvelope
    connect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumCrawlStrategyFieldUpdateOperationsInput = {
    set?: $Enums.CrawlStrategy
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumSourceTrustFieldUpdateOperationsInput = {
    set?: $Enums.SourceTrust
  }

  export type EnumSourceStatusFieldUpdateOperationsInput = {
    set?: $Enums.SourceStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ExamUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput> | ExamCreateWithoutSourceInput[] | ExamUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ExamCreateOrConnectWithoutSourceInput | ExamCreateOrConnectWithoutSourceInput[]
    upsert?: ExamUpsertWithWhereUniqueWithoutSourceInput | ExamUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ExamCreateManySourceInputEnvelope
    set?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    disconnect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    delete?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    connect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    update?: ExamUpdateWithWhereUniqueWithoutSourceInput | ExamUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ExamUpdateManyWithWhereWithoutSourceInput | ExamUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ExamScalarWhereInput | ExamScalarWhereInput[]
  }

  export type ArtifactUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput> | ArtifactCreateWithoutSourceInput[] | ArtifactUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutSourceInput | ArtifactCreateOrConnectWithoutSourceInput[]
    upsert?: ArtifactUpsertWithWhereUniqueWithoutSourceInput | ArtifactUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ArtifactCreateManySourceInputEnvelope
    set?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    disconnect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    delete?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    update?: ArtifactUpdateWithWhereUniqueWithoutSourceInput | ArtifactUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ArtifactUpdateManyWithWhereWithoutSourceInput | ArtifactUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
  }

  export type SourceProposalUpdateManyWithoutSourceNestedInput = {
    create?: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput> | SourceProposalCreateWithoutSourceInput[] | SourceProposalUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: SourceProposalCreateOrConnectWithoutSourceInput | SourceProposalCreateOrConnectWithoutSourceInput[]
    upsert?: SourceProposalUpsertWithWhereUniqueWithoutSourceInput | SourceProposalUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: SourceProposalCreateManySourceInputEnvelope
    set?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    disconnect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    delete?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    connect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    update?: SourceProposalUpdateWithWhereUniqueWithoutSourceInput | SourceProposalUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: SourceProposalUpdateManyWithWhereWithoutSourceInput | SourceProposalUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: SourceProposalScalarWhereInput | SourceProposalScalarWhereInput[]
  }

  export type CrawlRunUpdateManyWithoutSourceNestedInput = {
    create?: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput> | CrawlRunCreateWithoutSourceInput[] | CrawlRunUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: CrawlRunCreateOrConnectWithoutSourceInput | CrawlRunCreateOrConnectWithoutSourceInput[]
    upsert?: CrawlRunUpsertWithWhereUniqueWithoutSourceInput | CrawlRunUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: CrawlRunCreateManySourceInputEnvelope
    set?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    disconnect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    delete?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    connect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    update?: CrawlRunUpdateWithWhereUniqueWithoutSourceInput | CrawlRunUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: CrawlRunUpdateManyWithWhereWithoutSourceInput | CrawlRunUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: CrawlRunScalarWhereInput | CrawlRunScalarWhereInput[]
  }

  export type ListingFingerprintUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput> | ListingFingerprintCreateWithoutSourceInput[] | ListingFingerprintUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ListingFingerprintCreateOrConnectWithoutSourceInput | ListingFingerprintCreateOrConnectWithoutSourceInput[]
    upsert?: ListingFingerprintUpsertWithWhereUniqueWithoutSourceInput | ListingFingerprintUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ListingFingerprintCreateManySourceInputEnvelope
    set?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    disconnect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    delete?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    connect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    update?: ListingFingerprintUpdateWithWhereUniqueWithoutSourceInput | ListingFingerprintUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ListingFingerprintUpdateManyWithWhereWithoutSourceInput | ListingFingerprintUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ListingFingerprintScalarWhereInput | ListingFingerprintScalarWhereInput[]
  }

  export type ExamUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput> | ExamCreateWithoutSourceInput[] | ExamUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ExamCreateOrConnectWithoutSourceInput | ExamCreateOrConnectWithoutSourceInput[]
    upsert?: ExamUpsertWithWhereUniqueWithoutSourceInput | ExamUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ExamCreateManySourceInputEnvelope
    set?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    disconnect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    delete?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    connect?: ExamWhereUniqueInput | ExamWhereUniqueInput[]
    update?: ExamUpdateWithWhereUniqueWithoutSourceInput | ExamUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ExamUpdateManyWithWhereWithoutSourceInput | ExamUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ExamScalarWhereInput | ExamScalarWhereInput[]
  }

  export type ArtifactUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput> | ArtifactCreateWithoutSourceInput[] | ArtifactUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutSourceInput | ArtifactCreateOrConnectWithoutSourceInput[]
    upsert?: ArtifactUpsertWithWhereUniqueWithoutSourceInput | ArtifactUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ArtifactCreateManySourceInputEnvelope
    set?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    disconnect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    delete?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    update?: ArtifactUpdateWithWhereUniqueWithoutSourceInput | ArtifactUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ArtifactUpdateManyWithWhereWithoutSourceInput | ArtifactUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
  }

  export type SourceProposalUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput> | SourceProposalCreateWithoutSourceInput[] | SourceProposalUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: SourceProposalCreateOrConnectWithoutSourceInput | SourceProposalCreateOrConnectWithoutSourceInput[]
    upsert?: SourceProposalUpsertWithWhereUniqueWithoutSourceInput | SourceProposalUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: SourceProposalCreateManySourceInputEnvelope
    set?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    disconnect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    delete?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    connect?: SourceProposalWhereUniqueInput | SourceProposalWhereUniqueInput[]
    update?: SourceProposalUpdateWithWhereUniqueWithoutSourceInput | SourceProposalUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: SourceProposalUpdateManyWithWhereWithoutSourceInput | SourceProposalUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: SourceProposalScalarWhereInput | SourceProposalScalarWhereInput[]
  }

  export type CrawlRunUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput> | CrawlRunCreateWithoutSourceInput[] | CrawlRunUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: CrawlRunCreateOrConnectWithoutSourceInput | CrawlRunCreateOrConnectWithoutSourceInput[]
    upsert?: CrawlRunUpsertWithWhereUniqueWithoutSourceInput | CrawlRunUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: CrawlRunCreateManySourceInputEnvelope
    set?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    disconnect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    delete?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    connect?: CrawlRunWhereUniqueInput | CrawlRunWhereUniqueInput[]
    update?: CrawlRunUpdateWithWhereUniqueWithoutSourceInput | CrawlRunUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: CrawlRunUpdateManyWithWhereWithoutSourceInput | CrawlRunUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: CrawlRunScalarWhereInput | CrawlRunScalarWhereInput[]
  }

  export type ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput = {
    create?: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput> | ListingFingerprintCreateWithoutSourceInput[] | ListingFingerprintUncheckedCreateWithoutSourceInput[]
    connectOrCreate?: ListingFingerprintCreateOrConnectWithoutSourceInput | ListingFingerprintCreateOrConnectWithoutSourceInput[]
    upsert?: ListingFingerprintUpsertWithWhereUniqueWithoutSourceInput | ListingFingerprintUpsertWithWhereUniqueWithoutSourceInput[]
    createMany?: ListingFingerprintCreateManySourceInputEnvelope
    set?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    disconnect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    delete?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    connect?: ListingFingerprintWhereUniqueInput | ListingFingerprintWhereUniqueInput[]
    update?: ListingFingerprintUpdateWithWhereUniqueWithoutSourceInput | ListingFingerprintUpdateWithWhereUniqueWithoutSourceInput[]
    updateMany?: ListingFingerprintUpdateManyWithWhereWithoutSourceInput | ListingFingerprintUpdateManyWithWhereWithoutSourceInput[]
    deleteMany?: ListingFingerprintScalarWhereInput | ListingFingerprintScalarWhereInput[]
  }

  export type SourceCreateNestedOneWithoutProposalsInput = {
    create?: XOR<SourceCreateWithoutProposalsInput, SourceUncheckedCreateWithoutProposalsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutProposalsInput
    connect?: SourceWhereUniqueInput
  }

  export type SourceUpdateOneWithoutProposalsNestedInput = {
    create?: XOR<SourceCreateWithoutProposalsInput, SourceUncheckedCreateWithoutProposalsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutProposalsInput
    upsert?: SourceUpsertWithoutProposalsInput
    disconnect?: SourceWhereInput | boolean
    delete?: SourceWhereInput | boolean
    connect?: SourceWhereUniqueInput
    update?: XOR<XOR<SourceUpdateToOneWithWhereWithoutProposalsInput, SourceUpdateWithoutProposalsInput>, SourceUncheckedUpdateWithoutProposalsInput>
  }

  export type SourceCreateNestedOneWithoutExamsInput = {
    create?: XOR<SourceCreateWithoutExamsInput, SourceUncheckedCreateWithoutExamsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutExamsInput
    connect?: SourceWhereUniqueInput
  }

  export type ArtifactCreateNestedManyWithoutExamInput = {
    create?: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput> | ArtifactCreateWithoutExamInput[] | ArtifactUncheckedCreateWithoutExamInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutExamInput | ArtifactCreateOrConnectWithoutExamInput[]
    createMany?: ArtifactCreateManyExamInputEnvelope
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
  }

  export type ArtifactUncheckedCreateNestedManyWithoutExamInput = {
    create?: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput> | ArtifactCreateWithoutExamInput[] | ArtifactUncheckedCreateWithoutExamInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutExamInput | ArtifactCreateOrConnectWithoutExamInput[]
    createMany?: ArtifactCreateManyExamInputEnvelope
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
  }

  export type EnumExamStatusFieldUpdateOperationsInput = {
    set?: $Enums.ExamStatus
  }

  export type SourceUpdateOneRequiredWithoutExamsNestedInput = {
    create?: XOR<SourceCreateWithoutExamsInput, SourceUncheckedCreateWithoutExamsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutExamsInput
    upsert?: SourceUpsertWithoutExamsInput
    connect?: SourceWhereUniqueInput
    update?: XOR<XOR<SourceUpdateToOneWithWhereWithoutExamsInput, SourceUpdateWithoutExamsInput>, SourceUncheckedUpdateWithoutExamsInput>
  }

  export type ArtifactUpdateManyWithoutExamNestedInput = {
    create?: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput> | ArtifactCreateWithoutExamInput[] | ArtifactUncheckedCreateWithoutExamInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutExamInput | ArtifactCreateOrConnectWithoutExamInput[]
    upsert?: ArtifactUpsertWithWhereUniqueWithoutExamInput | ArtifactUpsertWithWhereUniqueWithoutExamInput[]
    createMany?: ArtifactCreateManyExamInputEnvelope
    set?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    disconnect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    delete?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    update?: ArtifactUpdateWithWhereUniqueWithoutExamInput | ArtifactUpdateWithWhereUniqueWithoutExamInput[]
    updateMany?: ArtifactUpdateManyWithWhereWithoutExamInput | ArtifactUpdateManyWithWhereWithoutExamInput[]
    deleteMany?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
  }

  export type ArtifactUncheckedUpdateManyWithoutExamNestedInput = {
    create?: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput> | ArtifactCreateWithoutExamInput[] | ArtifactUncheckedCreateWithoutExamInput[]
    connectOrCreate?: ArtifactCreateOrConnectWithoutExamInput | ArtifactCreateOrConnectWithoutExamInput[]
    upsert?: ArtifactUpsertWithWhereUniqueWithoutExamInput | ArtifactUpsertWithWhereUniqueWithoutExamInput[]
    createMany?: ArtifactCreateManyExamInputEnvelope
    set?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    disconnect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    delete?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    connect?: ArtifactWhereUniqueInput | ArtifactWhereUniqueInput[]
    update?: ArtifactUpdateWithWhereUniqueWithoutExamInput | ArtifactUpdateWithWhereUniqueWithoutExamInput[]
    updateMany?: ArtifactUpdateManyWithWhereWithoutExamInput | ArtifactUpdateManyWithWhereWithoutExamInput[]
    deleteMany?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
  }

  export type ExamCreateNestedOneWithoutArtifactsInput = {
    create?: XOR<ExamCreateWithoutArtifactsInput, ExamUncheckedCreateWithoutArtifactsInput>
    connectOrCreate?: ExamCreateOrConnectWithoutArtifactsInput
    connect?: ExamWhereUniqueInput
  }

  export type SourceCreateNestedOneWithoutArtifactsInput = {
    create?: XOR<SourceCreateWithoutArtifactsInput, SourceUncheckedCreateWithoutArtifactsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutArtifactsInput
    connect?: SourceWhereUniqueInput
  }

  export type EnumArtifactKindFieldUpdateOperationsInput = {
    set?: $Enums.ArtifactKind
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ExamUpdateOneWithoutArtifactsNestedInput = {
    create?: XOR<ExamCreateWithoutArtifactsInput, ExamUncheckedCreateWithoutArtifactsInput>
    connectOrCreate?: ExamCreateOrConnectWithoutArtifactsInput
    upsert?: ExamUpsertWithoutArtifactsInput
    disconnect?: ExamWhereInput | boolean
    delete?: ExamWhereInput | boolean
    connect?: ExamWhereUniqueInput
    update?: XOR<XOR<ExamUpdateToOneWithWhereWithoutArtifactsInput, ExamUpdateWithoutArtifactsInput>, ExamUncheckedUpdateWithoutArtifactsInput>
  }

  export type SourceUpdateOneWithoutArtifactsNestedInput = {
    create?: XOR<SourceCreateWithoutArtifactsInput, SourceUncheckedCreateWithoutArtifactsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutArtifactsInput
    upsert?: SourceUpsertWithoutArtifactsInput
    disconnect?: SourceWhereInput | boolean
    delete?: SourceWhereInput | boolean
    connect?: SourceWhereUniqueInput
    update?: XOR<XOR<SourceUpdateToOneWithWhereWithoutArtifactsInput, SourceUpdateWithoutArtifactsInput>, SourceUncheckedUpdateWithoutArtifactsInput>
  }

  export type SourceCreateNestedOneWithoutFingerprintsInput = {
    create?: XOR<SourceCreateWithoutFingerprintsInput, SourceUncheckedCreateWithoutFingerprintsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutFingerprintsInput
    connect?: SourceWhereUniqueInput
  }

  export type SourceUpdateOneRequiredWithoutFingerprintsNestedInput = {
    create?: XOR<SourceCreateWithoutFingerprintsInput, SourceUncheckedCreateWithoutFingerprintsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutFingerprintsInput
    upsert?: SourceUpsertWithoutFingerprintsInput
    connect?: SourceWhereUniqueInput
    update?: XOR<XOR<SourceUpdateToOneWithWhereWithoutFingerprintsInput, SourceUpdateWithoutFingerprintsInput>, SourceUncheckedUpdateWithoutFingerprintsInput>
  }

  export type SourceCreateNestedOneWithoutRunsInput = {
    create?: XOR<SourceCreateWithoutRunsInput, SourceUncheckedCreateWithoutRunsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutRunsInput
    connect?: SourceWhereUniqueInput
  }

  export type EnumCrawlRunStatusFieldUpdateOperationsInput = {
    set?: $Enums.CrawlRunStatus
  }

  export type SourceUpdateOneWithoutRunsNestedInput = {
    create?: XOR<SourceCreateWithoutRunsInput, SourceUncheckedCreateWithoutRunsInput>
    connectOrCreate?: SourceCreateOrConnectWithoutRunsInput
    upsert?: SourceUpsertWithoutRunsInput
    disconnect?: SourceWhereInput | boolean
    delete?: SourceWhereInput | boolean
    connect?: SourceWhereUniqueInput
    update?: XOR<XOR<SourceUpdateToOneWithWhereWithoutRunsInput, SourceUpdateWithoutRunsInput>, SourceUncheckedUpdateWithoutRunsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumCrawlStrategyFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlStrategy | EnumCrawlStrategyFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlStrategyFilter<$PrismaModel> | $Enums.CrawlStrategy
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumSourceTrustFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceTrust | EnumSourceTrustFieldRefInput<$PrismaModel>
    in?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceTrustFilter<$PrismaModel> | $Enums.SourceTrust
  }

  export type NestedEnumSourceStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceStatus | EnumSourceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceStatusFilter<$PrismaModel> | $Enums.SourceStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumCrawlStrategyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlStrategy | EnumCrawlStrategyFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlStrategy[] | ListEnumCrawlStrategyFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlStrategyWithAggregatesFilter<$PrismaModel> | $Enums.CrawlStrategy
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrawlStrategyFilter<$PrismaModel>
    _max?: NestedEnumCrawlStrategyFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumSourceTrustWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceTrust | EnumSourceTrustFieldRefInput<$PrismaModel>
    in?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceTrust[] | ListEnumSourceTrustFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceTrustWithAggregatesFilter<$PrismaModel> | $Enums.SourceTrust
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSourceTrustFilter<$PrismaModel>
    _max?: NestedEnumSourceTrustFilter<$PrismaModel>
  }

  export type NestedEnumSourceStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SourceStatus | EnumSourceStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SourceStatus[] | ListEnumSourceStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSourceStatusWithAggregatesFilter<$PrismaModel> | $Enums.SourceStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSourceStatusFilter<$PrismaModel>
    _max?: NestedEnumSourceStatusFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumExamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamStatus | EnumExamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExamStatusFilter<$PrismaModel> | $Enums.ExamStatus
  }

  export type NestedEnumExamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamStatus | EnumExamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamStatus[] | ListEnumExamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExamStatusWithAggregatesFilter<$PrismaModel> | $Enums.ExamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExamStatusFilter<$PrismaModel>
    _max?: NestedEnumExamStatusFilter<$PrismaModel>
  }

  export type NestedEnumArtifactKindFilter<$PrismaModel = never> = {
    equals?: $Enums.ArtifactKind | EnumArtifactKindFieldRefInput<$PrismaModel>
    in?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    not?: NestedEnumArtifactKindFilter<$PrismaModel> | $Enums.ArtifactKind
  }

  export type NestedEnumArtifactKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ArtifactKind | EnumArtifactKindFieldRefInput<$PrismaModel>
    in?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.ArtifactKind[] | ListEnumArtifactKindFieldRefInput<$PrismaModel>
    not?: NestedEnumArtifactKindWithAggregatesFilter<$PrismaModel> | $Enums.ArtifactKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumArtifactKindFilter<$PrismaModel>
    _max?: NestedEnumArtifactKindFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumCrawlRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlRunStatus | EnumCrawlRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlRunStatusFilter<$PrismaModel> | $Enums.CrawlRunStatus
  }

  export type NestedEnumCrawlRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrawlRunStatus | EnumCrawlRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrawlRunStatus[] | ListEnumCrawlRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrawlRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrawlRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrawlRunStatusFilter<$PrismaModel>
    _max?: NestedEnumCrawlRunStatusFilter<$PrismaModel>
  }

  export type ExamCreateWithoutSourceInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
    artifacts?: ArtifactCreateNestedManyWithoutExamInput
  }

  export type ExamUncheckedCreateWithoutSourceInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutExamInput
  }

  export type ExamCreateOrConnectWithoutSourceInput = {
    where: ExamWhereUniqueInput
    create: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput>
  }

  export type ExamCreateManySourceInputEnvelope = {
    data: ExamCreateManySourceInput | ExamCreateManySourceInput[]
    skipDuplicates?: boolean
  }

  export type ArtifactCreateWithoutSourceInput = {
    id?: string
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
    exam?: ExamCreateNestedOneWithoutArtifactsInput
  }

  export type ArtifactUncheckedCreateWithoutSourceInput = {
    id?: string
    examId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type ArtifactCreateOrConnectWithoutSourceInput = {
    where: ArtifactWhereUniqueInput
    create: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput>
  }

  export type ArtifactCreateManySourceInputEnvelope = {
    data: ArtifactCreateManySourceInput | ArtifactCreateManySourceInput[]
    skipDuplicates?: boolean
  }

  export type SourceProposalCreateWithoutSourceInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
  }

  export type SourceProposalUncheckedCreateWithoutSourceInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
  }

  export type SourceProposalCreateOrConnectWithoutSourceInput = {
    where: SourceProposalWhereUniqueInput
    create: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput>
  }

  export type SourceProposalCreateManySourceInputEnvelope = {
    data: SourceProposalCreateManySourceInput | SourceProposalCreateManySourceInput[]
    skipDuplicates?: boolean
  }

  export type CrawlRunCreateWithoutSourceInput = {
    id: string
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUncheckedCreateWithoutSourceInput = {
    id: string
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunCreateOrConnectWithoutSourceInput = {
    where: CrawlRunWhereUniqueInput
    create: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput>
  }

  export type CrawlRunCreateManySourceInputEnvelope = {
    data: CrawlRunCreateManySourceInput | CrawlRunCreateManySourceInput[]
    skipDuplicates?: boolean
  }

  export type ListingFingerprintCreateWithoutSourceInput = {
    id?: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
  }

  export type ListingFingerprintUncheckedCreateWithoutSourceInput = {
    id?: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
  }

  export type ListingFingerprintCreateOrConnectWithoutSourceInput = {
    where: ListingFingerprintWhereUniqueInput
    create: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput>
  }

  export type ListingFingerprintCreateManySourceInputEnvelope = {
    data: ListingFingerprintCreateManySourceInput | ListingFingerprintCreateManySourceInput[]
    skipDuplicates?: boolean
  }

  export type ExamUpsertWithWhereUniqueWithoutSourceInput = {
    where: ExamWhereUniqueInput
    update: XOR<ExamUpdateWithoutSourceInput, ExamUncheckedUpdateWithoutSourceInput>
    create: XOR<ExamCreateWithoutSourceInput, ExamUncheckedCreateWithoutSourceInput>
  }

  export type ExamUpdateWithWhereUniqueWithoutSourceInput = {
    where: ExamWhereUniqueInput
    data: XOR<ExamUpdateWithoutSourceInput, ExamUncheckedUpdateWithoutSourceInput>
  }

  export type ExamUpdateManyWithWhereWithoutSourceInput = {
    where: ExamScalarWhereInput
    data: XOR<ExamUpdateManyMutationInput, ExamUncheckedUpdateManyWithoutSourceInput>
  }

  export type ExamScalarWhereInput = {
    AND?: ExamScalarWhereInput | ExamScalarWhereInput[]
    OR?: ExamScalarWhereInput[]
    NOT?: ExamScalarWhereInput | ExamScalarWhereInput[]
    id?: StringFilter<"Exam"> | string
    examSlug?: StringFilter<"Exam"> | string
    title?: StringFilter<"Exam"> | string
    org?: StringNullableFilter<"Exam"> | string | null
    banca?: StringNullableFilter<"Exam"> | string | null
    emphasis?: JsonFilter<"Exam">
    editalUrl?: StringNullableFilter<"Exam"> | string | null
    listingUrl?: StringFilter<"Exam"> | string
    status?: EnumExamStatusFilter<"Exam"> | $Enums.ExamStatus
    sourceId?: StringFilter<"Exam"> | string
    sourceDomain?: StringFilter<"Exam"> | string
    discoveredAt?: DateTimeFilter<"Exam"> | Date | string
    lastSeenAt?: DateTimeFilter<"Exam"> | Date | string
  }

  export type ArtifactUpsertWithWhereUniqueWithoutSourceInput = {
    where: ArtifactWhereUniqueInput
    update: XOR<ArtifactUpdateWithoutSourceInput, ArtifactUncheckedUpdateWithoutSourceInput>
    create: XOR<ArtifactCreateWithoutSourceInput, ArtifactUncheckedCreateWithoutSourceInput>
  }

  export type ArtifactUpdateWithWhereUniqueWithoutSourceInput = {
    where: ArtifactWhereUniqueInput
    data: XOR<ArtifactUpdateWithoutSourceInput, ArtifactUncheckedUpdateWithoutSourceInput>
  }

  export type ArtifactUpdateManyWithWhereWithoutSourceInput = {
    where: ArtifactScalarWhereInput
    data: XOR<ArtifactUpdateManyMutationInput, ArtifactUncheckedUpdateManyWithoutSourceInput>
  }

  export type ArtifactScalarWhereInput = {
    AND?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
    OR?: ArtifactScalarWhereInput[]
    NOT?: ArtifactScalarWhereInput | ArtifactScalarWhereInput[]
    id?: StringFilter<"Artifact"> | string
    examId?: StringNullableFilter<"Artifact"> | string | null
    sourceId?: StringNullableFilter<"Artifact"> | string | null
    kind?: EnumArtifactKindFilter<"Artifact"> | $Enums.ArtifactKind
    url?: StringNullableFilter<"Artifact"> | string | null
    storageKey?: StringNullableFilter<"Artifact"> | string | null
    checksum?: StringNullableFilter<"Artifact"> | string | null
    contentType?: StringNullableFilter<"Artifact"> | string | null
    byteSize?: IntNullableFilter<"Artifact"> | number | null
    fetchedAt?: DateTimeFilter<"Artifact"> | Date | string
    published?: BoolFilter<"Artifact"> | boolean
  }

  export type SourceProposalUpsertWithWhereUniqueWithoutSourceInput = {
    where: SourceProposalWhereUniqueInput
    update: XOR<SourceProposalUpdateWithoutSourceInput, SourceProposalUncheckedUpdateWithoutSourceInput>
    create: XOR<SourceProposalCreateWithoutSourceInput, SourceProposalUncheckedCreateWithoutSourceInput>
  }

  export type SourceProposalUpdateWithWhereUniqueWithoutSourceInput = {
    where: SourceProposalWhereUniqueInput
    data: XOR<SourceProposalUpdateWithoutSourceInput, SourceProposalUncheckedUpdateWithoutSourceInput>
  }

  export type SourceProposalUpdateManyWithWhereWithoutSourceInput = {
    where: SourceProposalScalarWhereInput
    data: XOR<SourceProposalUpdateManyMutationInput, SourceProposalUncheckedUpdateManyWithoutSourceInput>
  }

  export type SourceProposalScalarWhereInput = {
    AND?: SourceProposalScalarWhereInput | SourceProposalScalarWhereInput[]
    OR?: SourceProposalScalarWhereInput[]
    NOT?: SourceProposalScalarWhereInput | SourceProposalScalarWhereInput[]
    id?: StringFilter<"SourceProposal"> | string
    domain?: StringFilter<"SourceProposal"> | string
    name?: StringFilter<"SourceProposal"> | string
    startUrls?: JsonFilter<"SourceProposal">
    reason?: StringNullableFilter<"SourceProposal"> | string | null
    status?: EnumSourceStatusFilter<"SourceProposal"> | $Enums.SourceStatus
    sourceId?: StringNullableFilter<"SourceProposal"> | string | null
    createdAt?: DateTimeFilter<"SourceProposal"> | Date | string
    reviewedAt?: DateTimeNullableFilter<"SourceProposal"> | Date | string | null
  }

  export type CrawlRunUpsertWithWhereUniqueWithoutSourceInput = {
    where: CrawlRunWhereUniqueInput
    update: XOR<CrawlRunUpdateWithoutSourceInput, CrawlRunUncheckedUpdateWithoutSourceInput>
    create: XOR<CrawlRunCreateWithoutSourceInput, CrawlRunUncheckedCreateWithoutSourceInput>
  }

  export type CrawlRunUpdateWithWhereUniqueWithoutSourceInput = {
    where: CrawlRunWhereUniqueInput
    data: XOR<CrawlRunUpdateWithoutSourceInput, CrawlRunUncheckedUpdateWithoutSourceInput>
  }

  export type CrawlRunUpdateManyWithWhereWithoutSourceInput = {
    where: CrawlRunScalarWhereInput
    data: XOR<CrawlRunUpdateManyMutationInput, CrawlRunUncheckedUpdateManyWithoutSourceInput>
  }

  export type CrawlRunScalarWhereInput = {
    AND?: CrawlRunScalarWhereInput | CrawlRunScalarWhereInput[]
    OR?: CrawlRunScalarWhereInput[]
    NOT?: CrawlRunScalarWhereInput | CrawlRunScalarWhereInput[]
    id?: StringFilter<"CrawlRun"> | string
    sourceId?: StringNullableFilter<"CrawlRun"> | string | null
    startedAt?: DateTimeFilter<"CrawlRun"> | Date | string
    finishedAt?: DateTimeNullableFilter<"CrawlRun"> | Date | string | null
    status?: EnumCrawlRunStatusFilter<"CrawlRun"> | $Enums.CrawlRunStatus
    sourcesOk?: IntFilter<"CrawlRun"> | number
    sourcesFailed?: IntFilter<"CrawlRun"> | number
    openDiscovered?: IntFilter<"CrawlRun"> | number
    proposedSources?: IntFilter<"CrawlRun"> | number
    errors?: JsonFilter<"CrawlRun">
  }

  export type ListingFingerprintUpsertWithWhereUniqueWithoutSourceInput = {
    where: ListingFingerprintWhereUniqueInput
    update: XOR<ListingFingerprintUpdateWithoutSourceInput, ListingFingerprintUncheckedUpdateWithoutSourceInput>
    create: XOR<ListingFingerprintCreateWithoutSourceInput, ListingFingerprintUncheckedCreateWithoutSourceInput>
  }

  export type ListingFingerprintUpdateWithWhereUniqueWithoutSourceInput = {
    where: ListingFingerprintWhereUniqueInput
    data: XOR<ListingFingerprintUpdateWithoutSourceInput, ListingFingerprintUncheckedUpdateWithoutSourceInput>
  }

  export type ListingFingerprintUpdateManyWithWhereWithoutSourceInput = {
    where: ListingFingerprintScalarWhereInput
    data: XOR<ListingFingerprintUpdateManyMutationInput, ListingFingerprintUncheckedUpdateManyWithoutSourceInput>
  }

  export type ListingFingerprintScalarWhereInput = {
    AND?: ListingFingerprintScalarWhereInput | ListingFingerprintScalarWhereInput[]
    OR?: ListingFingerprintScalarWhereInput[]
    NOT?: ListingFingerprintScalarWhereInput | ListingFingerprintScalarWhereInput[]
    id?: StringFilter<"ListingFingerprint"> | string
    sourceId?: StringFilter<"ListingFingerprint"> | string
    startUrl?: StringFilter<"ListingFingerprint"> | string
    fingerprint?: StringFilter<"ListingFingerprint"> | string
    listingCount?: IntFilter<"ListingFingerprint"> | number
    seenAt?: DateTimeFilter<"ListingFingerprint"> | Date | string
  }

  export type SourceCreateWithoutProposalsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactCreateNestedManyWithoutSourceInput
    runs?: CrawlRunCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateWithoutProposalsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamUncheckedCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutSourceInput
    runs?: CrawlRunUncheckedCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceCreateOrConnectWithoutProposalsInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutProposalsInput, SourceUncheckedCreateWithoutProposalsInput>
  }

  export type SourceUpsertWithoutProposalsInput = {
    update: XOR<SourceUpdateWithoutProposalsInput, SourceUncheckedUpdateWithoutProposalsInput>
    create: XOR<SourceCreateWithoutProposalsInput, SourceUncheckedCreateWithoutProposalsInput>
    where?: SourceWhereInput
  }

  export type SourceUpdateToOneWithWhereWithoutProposalsInput = {
    where?: SourceWhereInput
    data: XOR<SourceUpdateWithoutProposalsInput, SourceUncheckedUpdateWithoutProposalsInput>
  }

  export type SourceUpdateWithoutProposalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateWithoutProposalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUncheckedUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUncheckedUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUncheckedUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type SourceCreateWithoutExamsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    artifacts?: ArtifactCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalCreateNestedManyWithoutSourceInput
    runs?: CrawlRunCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateWithoutExamsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalUncheckedCreateNestedManyWithoutSourceInput
    runs?: CrawlRunUncheckedCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceCreateOrConnectWithoutExamsInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutExamsInput, SourceUncheckedCreateWithoutExamsInput>
  }

  export type ArtifactCreateWithoutExamInput = {
    id?: string
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
    source?: SourceCreateNestedOneWithoutArtifactsInput
  }

  export type ArtifactUncheckedCreateWithoutExamInput = {
    id?: string
    sourceId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type ArtifactCreateOrConnectWithoutExamInput = {
    where: ArtifactWhereUniqueInput
    create: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput>
  }

  export type ArtifactCreateManyExamInputEnvelope = {
    data: ArtifactCreateManyExamInput | ArtifactCreateManyExamInput[]
    skipDuplicates?: boolean
  }

  export type SourceUpsertWithoutExamsInput = {
    update: XOR<SourceUpdateWithoutExamsInput, SourceUncheckedUpdateWithoutExamsInput>
    create: XOR<SourceCreateWithoutExamsInput, SourceUncheckedCreateWithoutExamsInput>
    where?: SourceWhereInput
  }

  export type SourceUpdateToOneWithWhereWithoutExamsInput = {
    where?: SourceWhereInput
    data: XOR<SourceUpdateWithoutExamsInput, SourceUncheckedUpdateWithoutExamsInput>
  }

  export type SourceUpdateWithoutExamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artifacts?: ArtifactUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateWithoutExamsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artifacts?: ArtifactUncheckedUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUncheckedUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUncheckedUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type ArtifactUpsertWithWhereUniqueWithoutExamInput = {
    where: ArtifactWhereUniqueInput
    update: XOR<ArtifactUpdateWithoutExamInput, ArtifactUncheckedUpdateWithoutExamInput>
    create: XOR<ArtifactCreateWithoutExamInput, ArtifactUncheckedCreateWithoutExamInput>
  }

  export type ArtifactUpdateWithWhereUniqueWithoutExamInput = {
    where: ArtifactWhereUniqueInput
    data: XOR<ArtifactUpdateWithoutExamInput, ArtifactUncheckedUpdateWithoutExamInput>
  }

  export type ArtifactUpdateManyWithWhereWithoutExamInput = {
    where: ArtifactScalarWhereInput
    data: XOR<ArtifactUpdateManyMutationInput, ArtifactUncheckedUpdateManyWithoutExamInput>
  }

  export type ExamCreateWithoutArtifactsInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
    source: SourceCreateNestedOneWithoutExamsInput
  }

  export type ExamUncheckedCreateWithoutArtifactsInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceId: string
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
  }

  export type ExamCreateOrConnectWithoutArtifactsInput = {
    where: ExamWhereUniqueInput
    create: XOR<ExamCreateWithoutArtifactsInput, ExamUncheckedCreateWithoutArtifactsInput>
  }

  export type SourceCreateWithoutArtifactsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalCreateNestedManyWithoutSourceInput
    runs?: CrawlRunCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateWithoutArtifactsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamUncheckedCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalUncheckedCreateNestedManyWithoutSourceInput
    runs?: CrawlRunUncheckedCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceCreateOrConnectWithoutArtifactsInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutArtifactsInput, SourceUncheckedCreateWithoutArtifactsInput>
  }

  export type ExamUpsertWithoutArtifactsInput = {
    update: XOR<ExamUpdateWithoutArtifactsInput, ExamUncheckedUpdateWithoutArtifactsInput>
    create: XOR<ExamCreateWithoutArtifactsInput, ExamUncheckedCreateWithoutArtifactsInput>
    where?: ExamWhereInput
  }

  export type ExamUpdateToOneWithWhereWithoutArtifactsInput = {
    where?: ExamWhereInput
    data: XOR<ExamUpdateWithoutArtifactsInput, ExamUncheckedUpdateWithoutArtifactsInput>
  }

  export type ExamUpdateWithoutArtifactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: SourceUpdateOneRequiredWithoutExamsNestedInput
  }

  export type ExamUncheckedUpdateWithoutArtifactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SourceUpsertWithoutArtifactsInput = {
    update: XOR<SourceUpdateWithoutArtifactsInput, SourceUncheckedUpdateWithoutArtifactsInput>
    create: XOR<SourceCreateWithoutArtifactsInput, SourceUncheckedCreateWithoutArtifactsInput>
    where?: SourceWhereInput
  }

  export type SourceUpdateToOneWithWhereWithoutArtifactsInput = {
    where?: SourceWhereInput
    data: XOR<SourceUpdateWithoutArtifactsInput, SourceUncheckedUpdateWithoutArtifactsInput>
  }

  export type SourceUpdateWithoutArtifactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateWithoutArtifactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUncheckedUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUncheckedUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUncheckedUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type SourceCreateWithoutFingerprintsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalCreateNestedManyWithoutSourceInput
    runs?: CrawlRunCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateWithoutFingerprintsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamUncheckedCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalUncheckedCreateNestedManyWithoutSourceInput
    runs?: CrawlRunUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceCreateOrConnectWithoutFingerprintsInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutFingerprintsInput, SourceUncheckedCreateWithoutFingerprintsInput>
  }

  export type SourceUpsertWithoutFingerprintsInput = {
    update: XOR<SourceUpdateWithoutFingerprintsInput, SourceUncheckedUpdateWithoutFingerprintsInput>
    create: XOR<SourceCreateWithoutFingerprintsInput, SourceUncheckedCreateWithoutFingerprintsInput>
    where?: SourceWhereInput
  }

  export type SourceUpdateToOneWithWhereWithoutFingerprintsInput = {
    where?: SourceWhereInput
    data: XOR<SourceUpdateWithoutFingerprintsInput, SourceUncheckedUpdateWithoutFingerprintsInput>
  }

  export type SourceUpdateWithoutFingerprintsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateWithoutFingerprintsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUncheckedUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUncheckedUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUncheckedUpdateManyWithoutSourceNestedInput
    runs?: CrawlRunUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type SourceCreateWithoutRunsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintCreateNestedManyWithoutSourceInput
  }

  export type SourceUncheckedCreateWithoutRunsInput = {
    id: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    strategy?: $Enums.CrawlStrategy
    linkSelector?: string | null
    linkPatterns: JsonNullValueInput | InputJsonValue
    openPatterns: JsonNullValueInput | InputJsonValue
    trust?: $Enums.SourceTrust
    status?: $Enums.SourceStatus
    enabled?: boolean
    intervalSec?: number
    politenessMs?: number
    failCount?: number
    lastOkAt?: Date | string | null
    lastError?: string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    exams?: ExamUncheckedCreateNestedManyWithoutSourceInput
    artifacts?: ArtifactUncheckedCreateNestedManyWithoutSourceInput
    proposals?: SourceProposalUncheckedCreateNestedManyWithoutSourceInput
    fingerprints?: ListingFingerprintUncheckedCreateNestedManyWithoutSourceInput
  }

  export type SourceCreateOrConnectWithoutRunsInput = {
    where: SourceWhereUniqueInput
    create: XOR<SourceCreateWithoutRunsInput, SourceUncheckedCreateWithoutRunsInput>
  }

  export type SourceUpsertWithoutRunsInput = {
    update: XOR<SourceUpdateWithoutRunsInput, SourceUncheckedUpdateWithoutRunsInput>
    create: XOR<SourceCreateWithoutRunsInput, SourceUncheckedCreateWithoutRunsInput>
    where?: SourceWhereInput
  }

  export type SourceUpdateToOneWithWhereWithoutRunsInput = {
    where?: SourceWhereInput
    data: XOR<SourceUpdateWithoutRunsInput, SourceUncheckedUpdateWithoutRunsInput>
  }

  export type SourceUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUpdateManyWithoutSourceNestedInput
  }

  export type SourceUncheckedUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    strategy?: EnumCrawlStrategyFieldUpdateOperationsInput | $Enums.CrawlStrategy
    linkSelector?: NullableStringFieldUpdateOperationsInput | string | null
    linkPatterns?: JsonNullValueInput | InputJsonValue
    openPatterns?: JsonNullValueInput | InputJsonValue
    trust?: EnumSourceTrustFieldUpdateOperationsInput | $Enums.SourceTrust
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    enabled?: BoolFieldUpdateOperationsInput | boolean
    intervalSec?: IntFieldUpdateOperationsInput | number
    politenessMs?: IntFieldUpdateOperationsInput | number
    failCount?: IntFieldUpdateOperationsInput | number
    lastOkAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    exams?: ExamUncheckedUpdateManyWithoutSourceNestedInput
    artifacts?: ArtifactUncheckedUpdateManyWithoutSourceNestedInput
    proposals?: SourceProposalUncheckedUpdateManyWithoutSourceNestedInput
    fingerprints?: ListingFingerprintUncheckedUpdateManyWithoutSourceNestedInput
  }

  export type ExamCreateManySourceInput = {
    id: string
    examSlug: string
    title: string
    org?: string | null
    banca?: string | null
    emphasis: JsonNullValueInput | InputJsonValue
    editalUrl?: string | null
    listingUrl: string
    status?: $Enums.ExamStatus
    sourceDomain: string
    discoveredAt?: Date | string
    lastSeenAt?: Date | string
  }

  export type ArtifactCreateManySourceInput = {
    id?: string
    examId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type SourceProposalCreateManySourceInput = {
    id?: string
    domain: string
    name: string
    startUrls: JsonNullValueInput | InputJsonValue
    reason?: string | null
    status?: $Enums.SourceStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
  }

  export type CrawlRunCreateManySourceInput = {
    id: string
    startedAt: Date | string
    finishedAt?: Date | string | null
    status?: $Enums.CrawlRunStatus
    sourcesOk?: number
    sourcesFailed?: number
    openDiscovered?: number
    proposedSources?: number
    errors: JsonNullValueInput | InputJsonValue
  }

  export type ListingFingerprintCreateManySourceInput = {
    id?: string
    startUrl: string
    fingerprint: string
    listingCount?: number
    seenAt?: Date | string
  }

  export type ExamUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artifacts?: ArtifactUpdateManyWithoutExamNestedInput
  }

  export type ExamUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    artifacts?: ArtifactUncheckedUpdateManyWithoutExamNestedInput
  }

  export type ExamUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    org?: NullableStringFieldUpdateOperationsInput | string | null
    banca?: NullableStringFieldUpdateOperationsInput | string | null
    emphasis?: JsonNullValueInput | InputJsonValue
    editalUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listingUrl?: StringFieldUpdateOperationsInput | string
    status?: EnumExamStatusFieldUpdateOperationsInput | $Enums.ExamStatus
    sourceDomain?: StringFieldUpdateOperationsInput | string
    discoveredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtifactUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
    exam?: ExamUpdateOneWithoutArtifactsNestedInput
  }

  export type ArtifactUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    examId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ArtifactUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    examId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type SourceProposalUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SourceProposalUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type SourceProposalUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    domain?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    startUrls?: JsonNullValueInput | InputJsonValue
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSourceStatusFieldUpdateOperationsInput | $Enums.SourceStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CrawlRunUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type CrawlRunUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: EnumCrawlRunStatusFieldUpdateOperationsInput | $Enums.CrawlRunStatus
    sourcesOk?: IntFieldUpdateOperationsInput | number
    sourcesFailed?: IntFieldUpdateOperationsInput | number
    openDiscovered?: IntFieldUpdateOperationsInput | number
    proposedSources?: IntFieldUpdateOperationsInput | number
    errors?: JsonNullValueInput | InputJsonValue
  }

  export type ListingFingerprintUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingFingerprintUncheckedUpdateWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingFingerprintUncheckedUpdateManyWithoutSourceInput = {
    id?: StringFieldUpdateOperationsInput | string
    startUrl?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    listingCount?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ArtifactCreateManyExamInput = {
    id?: string
    sourceId?: string | null
    kind: $Enums.ArtifactKind
    url?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    byteSize?: number | null
    fetchedAt?: Date | string
    published?: boolean
  }

  export type ArtifactUpdateWithoutExamInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
    source?: SourceUpdateOneWithoutArtifactsNestedInput
  }

  export type ArtifactUncheckedUpdateWithoutExamInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ArtifactUncheckedUpdateManyWithoutExamInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumArtifactKindFieldUpdateOperationsInput | $Enums.ArtifactKind
    url?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    byteSize?: NullableIntFieldUpdateOperationsInput | number | null
    fetchedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    published?: BoolFieldUpdateOperationsInput | boolean
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}