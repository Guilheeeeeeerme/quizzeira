
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
 * Model Document
 * A source PDF/HTML pulled from Discovery's Document store. `discoveryArtifactId`
 * is the join key back to quizzeira_discovery — the databases stay separate.
 */
export type Document = $Result.DefaultSelection<Prisma.$DocumentPayload>
/**
 * Model Chunk
 * Chunked plain text plus its embedding. Retrieval over these chunks is what
 * grounds generation — the study runtime never touches them.
 */
export type Chunk = $Result.DefaultSelection<Prisma.$ChunkPayload>
/**
 * Model QuestionItem
 * The canonical question row. Lifecycle: draft → (Eval) → published | failed,
 * with needs_review parking borderline items in the HITL queue.
 */
export type QuestionItem = $Result.DefaultSelection<Prisma.$QuestionItemPayload>
/**
 * Model GenerationRun
 * One Generation pass for an exam/subject pair. Keeps cost and yield visible.
 */
export type GenerationRun = $Result.DefaultSelection<Prisma.$GenerationRunPayload>
/**
 * Model QualityReview
 * Audit trail for the Eval stage. One row per structural+judge verdict, so a
 * publish decision is always explainable after the fact.
 */
export type QualityReview = $Result.DefaultSelection<Prisma.$QualityReviewPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ExtractionStatus: {
  pending: 'pending',
  extracting: 'extracting',
  extracted: 'extracted',
  failed: 'failed'
};

export type ExtractionStatus = (typeof ExtractionStatus)[keyof typeof ExtractionStatus]


export const DocumentKind: {
  edital: 'edital',
  prova: 'prova',
  gabarito: 'gabarito',
  programa: 'programa',
  other: 'other'
};

export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind]


export const QuestionItemStatus: {
  draft: 'draft',
  needs_review: 'needs_review',
  published: 'published',
  failed: 'failed'
};

export type QuestionItemStatus = (typeof QuestionItemStatus)[keyof typeof QuestionItemStatus]


export const QuestionItemOrigin: {
  extraction: 'extraction',
  generation: 'generation'
};

export type QuestionItemOrigin = (typeof QuestionItemOrigin)[keyof typeof QuestionItemOrigin]


export const QuestionItemType: {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  OPEN: 'OPEN'
};

export type QuestionItemType = (typeof QuestionItemType)[keyof typeof QuestionItemType]


export const GenerationRunStatus: {
  queued: 'queued',
  running: 'running',
  ok: 'ok',
  partial: 'partial',
  failed: 'failed'
};

export type GenerationRunStatus = (typeof GenerationRunStatus)[keyof typeof GenerationRunStatus]

}

export type ExtractionStatus = $Enums.ExtractionStatus

export const ExtractionStatus: typeof $Enums.ExtractionStatus

export type DocumentKind = $Enums.DocumentKind

export const DocumentKind: typeof $Enums.DocumentKind

export type QuestionItemStatus = $Enums.QuestionItemStatus

export const QuestionItemStatus: typeof $Enums.QuestionItemStatus

export type QuestionItemOrigin = $Enums.QuestionItemOrigin

export const QuestionItemOrigin: typeof $Enums.QuestionItemOrigin

export type QuestionItemType = $Enums.QuestionItemType

export const QuestionItemType: typeof $Enums.QuestionItemType

export type GenerationRunStatus = $Enums.GenerationRunStatus

export const GenerationRunStatus: typeof $Enums.GenerationRunStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Documents
 * const documents = await prisma.document.findMany()
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
   * // Fetch zero or more Documents
   * const documents = await prisma.document.findMany()
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
   * `prisma.document`: Exposes CRUD operations for the **Document** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Documents
    * const documents = await prisma.document.findMany()
    * ```
    */
  get document(): Prisma.DocumentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chunk`: Exposes CRUD operations for the **Chunk** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Chunks
    * const chunks = await prisma.chunk.findMany()
    * ```
    */
  get chunk(): Prisma.ChunkDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.questionItem`: Exposes CRUD operations for the **QuestionItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuestionItems
    * const questionItems = await prisma.questionItem.findMany()
    * ```
    */
  get questionItem(): Prisma.QuestionItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.generationRun`: Exposes CRUD operations for the **GenerationRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GenerationRuns
    * const generationRuns = await prisma.generationRun.findMany()
    * ```
    */
  get generationRun(): Prisma.GenerationRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.qualityReview`: Exposes CRUD operations for the **QualityReview** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QualityReviews
    * const qualityReviews = await prisma.qualityReview.findMany()
    * ```
    */
  get qualityReview(): Prisma.QualityReviewDelegate<ExtArgs, ClientOptions>;
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
    Document: 'Document',
    Chunk: 'Chunk',
    QuestionItem: 'QuestionItem',
    GenerationRun: 'GenerationRun',
    QualityReview: 'QualityReview'
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
      modelProps: "document" | "chunk" | "questionItem" | "generationRun" | "qualityReview"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Document: {
        payload: Prisma.$DocumentPayload<ExtArgs>
        fields: Prisma.DocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findFirst: {
            args: Prisma.DocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findMany: {
            args: Prisma.DocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          create: {
            args: Prisma.DocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          createMany: {
            args: Prisma.DocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          delete: {
            args: Prisma.DocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          update: {
            args: Prisma.DocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          deleteMany: {
            args: Prisma.DocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          upsert: {
            args: Prisma.DocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          aggregate: {
            args: Prisma.DocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDocument>
          }
          groupBy: {
            args: Prisma.DocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<DocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.DocumentCountArgs<ExtArgs>
            result: $Utils.Optional<DocumentCountAggregateOutputType> | number
          }
        }
      }
      Chunk: {
        payload: Prisma.$ChunkPayload<ExtArgs>
        fields: Prisma.ChunkFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChunkFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChunkFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          findFirst: {
            args: Prisma.ChunkFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChunkFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          findMany: {
            args: Prisma.ChunkFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>[]
          }
          create: {
            args: Prisma.ChunkCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          createMany: {
            args: Prisma.ChunkCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChunkCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>[]
          }
          delete: {
            args: Prisma.ChunkDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          update: {
            args: Prisma.ChunkUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          deleteMany: {
            args: Prisma.ChunkDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChunkUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChunkUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>[]
          }
          upsert: {
            args: Prisma.ChunkUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChunkPayload>
          }
          aggregate: {
            args: Prisma.ChunkAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChunk>
          }
          groupBy: {
            args: Prisma.ChunkGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChunkGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChunkCountArgs<ExtArgs>
            result: $Utils.Optional<ChunkCountAggregateOutputType> | number
          }
        }
      }
      QuestionItem: {
        payload: Prisma.$QuestionItemPayload<ExtArgs>
        fields: Prisma.QuestionItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuestionItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuestionItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          findFirst: {
            args: Prisma.QuestionItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuestionItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          findMany: {
            args: Prisma.QuestionItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>[]
          }
          create: {
            args: Prisma.QuestionItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          createMany: {
            args: Prisma.QuestionItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuestionItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>[]
          }
          delete: {
            args: Prisma.QuestionItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          update: {
            args: Prisma.QuestionItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          deleteMany: {
            args: Prisma.QuestionItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuestionItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuestionItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>[]
          }
          upsert: {
            args: Prisma.QuestionItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuestionItemPayload>
          }
          aggregate: {
            args: Prisma.QuestionItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuestionItem>
          }
          groupBy: {
            args: Prisma.QuestionItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuestionItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuestionItemCountArgs<ExtArgs>
            result: $Utils.Optional<QuestionItemCountAggregateOutputType> | number
          }
        }
      }
      GenerationRun: {
        payload: Prisma.$GenerationRunPayload<ExtArgs>
        fields: Prisma.GenerationRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GenerationRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GenerationRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          findFirst: {
            args: Prisma.GenerationRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GenerationRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          findMany: {
            args: Prisma.GenerationRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>[]
          }
          create: {
            args: Prisma.GenerationRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          createMany: {
            args: Prisma.GenerationRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GenerationRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>[]
          }
          delete: {
            args: Prisma.GenerationRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          update: {
            args: Prisma.GenerationRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          deleteMany: {
            args: Prisma.GenerationRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GenerationRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GenerationRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>[]
          }
          upsert: {
            args: Prisma.GenerationRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenerationRunPayload>
          }
          aggregate: {
            args: Prisma.GenerationRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGenerationRun>
          }
          groupBy: {
            args: Prisma.GenerationRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<GenerationRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.GenerationRunCountArgs<ExtArgs>
            result: $Utils.Optional<GenerationRunCountAggregateOutputType> | number
          }
        }
      }
      QualityReview: {
        payload: Prisma.$QualityReviewPayload<ExtArgs>
        fields: Prisma.QualityReviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QualityReviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QualityReviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          findFirst: {
            args: Prisma.QualityReviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QualityReviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          findMany: {
            args: Prisma.QualityReviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>[]
          }
          create: {
            args: Prisma.QualityReviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          createMany: {
            args: Prisma.QualityReviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QualityReviewCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>[]
          }
          delete: {
            args: Prisma.QualityReviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          update: {
            args: Prisma.QualityReviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          deleteMany: {
            args: Prisma.QualityReviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QualityReviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QualityReviewUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>[]
          }
          upsert: {
            args: Prisma.QualityReviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QualityReviewPayload>
          }
          aggregate: {
            args: Prisma.QualityReviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQualityReview>
          }
          groupBy: {
            args: Prisma.QualityReviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<QualityReviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.QualityReviewCountArgs<ExtArgs>
            result: $Utils.Optional<QualityReviewCountAggregateOutputType> | number
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
    document?: DocumentOmit
    chunk?: ChunkOmit
    questionItem?: QuestionItemOmit
    generationRun?: GenerationRunOmit
    qualityReview?: QualityReviewOmit
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
   * Count Type DocumentCountOutputType
   */

  export type DocumentCountOutputType = {
    chunks: number
    questionItems: number
  }

  export type DocumentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chunks?: boolean | DocumentCountOutputTypeCountChunksArgs
    questionItems?: boolean | DocumentCountOutputTypeCountQuestionItemsArgs
  }

  // Custom InputTypes
  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DocumentCountOutputType
     */
    select?: DocumentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeCountChunksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChunkWhereInput
  }

  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeCountQuestionItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionItemWhereInput
  }


  /**
   * Count Type QuestionItemCountOutputType
   */

  export type QuestionItemCountOutputType = {
    reviews: number
  }

  export type QuestionItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    reviews?: boolean | QuestionItemCountOutputTypeCountReviewsArgs
  }

  // Custom InputTypes
  /**
   * QuestionItemCountOutputType without action
   */
  export type QuestionItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItemCountOutputType
     */
    select?: QuestionItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuestionItemCountOutputType without action
   */
  export type QuestionItemCountOutputTypeCountReviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QualityReviewWhereInput
  }


  /**
   * Count Type GenerationRunCountOutputType
   */

  export type GenerationRunCountOutputType = {
    questionItems: number
  }

  export type GenerationRunCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questionItems?: boolean | GenerationRunCountOutputTypeCountQuestionItemsArgs
  }

  // Custom InputTypes
  /**
   * GenerationRunCountOutputType without action
   */
  export type GenerationRunCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRunCountOutputType
     */
    select?: GenerationRunCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GenerationRunCountOutputType without action
   */
  export type GenerationRunCountOutputTypeCountQuestionItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionItemWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Document
   */

  export type AggregateDocument = {
    _count: DocumentCountAggregateOutputType | null
    _avg: DocumentAvgAggregateOutputType | null
    _sum: DocumentSumAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  export type DocumentAvgAggregateOutputType = {
    attempts: number | null
  }

  export type DocumentSumAggregateOutputType = {
    attempts: number | null
  }

  export type DocumentMinAggregateOutputType = {
    id: string | null
    discoveryArtifactId: string | null
    examSlug: string | null
    examTitle: string | null
    kind: $Enums.DocumentKind | null
    sourceUrl: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    status: $Enums.ExtractionStatus | null
    failReason: string | null
    attempts: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DocumentMaxAggregateOutputType = {
    id: string | null
    discoveryArtifactId: string | null
    examSlug: string | null
    examTitle: string | null
    kind: $Enums.DocumentKind | null
    sourceUrl: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    status: $Enums.ExtractionStatus | null
    failReason: string | null
    attempts: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DocumentCountAggregateOutputType = {
    id: number
    discoveryArtifactId: number
    examSlug: number
    examTitle: number
    kind: number
    sourceUrl: number
    storageKey: number
    checksum: number
    contentType: number
    status: number
    failReason: number
    attempts: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DocumentAvgAggregateInputType = {
    attempts?: true
  }

  export type DocumentSumAggregateInputType = {
    attempts?: true
  }

  export type DocumentMinAggregateInputType = {
    id?: true
    discoveryArtifactId?: true
    examSlug?: true
    examTitle?: true
    kind?: true
    sourceUrl?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    status?: true
    failReason?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DocumentMaxAggregateInputType = {
    id?: true
    discoveryArtifactId?: true
    examSlug?: true
    examTitle?: true
    kind?: true
    sourceUrl?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    status?: true
    failReason?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DocumentCountAggregateInputType = {
    id?: true
    discoveryArtifactId?: true
    examSlug?: true
    examTitle?: true
    kind?: true
    sourceUrl?: true
    storageKey?: true
    checksum?: true
    contentType?: true
    status?: true
    failReason?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Document to aggregate.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Documents
    **/
    _count?: true | DocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DocumentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DocumentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DocumentMaxAggregateInputType
  }

  export type GetDocumentAggregateType<T extends DocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDocument[P]>
      : GetScalarType<T[P], AggregateDocument[P]>
  }




  export type DocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DocumentWhereInput
    orderBy?: DocumentOrderByWithAggregationInput | DocumentOrderByWithAggregationInput[]
    by: DocumentScalarFieldEnum[] | DocumentScalarFieldEnum
    having?: DocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DocumentCountAggregateInputType | true
    _avg?: DocumentAvgAggregateInputType
    _sum?: DocumentSumAggregateInputType
    _min?: DocumentMinAggregateInputType
    _max?: DocumentMaxAggregateInputType
  }

  export type DocumentGroupByOutputType = {
    id: string
    discoveryArtifactId: string | null
    examSlug: string
    examTitle: string | null
    kind: $Enums.DocumentKind
    sourceUrl: string | null
    storageKey: string | null
    checksum: string | null
    contentType: string | null
    status: $Enums.ExtractionStatus
    failReason: string | null
    attempts: number
    createdAt: Date
    updatedAt: Date
    _count: DocumentCountAggregateOutputType | null
    _avg: DocumentAvgAggregateOutputType | null
    _sum: DocumentSumAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  type GetDocumentGroupByPayload<T extends DocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DocumentGroupByOutputType[P]>
            : GetScalarType<T[P], DocumentGroupByOutputType[P]>
        }
      >
    >


  export type DocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    discoveryArtifactId?: boolean
    examSlug?: boolean
    examTitle?: boolean
    kind?: boolean
    sourceUrl?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    status?: boolean
    failReason?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chunks?: boolean | Document$chunksArgs<ExtArgs>
    questionItems?: boolean | Document$questionItemsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    discoveryArtifactId?: boolean
    examSlug?: boolean
    examTitle?: boolean
    kind?: boolean
    sourceUrl?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    status?: boolean
    failReason?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    discoveryArtifactId?: boolean
    examSlug?: boolean
    examTitle?: boolean
    kind?: boolean
    sourceUrl?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    status?: boolean
    failReason?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectScalar = {
    id?: boolean
    discoveryArtifactId?: boolean
    examSlug?: boolean
    examTitle?: boolean
    kind?: boolean
    sourceUrl?: boolean
    storageKey?: boolean
    checksum?: boolean
    contentType?: boolean
    status?: boolean
    failReason?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "discoveryArtifactId" | "examSlug" | "examTitle" | "kind" | "sourceUrl" | "storageKey" | "checksum" | "contentType" | "status" | "failReason" | "attempts" | "createdAt" | "updatedAt", ExtArgs["result"]["document"]>
  export type DocumentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chunks?: boolean | Document$chunksArgs<ExtArgs>
    questionItems?: boolean | Document$questionItemsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DocumentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DocumentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Document"
    objects: {
      chunks: Prisma.$ChunkPayload<ExtArgs>[]
      questionItems: Prisma.$QuestionItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      discoveryArtifactId: string | null
      examSlug: string
      examTitle: string | null
      kind: $Enums.DocumentKind
      sourceUrl: string | null
      storageKey: string | null
      checksum: string | null
      contentType: string | null
      status: $Enums.ExtractionStatus
      failReason: string | null
      attempts: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["document"]>
    composites: {}
  }

  type DocumentGetPayload<S extends boolean | null | undefined | DocumentDefaultArgs> = $Result.GetResult<Prisma.$DocumentPayload, S>

  type DocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DocumentCountAggregateInputType | true
    }

  export interface DocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Document'], meta: { name: 'Document' } }
    /**
     * Find zero or one Document that matches the filter.
     * @param {DocumentFindUniqueArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DocumentFindUniqueArgs>(args: SelectSubset<T, DocumentFindUniqueArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Document that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DocumentFindUniqueOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, DocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DocumentFindFirstArgs>(args?: SelectSubset<T, DocumentFindFirstArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, DocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Documents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Documents
     * const documents = await prisma.document.findMany()
     * 
     * // Get first 10 Documents
     * const documents = await prisma.document.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const documentWithIdOnly = await prisma.document.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DocumentFindManyArgs>(args?: SelectSubset<T, DocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Document.
     * @param {DocumentCreateArgs} args - Arguments to create a Document.
     * @example
     * // Create one Document
     * const Document = await prisma.document.create({
     *   data: {
     *     // ... data to create a Document
     *   }
     * })
     * 
     */
    create<T extends DocumentCreateArgs>(args: SelectSubset<T, DocumentCreateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Documents.
     * @param {DocumentCreateManyArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DocumentCreateManyArgs>(args?: SelectSubset<T, DocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Documents and returns the data saved in the database.
     * @param {DocumentCreateManyAndReturnArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, DocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Document.
     * @param {DocumentDeleteArgs} args - Arguments to delete one Document.
     * @example
     * // Delete one Document
     * const Document = await prisma.document.delete({
     *   where: {
     *     // ... filter to delete one Document
     *   }
     * })
     * 
     */
    delete<T extends DocumentDeleteArgs>(args: SelectSubset<T, DocumentDeleteArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Document.
     * @param {DocumentUpdateArgs} args - Arguments to update one Document.
     * @example
     * // Update one Document
     * const document = await prisma.document.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DocumentUpdateArgs>(args: SelectSubset<T, DocumentUpdateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Documents.
     * @param {DocumentDeleteManyArgs} args - Arguments to filter Documents to delete.
     * @example
     * // Delete a few Documents
     * const { count } = await prisma.document.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DocumentDeleteManyArgs>(args?: SelectSubset<T, DocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DocumentUpdateManyArgs>(args: SelectSubset<T, DocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents and returns the data updated in the database.
     * @param {DocumentUpdateManyAndReturnArgs} args - Arguments to update many Documents.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.updateManyAndReturn({
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
    updateManyAndReturn<T extends DocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, DocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Document.
     * @param {DocumentUpsertArgs} args - Arguments to update or create a Document.
     * @example
     * // Update or create a Document
     * const document = await prisma.document.upsert({
     *   create: {
     *     // ... data to create a Document
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Document we want to update
     *   }
     * })
     */
    upsert<T extends DocumentUpsertArgs>(args: SelectSubset<T, DocumentUpsertArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentCountArgs} args - Arguments to filter Documents to count.
     * @example
     * // Count the number of Documents
     * const count = await prisma.document.count({
     *   where: {
     *     // ... the filter for the Documents we want to count
     *   }
     * })
    **/
    count<T extends DocumentCountArgs>(
      args?: Subset<T, DocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends DocumentAggregateArgs>(args: Subset<T, DocumentAggregateArgs>): Prisma.PrismaPromise<GetDocumentAggregateType<T>>

    /**
     * Group by Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentGroupByArgs} args - Group by arguments.
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
      T extends DocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DocumentGroupByArgs['orderBy'] }
        : { orderBy?: DocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, DocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Document model
   */
  readonly fields: DocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Document.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chunks<T extends Document$chunksArgs<ExtArgs> = {}>(args?: Subset<T, Document$chunksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    questionItems<T extends Document$questionItemsArgs<ExtArgs> = {}>(args?: Subset<T, Document$questionItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Document model
   */
  interface DocumentFieldRefs {
    readonly id: FieldRef<"Document", 'String'>
    readonly discoveryArtifactId: FieldRef<"Document", 'String'>
    readonly examSlug: FieldRef<"Document", 'String'>
    readonly examTitle: FieldRef<"Document", 'String'>
    readonly kind: FieldRef<"Document", 'DocumentKind'>
    readonly sourceUrl: FieldRef<"Document", 'String'>
    readonly storageKey: FieldRef<"Document", 'String'>
    readonly checksum: FieldRef<"Document", 'String'>
    readonly contentType: FieldRef<"Document", 'String'>
    readonly status: FieldRef<"Document", 'ExtractionStatus'>
    readonly failReason: FieldRef<"Document", 'String'>
    readonly attempts: FieldRef<"Document", 'Int'>
    readonly createdAt: FieldRef<"Document", 'DateTime'>
    readonly updatedAt: FieldRef<"Document", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Document findUnique
   */
  export type DocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findUniqueOrThrow
   */
  export type DocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findFirst
   */
  export type DocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findFirstOrThrow
   */
  export type DocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findMany
   */
  export type DocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Documents to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document create
   */
  export type DocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to create a Document.
     */
    data: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
  }

  /**
   * Document createMany
   */
  export type DocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Document createManyAndReturn
   */
  export type DocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Document update
   */
  export type DocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to update a Document.
     */
    data: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
    /**
     * Choose, which Document to update.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document updateMany
   */
  export type DocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
  }

  /**
   * Document updateManyAndReturn
   */
  export type DocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
  }

  /**
   * Document upsert
   */
  export type DocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The filter to search for the Document to update in case it exists.
     */
    where: DocumentWhereUniqueInput
    /**
     * In case the Document found by the `where` argument doesn't exist, create a new Document with this data.
     */
    create: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
    /**
     * In case the Document was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
  }

  /**
   * Document delete
   */
  export type DocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter which Document to delete.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document deleteMany
   */
  export type DocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Documents to delete
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to delete.
     */
    limit?: number
  }

  /**
   * Document.chunks
   */
  export type Document$chunksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    where?: ChunkWhereInput
    orderBy?: ChunkOrderByWithRelationInput | ChunkOrderByWithRelationInput[]
    cursor?: ChunkWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChunkScalarFieldEnum | ChunkScalarFieldEnum[]
  }

  /**
   * Document.questionItems
   */
  export type Document$questionItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    where?: QuestionItemWhereInput
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    cursor?: QuestionItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionItemScalarFieldEnum | QuestionItemScalarFieldEnum[]
  }

  /**
   * Document without action
   */
  export type DocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
  }


  /**
   * Model Chunk
   */

  export type AggregateChunk = {
    _count: ChunkCountAggregateOutputType | null
    _avg: ChunkAvgAggregateOutputType | null
    _sum: ChunkSumAggregateOutputType | null
    _min: ChunkMinAggregateOutputType | null
    _max: ChunkMaxAggregateOutputType | null
  }

  export type ChunkAvgAggregateOutputType = {
    ordinal: number | null
    tokenCount: number | null
  }

  export type ChunkSumAggregateOutputType = {
    ordinal: number | null
    tokenCount: number | null
  }

  export type ChunkMinAggregateOutputType = {
    id: string | null
    documentId: string | null
    ordinal: number | null
    text: string | null
    tokenCount: number | null
    createdAt: Date | null
  }

  export type ChunkMaxAggregateOutputType = {
    id: string | null
    documentId: string | null
    ordinal: number | null
    text: string | null
    tokenCount: number | null
    createdAt: Date | null
  }

  export type ChunkCountAggregateOutputType = {
    id: number
    documentId: number
    ordinal: number
    text: number
    tokenCount: number
    createdAt: number
    _all: number
  }


  export type ChunkAvgAggregateInputType = {
    ordinal?: true
    tokenCount?: true
  }

  export type ChunkSumAggregateInputType = {
    ordinal?: true
    tokenCount?: true
  }

  export type ChunkMinAggregateInputType = {
    id?: true
    documentId?: true
    ordinal?: true
    text?: true
    tokenCount?: true
    createdAt?: true
  }

  export type ChunkMaxAggregateInputType = {
    id?: true
    documentId?: true
    ordinal?: true
    text?: true
    tokenCount?: true
    createdAt?: true
  }

  export type ChunkCountAggregateInputType = {
    id?: true
    documentId?: true
    ordinal?: true
    text?: true
    tokenCount?: true
    createdAt?: true
    _all?: true
  }

  export type ChunkAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chunk to aggregate.
     */
    where?: ChunkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chunks to fetch.
     */
    orderBy?: ChunkOrderByWithRelationInput | ChunkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChunkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chunks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chunks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Chunks
    **/
    _count?: true | ChunkCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChunkAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChunkSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChunkMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChunkMaxAggregateInputType
  }

  export type GetChunkAggregateType<T extends ChunkAggregateArgs> = {
        [P in keyof T & keyof AggregateChunk]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChunk[P]>
      : GetScalarType<T[P], AggregateChunk[P]>
  }




  export type ChunkGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChunkWhereInput
    orderBy?: ChunkOrderByWithAggregationInput | ChunkOrderByWithAggregationInput[]
    by: ChunkScalarFieldEnum[] | ChunkScalarFieldEnum
    having?: ChunkScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChunkCountAggregateInputType | true
    _avg?: ChunkAvgAggregateInputType
    _sum?: ChunkSumAggregateInputType
    _min?: ChunkMinAggregateInputType
    _max?: ChunkMaxAggregateInputType
  }

  export type ChunkGroupByOutputType = {
    id: string
    documentId: string
    ordinal: number
    text: string
    tokenCount: number
    createdAt: Date
    _count: ChunkCountAggregateOutputType | null
    _avg: ChunkAvgAggregateOutputType | null
    _sum: ChunkSumAggregateOutputType | null
    _min: ChunkMinAggregateOutputType | null
    _max: ChunkMaxAggregateOutputType | null
  }

  type GetChunkGroupByPayload<T extends ChunkGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChunkGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChunkGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChunkGroupByOutputType[P]>
            : GetScalarType<T[P], ChunkGroupByOutputType[P]>
        }
      >
    >


  export type ChunkSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    documentId?: boolean
    ordinal?: boolean
    text?: boolean
    tokenCount?: boolean
    createdAt?: boolean
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chunk"]>

  export type ChunkSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    documentId?: boolean
    ordinal?: boolean
    text?: boolean
    tokenCount?: boolean
    createdAt?: boolean
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chunk"]>

  export type ChunkSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    documentId?: boolean
    ordinal?: boolean
    text?: boolean
    tokenCount?: boolean
    createdAt?: boolean
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chunk"]>

  export type ChunkSelectScalar = {
    id?: boolean
    documentId?: boolean
    ordinal?: boolean
    text?: boolean
    tokenCount?: boolean
    createdAt?: boolean
  }

  export type ChunkOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "documentId" | "ordinal" | "text" | "tokenCount" | "createdAt", ExtArgs["result"]["chunk"]>
  export type ChunkInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type ChunkIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type ChunkIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }

  export type $ChunkPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Chunk"
    objects: {
      document: Prisma.$DocumentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      documentId: string
      ordinal: number
      text: string
      tokenCount: number
      createdAt: Date
    }, ExtArgs["result"]["chunk"]>
    composites: {}
  }

  type ChunkGetPayload<S extends boolean | null | undefined | ChunkDefaultArgs> = $Result.GetResult<Prisma.$ChunkPayload, S>

  type ChunkCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChunkFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChunkCountAggregateInputType | true
    }

  export interface ChunkDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Chunk'], meta: { name: 'Chunk' } }
    /**
     * Find zero or one Chunk that matches the filter.
     * @param {ChunkFindUniqueArgs} args - Arguments to find a Chunk
     * @example
     * // Get one Chunk
     * const chunk = await prisma.chunk.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChunkFindUniqueArgs>(args: SelectSubset<T, ChunkFindUniqueArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Chunk that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChunkFindUniqueOrThrowArgs} args - Arguments to find a Chunk
     * @example
     * // Get one Chunk
     * const chunk = await prisma.chunk.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChunkFindUniqueOrThrowArgs>(args: SelectSubset<T, ChunkFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chunk that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkFindFirstArgs} args - Arguments to find a Chunk
     * @example
     * // Get one Chunk
     * const chunk = await prisma.chunk.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChunkFindFirstArgs>(args?: SelectSubset<T, ChunkFindFirstArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chunk that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkFindFirstOrThrowArgs} args - Arguments to find a Chunk
     * @example
     * // Get one Chunk
     * const chunk = await prisma.chunk.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChunkFindFirstOrThrowArgs>(args?: SelectSubset<T, ChunkFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Chunks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Chunks
     * const chunks = await prisma.chunk.findMany()
     * 
     * // Get first 10 Chunks
     * const chunks = await prisma.chunk.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chunkWithIdOnly = await prisma.chunk.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChunkFindManyArgs>(args?: SelectSubset<T, ChunkFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Chunk.
     * @param {ChunkCreateArgs} args - Arguments to create a Chunk.
     * @example
     * // Create one Chunk
     * const Chunk = await prisma.chunk.create({
     *   data: {
     *     // ... data to create a Chunk
     *   }
     * })
     * 
     */
    create<T extends ChunkCreateArgs>(args: SelectSubset<T, ChunkCreateArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Chunks.
     * @param {ChunkCreateManyArgs} args - Arguments to create many Chunks.
     * @example
     * // Create many Chunks
     * const chunk = await prisma.chunk.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChunkCreateManyArgs>(args?: SelectSubset<T, ChunkCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Chunks and returns the data saved in the database.
     * @param {ChunkCreateManyAndReturnArgs} args - Arguments to create many Chunks.
     * @example
     * // Create many Chunks
     * const chunk = await prisma.chunk.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Chunks and only return the `id`
     * const chunkWithIdOnly = await prisma.chunk.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChunkCreateManyAndReturnArgs>(args?: SelectSubset<T, ChunkCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Chunk.
     * @param {ChunkDeleteArgs} args - Arguments to delete one Chunk.
     * @example
     * // Delete one Chunk
     * const Chunk = await prisma.chunk.delete({
     *   where: {
     *     // ... filter to delete one Chunk
     *   }
     * })
     * 
     */
    delete<T extends ChunkDeleteArgs>(args: SelectSubset<T, ChunkDeleteArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Chunk.
     * @param {ChunkUpdateArgs} args - Arguments to update one Chunk.
     * @example
     * // Update one Chunk
     * const chunk = await prisma.chunk.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChunkUpdateArgs>(args: SelectSubset<T, ChunkUpdateArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Chunks.
     * @param {ChunkDeleteManyArgs} args - Arguments to filter Chunks to delete.
     * @example
     * // Delete a few Chunks
     * const { count } = await prisma.chunk.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChunkDeleteManyArgs>(args?: SelectSubset<T, ChunkDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chunks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Chunks
     * const chunk = await prisma.chunk.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChunkUpdateManyArgs>(args: SelectSubset<T, ChunkUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chunks and returns the data updated in the database.
     * @param {ChunkUpdateManyAndReturnArgs} args - Arguments to update many Chunks.
     * @example
     * // Update many Chunks
     * const chunk = await prisma.chunk.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Chunks and only return the `id`
     * const chunkWithIdOnly = await prisma.chunk.updateManyAndReturn({
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
    updateManyAndReturn<T extends ChunkUpdateManyAndReturnArgs>(args: SelectSubset<T, ChunkUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Chunk.
     * @param {ChunkUpsertArgs} args - Arguments to update or create a Chunk.
     * @example
     * // Update or create a Chunk
     * const chunk = await prisma.chunk.upsert({
     *   create: {
     *     // ... data to create a Chunk
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Chunk we want to update
     *   }
     * })
     */
    upsert<T extends ChunkUpsertArgs>(args: SelectSubset<T, ChunkUpsertArgs<ExtArgs>>): Prisma__ChunkClient<$Result.GetResult<Prisma.$ChunkPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Chunks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkCountArgs} args - Arguments to filter Chunks to count.
     * @example
     * // Count the number of Chunks
     * const count = await prisma.chunk.count({
     *   where: {
     *     // ... the filter for the Chunks we want to count
     *   }
     * })
    **/
    count<T extends ChunkCountArgs>(
      args?: Subset<T, ChunkCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChunkCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Chunk.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ChunkAggregateArgs>(args: Subset<T, ChunkAggregateArgs>): Prisma.PrismaPromise<GetChunkAggregateType<T>>

    /**
     * Group by Chunk.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChunkGroupByArgs} args - Group by arguments.
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
      T extends ChunkGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChunkGroupByArgs['orderBy'] }
        : { orderBy?: ChunkGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ChunkGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChunkGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Chunk model
   */
  readonly fields: ChunkFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Chunk.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChunkClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    document<T extends DocumentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DocumentDefaultArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Chunk model
   */
  interface ChunkFieldRefs {
    readonly id: FieldRef<"Chunk", 'String'>
    readonly documentId: FieldRef<"Chunk", 'String'>
    readonly ordinal: FieldRef<"Chunk", 'Int'>
    readonly text: FieldRef<"Chunk", 'String'>
    readonly tokenCount: FieldRef<"Chunk", 'Int'>
    readonly createdAt: FieldRef<"Chunk", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Chunk findUnique
   */
  export type ChunkFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter, which Chunk to fetch.
     */
    where: ChunkWhereUniqueInput
  }

  /**
   * Chunk findUniqueOrThrow
   */
  export type ChunkFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter, which Chunk to fetch.
     */
    where: ChunkWhereUniqueInput
  }

  /**
   * Chunk findFirst
   */
  export type ChunkFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter, which Chunk to fetch.
     */
    where?: ChunkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chunks to fetch.
     */
    orderBy?: ChunkOrderByWithRelationInput | ChunkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chunks.
     */
    cursor?: ChunkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chunks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chunks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chunks.
     */
    distinct?: ChunkScalarFieldEnum | ChunkScalarFieldEnum[]
  }

  /**
   * Chunk findFirstOrThrow
   */
  export type ChunkFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter, which Chunk to fetch.
     */
    where?: ChunkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chunks to fetch.
     */
    orderBy?: ChunkOrderByWithRelationInput | ChunkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chunks.
     */
    cursor?: ChunkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chunks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chunks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chunks.
     */
    distinct?: ChunkScalarFieldEnum | ChunkScalarFieldEnum[]
  }

  /**
   * Chunk findMany
   */
  export type ChunkFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter, which Chunks to fetch.
     */
    where?: ChunkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chunks to fetch.
     */
    orderBy?: ChunkOrderByWithRelationInput | ChunkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Chunks.
     */
    cursor?: ChunkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chunks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chunks.
     */
    skip?: number
    distinct?: ChunkScalarFieldEnum | ChunkScalarFieldEnum[]
  }

  /**
   * Chunk create
   */
  export type ChunkCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * The data needed to create a Chunk.
     */
    data: XOR<ChunkCreateInput, ChunkUncheckedCreateInput>
  }

  /**
   * Chunk createMany
   */
  export type ChunkCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Chunks.
     */
    data: ChunkCreateManyInput | ChunkCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Chunk createManyAndReturn
   */
  export type ChunkCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * The data used to create many Chunks.
     */
    data: ChunkCreateManyInput | ChunkCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chunk update
   */
  export type ChunkUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * The data needed to update a Chunk.
     */
    data: XOR<ChunkUpdateInput, ChunkUncheckedUpdateInput>
    /**
     * Choose, which Chunk to update.
     */
    where: ChunkWhereUniqueInput
  }

  /**
   * Chunk updateMany
   */
  export type ChunkUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Chunks.
     */
    data: XOR<ChunkUpdateManyMutationInput, ChunkUncheckedUpdateManyInput>
    /**
     * Filter which Chunks to update
     */
    where?: ChunkWhereInput
    /**
     * Limit how many Chunks to update.
     */
    limit?: number
  }

  /**
   * Chunk updateManyAndReturn
   */
  export type ChunkUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * The data used to update Chunks.
     */
    data: XOR<ChunkUpdateManyMutationInput, ChunkUncheckedUpdateManyInput>
    /**
     * Filter which Chunks to update
     */
    where?: ChunkWhereInput
    /**
     * Limit how many Chunks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chunk upsert
   */
  export type ChunkUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * The filter to search for the Chunk to update in case it exists.
     */
    where: ChunkWhereUniqueInput
    /**
     * In case the Chunk found by the `where` argument doesn't exist, create a new Chunk with this data.
     */
    create: XOR<ChunkCreateInput, ChunkUncheckedCreateInput>
    /**
     * In case the Chunk was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChunkUpdateInput, ChunkUncheckedUpdateInput>
  }

  /**
   * Chunk delete
   */
  export type ChunkDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
    /**
     * Filter which Chunk to delete.
     */
    where: ChunkWhereUniqueInput
  }

  /**
   * Chunk deleteMany
   */
  export type ChunkDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chunks to delete
     */
    where?: ChunkWhereInput
    /**
     * Limit how many Chunks to delete.
     */
    limit?: number
  }

  /**
   * Chunk without action
   */
  export type ChunkDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chunk
     */
    select?: ChunkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chunk
     */
    omit?: ChunkOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChunkInclude<ExtArgs> | null
  }


  /**
   * Model QuestionItem
   */

  export type AggregateQuestionItem = {
    _count: QuestionItemCountAggregateOutputType | null
    _avg: QuestionItemAvgAggregateOutputType | null
    _sum: QuestionItemSumAggregateOutputType | null
    _min: QuestionItemMinAggregateOutputType | null
    _max: QuestionItemMaxAggregateOutputType | null
  }

  export type QuestionItemAvgAggregateOutputType = {
    correctIndex: number | null
    qualityScore: number | null
    reviewCount: number | null
  }

  export type QuestionItemSumAggregateOutputType = {
    correctIndex: number | null
    qualityScore: number | null
    reviewCount: number | null
  }

  export type QuestionItemMinAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    examSlug: string | null
    subject: string | null
    subjectSlug: string | null
    emphasis: string | null
    origin: $Enums.QuestionItemOrigin | null
    status: $Enums.QuestionItemStatus | null
    type: $Enums.QuestionItemType | null
    prompt: string | null
    correctIndex: number | null
    referenceAnswer: string | null
    explanation: string | null
    locale: string | null
    documentId: string | null
    generationRunId: string | null
    qualityScore: number | null
    qualityNotes: string | null
    reviewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
    publishedAt: Date | null
  }

  export type QuestionItemMaxAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    examSlug: string | null
    subject: string | null
    subjectSlug: string | null
    emphasis: string | null
    origin: $Enums.QuestionItemOrigin | null
    status: $Enums.QuestionItemStatus | null
    type: $Enums.QuestionItemType | null
    prompt: string | null
    correctIndex: number | null
    referenceAnswer: string | null
    explanation: string | null
    locale: string | null
    documentId: string | null
    generationRunId: string | null
    qualityScore: number | null
    qualityNotes: string | null
    reviewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
    publishedAt: Date | null
  }

  export type QuestionItemCountAggregateOutputType = {
    id: number
    fingerprint: number
    examSlug: number
    subject: number
    subjectSlug: number
    emphasis: number
    origin: number
    status: number
    type: number
    prompt: number
    options: number
    correctIndex: number
    referenceAnswer: number
    explanation: number
    locale: number
    documentId: number
    generationRunId: number
    qualityScore: number
    qualityNotes: number
    failReasons: number
    reviewCount: number
    createdAt: number
    updatedAt: number
    publishedAt: number
    _all: number
  }


  export type QuestionItemAvgAggregateInputType = {
    correctIndex?: true
    qualityScore?: true
    reviewCount?: true
  }

  export type QuestionItemSumAggregateInputType = {
    correctIndex?: true
    qualityScore?: true
    reviewCount?: true
  }

  export type QuestionItemMinAggregateInputType = {
    id?: true
    fingerprint?: true
    examSlug?: true
    subject?: true
    subjectSlug?: true
    emphasis?: true
    origin?: true
    status?: true
    type?: true
    prompt?: true
    correctIndex?: true
    referenceAnswer?: true
    explanation?: true
    locale?: true
    documentId?: true
    generationRunId?: true
    qualityScore?: true
    qualityNotes?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
    publishedAt?: true
  }

  export type QuestionItemMaxAggregateInputType = {
    id?: true
    fingerprint?: true
    examSlug?: true
    subject?: true
    subjectSlug?: true
    emphasis?: true
    origin?: true
    status?: true
    type?: true
    prompt?: true
    correctIndex?: true
    referenceAnswer?: true
    explanation?: true
    locale?: true
    documentId?: true
    generationRunId?: true
    qualityScore?: true
    qualityNotes?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
    publishedAt?: true
  }

  export type QuestionItemCountAggregateInputType = {
    id?: true
    fingerprint?: true
    examSlug?: true
    subject?: true
    subjectSlug?: true
    emphasis?: true
    origin?: true
    status?: true
    type?: true
    prompt?: true
    options?: true
    correctIndex?: true
    referenceAnswer?: true
    explanation?: true
    locale?: true
    documentId?: true
    generationRunId?: true
    qualityScore?: true
    qualityNotes?: true
    failReasons?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
    publishedAt?: true
    _all?: true
  }

  export type QuestionItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionItem to aggregate.
     */
    where?: QuestionItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionItems to fetch.
     */
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuestionItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuestionItems
    **/
    _count?: true | QuestionItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuestionItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuestionItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuestionItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuestionItemMaxAggregateInputType
  }

  export type GetQuestionItemAggregateType<T extends QuestionItemAggregateArgs> = {
        [P in keyof T & keyof AggregateQuestionItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuestionItem[P]>
      : GetScalarType<T[P], AggregateQuestionItem[P]>
  }




  export type QuestionItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuestionItemWhereInput
    orderBy?: QuestionItemOrderByWithAggregationInput | QuestionItemOrderByWithAggregationInput[]
    by: QuestionItemScalarFieldEnum[] | QuestionItemScalarFieldEnum
    having?: QuestionItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuestionItemCountAggregateInputType | true
    _avg?: QuestionItemAvgAggregateInputType
    _sum?: QuestionItemSumAggregateInputType
    _min?: QuestionItemMinAggregateInputType
    _max?: QuestionItemMaxAggregateInputType
  }

  export type QuestionItemGroupByOutputType = {
    id: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis: string | null
    origin: $Enums.QuestionItemOrigin
    status: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options: JsonValue | null
    correctIndex: number | null
    referenceAnswer: string | null
    explanation: string | null
    locale: string
    documentId: string | null
    generationRunId: string | null
    qualityScore: number | null
    qualityNotes: string | null
    failReasons: JsonValue
    reviewCount: number
    createdAt: Date
    updatedAt: Date
    publishedAt: Date | null
    _count: QuestionItemCountAggregateOutputType | null
    _avg: QuestionItemAvgAggregateOutputType | null
    _sum: QuestionItemSumAggregateOutputType | null
    _min: QuestionItemMinAggregateOutputType | null
    _max: QuestionItemMaxAggregateOutputType | null
  }

  type GetQuestionItemGroupByPayload<T extends QuestionItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuestionItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuestionItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuestionItemGroupByOutputType[P]>
            : GetScalarType<T[P], QuestionItemGroupByOutputType[P]>
        }
      >
    >


  export type QuestionItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    examSlug?: boolean
    subject?: boolean
    subjectSlug?: boolean
    emphasis?: boolean
    origin?: boolean
    status?: boolean
    type?: boolean
    prompt?: boolean
    options?: boolean
    correctIndex?: boolean
    referenceAnswer?: boolean
    explanation?: boolean
    locale?: boolean
    documentId?: boolean
    generationRunId?: boolean
    qualityScore?: boolean
    qualityNotes?: boolean
    failReasons?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    publishedAt?: boolean
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
    reviews?: boolean | QuestionItem$reviewsArgs<ExtArgs>
    _count?: boolean | QuestionItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["questionItem"]>

  export type QuestionItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    examSlug?: boolean
    subject?: boolean
    subjectSlug?: boolean
    emphasis?: boolean
    origin?: boolean
    status?: boolean
    type?: boolean
    prompt?: boolean
    options?: boolean
    correctIndex?: boolean
    referenceAnswer?: boolean
    explanation?: boolean
    locale?: boolean
    documentId?: boolean
    generationRunId?: boolean
    qualityScore?: boolean
    qualityNotes?: boolean
    failReasons?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    publishedAt?: boolean
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
  }, ExtArgs["result"]["questionItem"]>

  export type QuestionItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    examSlug?: boolean
    subject?: boolean
    subjectSlug?: boolean
    emphasis?: boolean
    origin?: boolean
    status?: boolean
    type?: boolean
    prompt?: boolean
    options?: boolean
    correctIndex?: boolean
    referenceAnswer?: boolean
    explanation?: boolean
    locale?: boolean
    documentId?: boolean
    generationRunId?: boolean
    qualityScore?: boolean
    qualityNotes?: boolean
    failReasons?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    publishedAt?: boolean
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
  }, ExtArgs["result"]["questionItem"]>

  export type QuestionItemSelectScalar = {
    id?: boolean
    fingerprint?: boolean
    examSlug?: boolean
    subject?: boolean
    subjectSlug?: boolean
    emphasis?: boolean
    origin?: boolean
    status?: boolean
    type?: boolean
    prompt?: boolean
    options?: boolean
    correctIndex?: boolean
    referenceAnswer?: boolean
    explanation?: boolean
    locale?: boolean
    documentId?: boolean
    generationRunId?: boolean
    qualityScore?: boolean
    qualityNotes?: boolean
    failReasons?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    publishedAt?: boolean
  }

  export type QuestionItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fingerprint" | "examSlug" | "subject" | "subjectSlug" | "emphasis" | "origin" | "status" | "type" | "prompt" | "options" | "correctIndex" | "referenceAnswer" | "explanation" | "locale" | "documentId" | "generationRunId" | "qualityScore" | "qualityNotes" | "failReasons" | "reviewCount" | "createdAt" | "updatedAt" | "publishedAt", ExtArgs["result"]["questionItem"]>
  export type QuestionItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
    reviews?: boolean | QuestionItem$reviewsArgs<ExtArgs>
    _count?: boolean | QuestionItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuestionItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
  }
  export type QuestionItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    document?: boolean | QuestionItem$documentArgs<ExtArgs>
    generationRun?: boolean | QuestionItem$generationRunArgs<ExtArgs>
  }

  export type $QuestionItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuestionItem"
    objects: {
      document: Prisma.$DocumentPayload<ExtArgs> | null
      generationRun: Prisma.$GenerationRunPayload<ExtArgs> | null
      reviews: Prisma.$QualityReviewPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      /**
       * Stable content hash so re-extraction and re-generation dedupe.
       */
      fingerprint: string
      examSlug: string
      subject: string
      subjectSlug: string
      emphasis: string | null
      origin: $Enums.QuestionItemOrigin
      status: $Enums.QuestionItemStatus
      type: $Enums.QuestionItemType
      prompt: string
      options: Prisma.JsonValue | null
      correctIndex: number | null
      referenceAnswer: string | null
      explanation: string | null
      locale: string
      documentId: string | null
      generationRunId: string | null
      qualityScore: number | null
      qualityNotes: string | null
      failReasons: Prisma.JsonValue
      reviewCount: number
      createdAt: Date
      updatedAt: Date
      publishedAt: Date | null
    }, ExtArgs["result"]["questionItem"]>
    composites: {}
  }

  type QuestionItemGetPayload<S extends boolean | null | undefined | QuestionItemDefaultArgs> = $Result.GetResult<Prisma.$QuestionItemPayload, S>

  type QuestionItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuestionItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuestionItemCountAggregateInputType | true
    }

  export interface QuestionItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuestionItem'], meta: { name: 'QuestionItem' } }
    /**
     * Find zero or one QuestionItem that matches the filter.
     * @param {QuestionItemFindUniqueArgs} args - Arguments to find a QuestionItem
     * @example
     * // Get one QuestionItem
     * const questionItem = await prisma.questionItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuestionItemFindUniqueArgs>(args: SelectSubset<T, QuestionItemFindUniqueArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuestionItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuestionItemFindUniqueOrThrowArgs} args - Arguments to find a QuestionItem
     * @example
     * // Get one QuestionItem
     * const questionItem = await prisma.questionItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuestionItemFindUniqueOrThrowArgs>(args: SelectSubset<T, QuestionItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemFindFirstArgs} args - Arguments to find a QuestionItem
     * @example
     * // Get one QuestionItem
     * const questionItem = await prisma.questionItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuestionItemFindFirstArgs>(args?: SelectSubset<T, QuestionItemFindFirstArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuestionItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemFindFirstOrThrowArgs} args - Arguments to find a QuestionItem
     * @example
     * // Get one QuestionItem
     * const questionItem = await prisma.questionItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuestionItemFindFirstOrThrowArgs>(args?: SelectSubset<T, QuestionItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuestionItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuestionItems
     * const questionItems = await prisma.questionItem.findMany()
     * 
     * // Get first 10 QuestionItems
     * const questionItems = await prisma.questionItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const questionItemWithIdOnly = await prisma.questionItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuestionItemFindManyArgs>(args?: SelectSubset<T, QuestionItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuestionItem.
     * @param {QuestionItemCreateArgs} args - Arguments to create a QuestionItem.
     * @example
     * // Create one QuestionItem
     * const QuestionItem = await prisma.questionItem.create({
     *   data: {
     *     // ... data to create a QuestionItem
     *   }
     * })
     * 
     */
    create<T extends QuestionItemCreateArgs>(args: SelectSubset<T, QuestionItemCreateArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuestionItems.
     * @param {QuestionItemCreateManyArgs} args - Arguments to create many QuestionItems.
     * @example
     * // Create many QuestionItems
     * const questionItem = await prisma.questionItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuestionItemCreateManyArgs>(args?: SelectSubset<T, QuestionItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuestionItems and returns the data saved in the database.
     * @param {QuestionItemCreateManyAndReturnArgs} args - Arguments to create many QuestionItems.
     * @example
     * // Create many QuestionItems
     * const questionItem = await prisma.questionItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuestionItems and only return the `id`
     * const questionItemWithIdOnly = await prisma.questionItem.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuestionItemCreateManyAndReturnArgs>(args?: SelectSubset<T, QuestionItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuestionItem.
     * @param {QuestionItemDeleteArgs} args - Arguments to delete one QuestionItem.
     * @example
     * // Delete one QuestionItem
     * const QuestionItem = await prisma.questionItem.delete({
     *   where: {
     *     // ... filter to delete one QuestionItem
     *   }
     * })
     * 
     */
    delete<T extends QuestionItemDeleteArgs>(args: SelectSubset<T, QuestionItemDeleteArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuestionItem.
     * @param {QuestionItemUpdateArgs} args - Arguments to update one QuestionItem.
     * @example
     * // Update one QuestionItem
     * const questionItem = await prisma.questionItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuestionItemUpdateArgs>(args: SelectSubset<T, QuestionItemUpdateArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuestionItems.
     * @param {QuestionItemDeleteManyArgs} args - Arguments to filter QuestionItems to delete.
     * @example
     * // Delete a few QuestionItems
     * const { count } = await prisma.questionItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuestionItemDeleteManyArgs>(args?: SelectSubset<T, QuestionItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuestionItems
     * const questionItem = await prisma.questionItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuestionItemUpdateManyArgs>(args: SelectSubset<T, QuestionItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuestionItems and returns the data updated in the database.
     * @param {QuestionItemUpdateManyAndReturnArgs} args - Arguments to update many QuestionItems.
     * @example
     * // Update many QuestionItems
     * const questionItem = await prisma.questionItem.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuestionItems and only return the `id`
     * const questionItemWithIdOnly = await prisma.questionItem.updateManyAndReturn({
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
    updateManyAndReturn<T extends QuestionItemUpdateManyAndReturnArgs>(args: SelectSubset<T, QuestionItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuestionItem.
     * @param {QuestionItemUpsertArgs} args - Arguments to update or create a QuestionItem.
     * @example
     * // Update or create a QuestionItem
     * const questionItem = await prisma.questionItem.upsert({
     *   create: {
     *     // ... data to create a QuestionItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuestionItem we want to update
     *   }
     * })
     */
    upsert<T extends QuestionItemUpsertArgs>(args: SelectSubset<T, QuestionItemUpsertArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuestionItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemCountArgs} args - Arguments to filter QuestionItems to count.
     * @example
     * // Count the number of QuestionItems
     * const count = await prisma.questionItem.count({
     *   where: {
     *     // ... the filter for the QuestionItems we want to count
     *   }
     * })
    **/
    count<T extends QuestionItemCountArgs>(
      args?: Subset<T, QuestionItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuestionItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuestionItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QuestionItemAggregateArgs>(args: Subset<T, QuestionItemAggregateArgs>): Prisma.PrismaPromise<GetQuestionItemAggregateType<T>>

    /**
     * Group by QuestionItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuestionItemGroupByArgs} args - Group by arguments.
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
      T extends QuestionItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuestionItemGroupByArgs['orderBy'] }
        : { orderBy?: QuestionItemGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QuestionItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuestionItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuestionItem model
   */
  readonly fields: QuestionItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuestionItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuestionItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    document<T extends QuestionItem$documentArgs<ExtArgs> = {}>(args?: Subset<T, QuestionItem$documentArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    generationRun<T extends QuestionItem$generationRunArgs<ExtArgs> = {}>(args?: Subset<T, QuestionItem$generationRunArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    reviews<T extends QuestionItem$reviewsArgs<ExtArgs> = {}>(args?: Subset<T, QuestionItem$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the QuestionItem model
   */
  interface QuestionItemFieldRefs {
    readonly id: FieldRef<"QuestionItem", 'String'>
    readonly fingerprint: FieldRef<"QuestionItem", 'String'>
    readonly examSlug: FieldRef<"QuestionItem", 'String'>
    readonly subject: FieldRef<"QuestionItem", 'String'>
    readonly subjectSlug: FieldRef<"QuestionItem", 'String'>
    readonly emphasis: FieldRef<"QuestionItem", 'String'>
    readonly origin: FieldRef<"QuestionItem", 'QuestionItemOrigin'>
    readonly status: FieldRef<"QuestionItem", 'QuestionItemStatus'>
    readonly type: FieldRef<"QuestionItem", 'QuestionItemType'>
    readonly prompt: FieldRef<"QuestionItem", 'String'>
    readonly options: FieldRef<"QuestionItem", 'Json'>
    readonly correctIndex: FieldRef<"QuestionItem", 'Int'>
    readonly referenceAnswer: FieldRef<"QuestionItem", 'String'>
    readonly explanation: FieldRef<"QuestionItem", 'String'>
    readonly locale: FieldRef<"QuestionItem", 'String'>
    readonly documentId: FieldRef<"QuestionItem", 'String'>
    readonly generationRunId: FieldRef<"QuestionItem", 'String'>
    readonly qualityScore: FieldRef<"QuestionItem", 'Float'>
    readonly qualityNotes: FieldRef<"QuestionItem", 'String'>
    readonly failReasons: FieldRef<"QuestionItem", 'Json'>
    readonly reviewCount: FieldRef<"QuestionItem", 'Int'>
    readonly createdAt: FieldRef<"QuestionItem", 'DateTime'>
    readonly updatedAt: FieldRef<"QuestionItem", 'DateTime'>
    readonly publishedAt: FieldRef<"QuestionItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuestionItem findUnique
   */
  export type QuestionItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter, which QuestionItem to fetch.
     */
    where: QuestionItemWhereUniqueInput
  }

  /**
   * QuestionItem findUniqueOrThrow
   */
  export type QuestionItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter, which QuestionItem to fetch.
     */
    where: QuestionItemWhereUniqueInput
  }

  /**
   * QuestionItem findFirst
   */
  export type QuestionItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter, which QuestionItem to fetch.
     */
    where?: QuestionItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionItems to fetch.
     */
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionItems.
     */
    cursor?: QuestionItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionItems.
     */
    distinct?: QuestionItemScalarFieldEnum | QuestionItemScalarFieldEnum[]
  }

  /**
   * QuestionItem findFirstOrThrow
   */
  export type QuestionItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter, which QuestionItem to fetch.
     */
    where?: QuestionItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionItems to fetch.
     */
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuestionItems.
     */
    cursor?: QuestionItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuestionItems.
     */
    distinct?: QuestionItemScalarFieldEnum | QuestionItemScalarFieldEnum[]
  }

  /**
   * QuestionItem findMany
   */
  export type QuestionItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter, which QuestionItems to fetch.
     */
    where?: QuestionItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuestionItems to fetch.
     */
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuestionItems.
     */
    cursor?: QuestionItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuestionItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuestionItems.
     */
    skip?: number
    distinct?: QuestionItemScalarFieldEnum | QuestionItemScalarFieldEnum[]
  }

  /**
   * QuestionItem create
   */
  export type QuestionItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * The data needed to create a QuestionItem.
     */
    data: XOR<QuestionItemCreateInput, QuestionItemUncheckedCreateInput>
  }

  /**
   * QuestionItem createMany
   */
  export type QuestionItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuestionItems.
     */
    data: QuestionItemCreateManyInput | QuestionItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QuestionItem createManyAndReturn
   */
  export type QuestionItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * The data used to create many QuestionItems.
     */
    data: QuestionItemCreateManyInput | QuestionItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionItem update
   */
  export type QuestionItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * The data needed to update a QuestionItem.
     */
    data: XOR<QuestionItemUpdateInput, QuestionItemUncheckedUpdateInput>
    /**
     * Choose, which QuestionItem to update.
     */
    where: QuestionItemWhereUniqueInput
  }

  /**
   * QuestionItem updateMany
   */
  export type QuestionItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuestionItems.
     */
    data: XOR<QuestionItemUpdateManyMutationInput, QuestionItemUncheckedUpdateManyInput>
    /**
     * Filter which QuestionItems to update
     */
    where?: QuestionItemWhereInput
    /**
     * Limit how many QuestionItems to update.
     */
    limit?: number
  }

  /**
   * QuestionItem updateManyAndReturn
   */
  export type QuestionItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * The data used to update QuestionItems.
     */
    data: XOR<QuestionItemUpdateManyMutationInput, QuestionItemUncheckedUpdateManyInput>
    /**
     * Filter which QuestionItems to update
     */
    where?: QuestionItemWhereInput
    /**
     * Limit how many QuestionItems to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuestionItem upsert
   */
  export type QuestionItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * The filter to search for the QuestionItem to update in case it exists.
     */
    where: QuestionItemWhereUniqueInput
    /**
     * In case the QuestionItem found by the `where` argument doesn't exist, create a new QuestionItem with this data.
     */
    create: XOR<QuestionItemCreateInput, QuestionItemUncheckedCreateInput>
    /**
     * In case the QuestionItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuestionItemUpdateInput, QuestionItemUncheckedUpdateInput>
  }

  /**
   * QuestionItem delete
   */
  export type QuestionItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    /**
     * Filter which QuestionItem to delete.
     */
    where: QuestionItemWhereUniqueInput
  }

  /**
   * QuestionItem deleteMany
   */
  export type QuestionItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuestionItems to delete
     */
    where?: QuestionItemWhereInput
    /**
     * Limit how many QuestionItems to delete.
     */
    limit?: number
  }

  /**
   * QuestionItem.document
   */
  export type QuestionItem$documentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    where?: DocumentWhereInput
  }

  /**
   * QuestionItem.generationRun
   */
  export type QuestionItem$generationRunArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    where?: GenerationRunWhereInput
  }

  /**
   * QuestionItem.reviews
   */
  export type QuestionItem$reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    where?: QualityReviewWhereInput
    orderBy?: QualityReviewOrderByWithRelationInput | QualityReviewOrderByWithRelationInput[]
    cursor?: QualityReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QualityReviewScalarFieldEnum | QualityReviewScalarFieldEnum[]
  }

  /**
   * QuestionItem without action
   */
  export type QuestionItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
  }


  /**
   * Model GenerationRun
   */

  export type AggregateGenerationRun = {
    _count: GenerationRunCountAggregateOutputType | null
    _avg: GenerationRunAvgAggregateOutputType | null
    _sum: GenerationRunSumAggregateOutputType | null
    _min: GenerationRunMinAggregateOutputType | null
    _max: GenerationRunMaxAggregateOutputType | null
  }

  export type GenerationRunAvgAggregateOutputType = {
    requested: number | null
    drafted: number | null
    chunksUsed: number | null
  }

  export type GenerationRunSumAggregateOutputType = {
    requested: number | null
    drafted: number | null
    chunksUsed: number | null
  }

  export type GenerationRunMinAggregateOutputType = {
    id: string | null
    examSlug: string | null
    subject: string | null
    status: $Enums.GenerationRunStatus | null
    requested: number | null
    drafted: number | null
    chunksUsed: number | null
    model: string | null
    error: string | null
    startedAt: Date | null
    finishedAt: Date | null
  }

  export type GenerationRunMaxAggregateOutputType = {
    id: string | null
    examSlug: string | null
    subject: string | null
    status: $Enums.GenerationRunStatus | null
    requested: number | null
    drafted: number | null
    chunksUsed: number | null
    model: string | null
    error: string | null
    startedAt: Date | null
    finishedAt: Date | null
  }

  export type GenerationRunCountAggregateOutputType = {
    id: number
    examSlug: number
    subject: number
    status: number
    requested: number
    drafted: number
    chunksUsed: number
    model: number
    error: number
    startedAt: number
    finishedAt: number
    _all: number
  }


  export type GenerationRunAvgAggregateInputType = {
    requested?: true
    drafted?: true
    chunksUsed?: true
  }

  export type GenerationRunSumAggregateInputType = {
    requested?: true
    drafted?: true
    chunksUsed?: true
  }

  export type GenerationRunMinAggregateInputType = {
    id?: true
    examSlug?: true
    subject?: true
    status?: true
    requested?: true
    drafted?: true
    chunksUsed?: true
    model?: true
    error?: true
    startedAt?: true
    finishedAt?: true
  }

  export type GenerationRunMaxAggregateInputType = {
    id?: true
    examSlug?: true
    subject?: true
    status?: true
    requested?: true
    drafted?: true
    chunksUsed?: true
    model?: true
    error?: true
    startedAt?: true
    finishedAt?: true
  }

  export type GenerationRunCountAggregateInputType = {
    id?: true
    examSlug?: true
    subject?: true
    status?: true
    requested?: true
    drafted?: true
    chunksUsed?: true
    model?: true
    error?: true
    startedAt?: true
    finishedAt?: true
    _all?: true
  }

  export type GenerationRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GenerationRun to aggregate.
     */
    where?: GenerationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GenerationRuns to fetch.
     */
    orderBy?: GenerationRunOrderByWithRelationInput | GenerationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GenerationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GenerationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GenerationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GenerationRuns
    **/
    _count?: true | GenerationRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GenerationRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GenerationRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GenerationRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GenerationRunMaxAggregateInputType
  }

  export type GetGenerationRunAggregateType<T extends GenerationRunAggregateArgs> = {
        [P in keyof T & keyof AggregateGenerationRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGenerationRun[P]>
      : GetScalarType<T[P], AggregateGenerationRun[P]>
  }




  export type GenerationRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GenerationRunWhereInput
    orderBy?: GenerationRunOrderByWithAggregationInput | GenerationRunOrderByWithAggregationInput[]
    by: GenerationRunScalarFieldEnum[] | GenerationRunScalarFieldEnum
    having?: GenerationRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GenerationRunCountAggregateInputType | true
    _avg?: GenerationRunAvgAggregateInputType
    _sum?: GenerationRunSumAggregateInputType
    _min?: GenerationRunMinAggregateInputType
    _max?: GenerationRunMaxAggregateInputType
  }

  export type GenerationRunGroupByOutputType = {
    id: string
    examSlug: string
    subject: string
    status: $Enums.GenerationRunStatus
    requested: number
    drafted: number
    chunksUsed: number
    model: string | null
    error: string | null
    startedAt: Date
    finishedAt: Date | null
    _count: GenerationRunCountAggregateOutputType | null
    _avg: GenerationRunAvgAggregateOutputType | null
    _sum: GenerationRunSumAggregateOutputType | null
    _min: GenerationRunMinAggregateOutputType | null
    _max: GenerationRunMaxAggregateOutputType | null
  }

  type GetGenerationRunGroupByPayload<T extends GenerationRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GenerationRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GenerationRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GenerationRunGroupByOutputType[P]>
            : GetScalarType<T[P], GenerationRunGroupByOutputType[P]>
        }
      >
    >


  export type GenerationRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    subject?: boolean
    status?: boolean
    requested?: boolean
    drafted?: boolean
    chunksUsed?: boolean
    model?: boolean
    error?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    questionItems?: boolean | GenerationRun$questionItemsArgs<ExtArgs>
    _count?: boolean | GenerationRunCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["generationRun"]>

  export type GenerationRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    subject?: boolean
    status?: boolean
    requested?: boolean
    drafted?: boolean
    chunksUsed?: boolean
    model?: boolean
    error?: boolean
    startedAt?: boolean
    finishedAt?: boolean
  }, ExtArgs["result"]["generationRun"]>

  export type GenerationRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    examSlug?: boolean
    subject?: boolean
    status?: boolean
    requested?: boolean
    drafted?: boolean
    chunksUsed?: boolean
    model?: boolean
    error?: boolean
    startedAt?: boolean
    finishedAt?: boolean
  }, ExtArgs["result"]["generationRun"]>

  export type GenerationRunSelectScalar = {
    id?: boolean
    examSlug?: boolean
    subject?: boolean
    status?: boolean
    requested?: boolean
    drafted?: boolean
    chunksUsed?: boolean
    model?: boolean
    error?: boolean
    startedAt?: boolean
    finishedAt?: boolean
  }

  export type GenerationRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "examSlug" | "subject" | "status" | "requested" | "drafted" | "chunksUsed" | "model" | "error" | "startedAt" | "finishedAt", ExtArgs["result"]["generationRun"]>
  export type GenerationRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    questionItems?: boolean | GenerationRun$questionItemsArgs<ExtArgs>
    _count?: boolean | GenerationRunCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GenerationRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type GenerationRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $GenerationRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GenerationRun"
    objects: {
      questionItems: Prisma.$QuestionItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      examSlug: string
      subject: string
      status: $Enums.GenerationRunStatus
      requested: number
      drafted: number
      chunksUsed: number
      model: string | null
      error: string | null
      startedAt: Date
      finishedAt: Date | null
    }, ExtArgs["result"]["generationRun"]>
    composites: {}
  }

  type GenerationRunGetPayload<S extends boolean | null | undefined | GenerationRunDefaultArgs> = $Result.GetResult<Prisma.$GenerationRunPayload, S>

  type GenerationRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GenerationRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GenerationRunCountAggregateInputType | true
    }

  export interface GenerationRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GenerationRun'], meta: { name: 'GenerationRun' } }
    /**
     * Find zero or one GenerationRun that matches the filter.
     * @param {GenerationRunFindUniqueArgs} args - Arguments to find a GenerationRun
     * @example
     * // Get one GenerationRun
     * const generationRun = await prisma.generationRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GenerationRunFindUniqueArgs>(args: SelectSubset<T, GenerationRunFindUniqueArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GenerationRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GenerationRunFindUniqueOrThrowArgs} args - Arguments to find a GenerationRun
     * @example
     * // Get one GenerationRun
     * const generationRun = await prisma.generationRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GenerationRunFindUniqueOrThrowArgs>(args: SelectSubset<T, GenerationRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GenerationRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunFindFirstArgs} args - Arguments to find a GenerationRun
     * @example
     * // Get one GenerationRun
     * const generationRun = await prisma.generationRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GenerationRunFindFirstArgs>(args?: SelectSubset<T, GenerationRunFindFirstArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GenerationRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunFindFirstOrThrowArgs} args - Arguments to find a GenerationRun
     * @example
     * // Get one GenerationRun
     * const generationRun = await prisma.generationRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GenerationRunFindFirstOrThrowArgs>(args?: SelectSubset<T, GenerationRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GenerationRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GenerationRuns
     * const generationRuns = await prisma.generationRun.findMany()
     * 
     * // Get first 10 GenerationRuns
     * const generationRuns = await prisma.generationRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const generationRunWithIdOnly = await prisma.generationRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GenerationRunFindManyArgs>(args?: SelectSubset<T, GenerationRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GenerationRun.
     * @param {GenerationRunCreateArgs} args - Arguments to create a GenerationRun.
     * @example
     * // Create one GenerationRun
     * const GenerationRun = await prisma.generationRun.create({
     *   data: {
     *     // ... data to create a GenerationRun
     *   }
     * })
     * 
     */
    create<T extends GenerationRunCreateArgs>(args: SelectSubset<T, GenerationRunCreateArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GenerationRuns.
     * @param {GenerationRunCreateManyArgs} args - Arguments to create many GenerationRuns.
     * @example
     * // Create many GenerationRuns
     * const generationRun = await prisma.generationRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GenerationRunCreateManyArgs>(args?: SelectSubset<T, GenerationRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GenerationRuns and returns the data saved in the database.
     * @param {GenerationRunCreateManyAndReturnArgs} args - Arguments to create many GenerationRuns.
     * @example
     * // Create many GenerationRuns
     * const generationRun = await prisma.generationRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GenerationRuns and only return the `id`
     * const generationRunWithIdOnly = await prisma.generationRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GenerationRunCreateManyAndReturnArgs>(args?: SelectSubset<T, GenerationRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GenerationRun.
     * @param {GenerationRunDeleteArgs} args - Arguments to delete one GenerationRun.
     * @example
     * // Delete one GenerationRun
     * const GenerationRun = await prisma.generationRun.delete({
     *   where: {
     *     // ... filter to delete one GenerationRun
     *   }
     * })
     * 
     */
    delete<T extends GenerationRunDeleteArgs>(args: SelectSubset<T, GenerationRunDeleteArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GenerationRun.
     * @param {GenerationRunUpdateArgs} args - Arguments to update one GenerationRun.
     * @example
     * // Update one GenerationRun
     * const generationRun = await prisma.generationRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GenerationRunUpdateArgs>(args: SelectSubset<T, GenerationRunUpdateArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GenerationRuns.
     * @param {GenerationRunDeleteManyArgs} args - Arguments to filter GenerationRuns to delete.
     * @example
     * // Delete a few GenerationRuns
     * const { count } = await prisma.generationRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GenerationRunDeleteManyArgs>(args?: SelectSubset<T, GenerationRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GenerationRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GenerationRuns
     * const generationRun = await prisma.generationRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GenerationRunUpdateManyArgs>(args: SelectSubset<T, GenerationRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GenerationRuns and returns the data updated in the database.
     * @param {GenerationRunUpdateManyAndReturnArgs} args - Arguments to update many GenerationRuns.
     * @example
     * // Update many GenerationRuns
     * const generationRun = await prisma.generationRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GenerationRuns and only return the `id`
     * const generationRunWithIdOnly = await prisma.generationRun.updateManyAndReturn({
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
    updateManyAndReturn<T extends GenerationRunUpdateManyAndReturnArgs>(args: SelectSubset<T, GenerationRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GenerationRun.
     * @param {GenerationRunUpsertArgs} args - Arguments to update or create a GenerationRun.
     * @example
     * // Update or create a GenerationRun
     * const generationRun = await prisma.generationRun.upsert({
     *   create: {
     *     // ... data to create a GenerationRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GenerationRun we want to update
     *   }
     * })
     */
    upsert<T extends GenerationRunUpsertArgs>(args: SelectSubset<T, GenerationRunUpsertArgs<ExtArgs>>): Prisma__GenerationRunClient<$Result.GetResult<Prisma.$GenerationRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GenerationRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunCountArgs} args - Arguments to filter GenerationRuns to count.
     * @example
     * // Count the number of GenerationRuns
     * const count = await prisma.generationRun.count({
     *   where: {
     *     // ... the filter for the GenerationRuns we want to count
     *   }
     * })
    **/
    count<T extends GenerationRunCountArgs>(
      args?: Subset<T, GenerationRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GenerationRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GenerationRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends GenerationRunAggregateArgs>(args: Subset<T, GenerationRunAggregateArgs>): Prisma.PrismaPromise<GetGenerationRunAggregateType<T>>

    /**
     * Group by GenerationRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenerationRunGroupByArgs} args - Group by arguments.
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
      T extends GenerationRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GenerationRunGroupByArgs['orderBy'] }
        : { orderBy?: GenerationRunGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, GenerationRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGenerationRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GenerationRun model
   */
  readonly fields: GenerationRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GenerationRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GenerationRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    questionItems<T extends GenerationRun$questionItemsArgs<ExtArgs> = {}>(args?: Subset<T, GenerationRun$questionItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the GenerationRun model
   */
  interface GenerationRunFieldRefs {
    readonly id: FieldRef<"GenerationRun", 'String'>
    readonly examSlug: FieldRef<"GenerationRun", 'String'>
    readonly subject: FieldRef<"GenerationRun", 'String'>
    readonly status: FieldRef<"GenerationRun", 'GenerationRunStatus'>
    readonly requested: FieldRef<"GenerationRun", 'Int'>
    readonly drafted: FieldRef<"GenerationRun", 'Int'>
    readonly chunksUsed: FieldRef<"GenerationRun", 'Int'>
    readonly model: FieldRef<"GenerationRun", 'String'>
    readonly error: FieldRef<"GenerationRun", 'String'>
    readonly startedAt: FieldRef<"GenerationRun", 'DateTime'>
    readonly finishedAt: FieldRef<"GenerationRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * GenerationRun findUnique
   */
  export type GenerationRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter, which GenerationRun to fetch.
     */
    where: GenerationRunWhereUniqueInput
  }

  /**
   * GenerationRun findUniqueOrThrow
   */
  export type GenerationRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter, which GenerationRun to fetch.
     */
    where: GenerationRunWhereUniqueInput
  }

  /**
   * GenerationRun findFirst
   */
  export type GenerationRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter, which GenerationRun to fetch.
     */
    where?: GenerationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GenerationRuns to fetch.
     */
    orderBy?: GenerationRunOrderByWithRelationInput | GenerationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GenerationRuns.
     */
    cursor?: GenerationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GenerationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GenerationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GenerationRuns.
     */
    distinct?: GenerationRunScalarFieldEnum | GenerationRunScalarFieldEnum[]
  }

  /**
   * GenerationRun findFirstOrThrow
   */
  export type GenerationRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter, which GenerationRun to fetch.
     */
    where?: GenerationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GenerationRuns to fetch.
     */
    orderBy?: GenerationRunOrderByWithRelationInput | GenerationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GenerationRuns.
     */
    cursor?: GenerationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GenerationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GenerationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GenerationRuns.
     */
    distinct?: GenerationRunScalarFieldEnum | GenerationRunScalarFieldEnum[]
  }

  /**
   * GenerationRun findMany
   */
  export type GenerationRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter, which GenerationRuns to fetch.
     */
    where?: GenerationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GenerationRuns to fetch.
     */
    orderBy?: GenerationRunOrderByWithRelationInput | GenerationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GenerationRuns.
     */
    cursor?: GenerationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GenerationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GenerationRuns.
     */
    skip?: number
    distinct?: GenerationRunScalarFieldEnum | GenerationRunScalarFieldEnum[]
  }

  /**
   * GenerationRun create
   */
  export type GenerationRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * The data needed to create a GenerationRun.
     */
    data: XOR<GenerationRunCreateInput, GenerationRunUncheckedCreateInput>
  }

  /**
   * GenerationRun createMany
   */
  export type GenerationRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GenerationRuns.
     */
    data: GenerationRunCreateManyInput | GenerationRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GenerationRun createManyAndReturn
   */
  export type GenerationRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * The data used to create many GenerationRuns.
     */
    data: GenerationRunCreateManyInput | GenerationRunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GenerationRun update
   */
  export type GenerationRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * The data needed to update a GenerationRun.
     */
    data: XOR<GenerationRunUpdateInput, GenerationRunUncheckedUpdateInput>
    /**
     * Choose, which GenerationRun to update.
     */
    where: GenerationRunWhereUniqueInput
  }

  /**
   * GenerationRun updateMany
   */
  export type GenerationRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GenerationRuns.
     */
    data: XOR<GenerationRunUpdateManyMutationInput, GenerationRunUncheckedUpdateManyInput>
    /**
     * Filter which GenerationRuns to update
     */
    where?: GenerationRunWhereInput
    /**
     * Limit how many GenerationRuns to update.
     */
    limit?: number
  }

  /**
   * GenerationRun updateManyAndReturn
   */
  export type GenerationRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * The data used to update GenerationRuns.
     */
    data: XOR<GenerationRunUpdateManyMutationInput, GenerationRunUncheckedUpdateManyInput>
    /**
     * Filter which GenerationRuns to update
     */
    where?: GenerationRunWhereInput
    /**
     * Limit how many GenerationRuns to update.
     */
    limit?: number
  }

  /**
   * GenerationRun upsert
   */
  export type GenerationRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * The filter to search for the GenerationRun to update in case it exists.
     */
    where: GenerationRunWhereUniqueInput
    /**
     * In case the GenerationRun found by the `where` argument doesn't exist, create a new GenerationRun with this data.
     */
    create: XOR<GenerationRunCreateInput, GenerationRunUncheckedCreateInput>
    /**
     * In case the GenerationRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GenerationRunUpdateInput, GenerationRunUncheckedUpdateInput>
  }

  /**
   * GenerationRun delete
   */
  export type GenerationRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
    /**
     * Filter which GenerationRun to delete.
     */
    where: GenerationRunWhereUniqueInput
  }

  /**
   * GenerationRun deleteMany
   */
  export type GenerationRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GenerationRuns to delete
     */
    where?: GenerationRunWhereInput
    /**
     * Limit how many GenerationRuns to delete.
     */
    limit?: number
  }

  /**
   * GenerationRun.questionItems
   */
  export type GenerationRun$questionItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuestionItem
     */
    select?: QuestionItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuestionItem
     */
    omit?: QuestionItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuestionItemInclude<ExtArgs> | null
    where?: QuestionItemWhereInput
    orderBy?: QuestionItemOrderByWithRelationInput | QuestionItemOrderByWithRelationInput[]
    cursor?: QuestionItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuestionItemScalarFieldEnum | QuestionItemScalarFieldEnum[]
  }

  /**
   * GenerationRun without action
   */
  export type GenerationRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenerationRun
     */
    select?: GenerationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GenerationRun
     */
    omit?: GenerationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenerationRunInclude<ExtArgs> | null
  }


  /**
   * Model QualityReview
   */

  export type AggregateQualityReview = {
    _count: QualityReviewCountAggregateOutputType | null
    _avg: QualityReviewAvgAggregateOutputType | null
    _sum: QualityReviewSumAggregateOutputType | null
    _min: QualityReviewMinAggregateOutputType | null
    _max: QualityReviewMaxAggregateOutputType | null
  }

  export type QualityReviewAvgAggregateOutputType = {
    score: number | null
  }

  export type QualityReviewSumAggregateOutputType = {
    score: number | null
  }

  export type QualityReviewMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    stage: string | null
    decision: string | null
    score: number | null
    notes: string | null
    model: string | null
    createdAt: Date | null
  }

  export type QualityReviewMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    stage: string | null
    decision: string | null
    score: number | null
    notes: string | null
    model: string | null
    createdAt: Date | null
  }

  export type QualityReviewCountAggregateOutputType = {
    id: number
    itemId: number
    stage: number
    decision: number
    score: number
    notes: number
    reasons: number
    model: number
    createdAt: number
    _all: number
  }


  export type QualityReviewAvgAggregateInputType = {
    score?: true
  }

  export type QualityReviewSumAggregateInputType = {
    score?: true
  }

  export type QualityReviewMinAggregateInputType = {
    id?: true
    itemId?: true
    stage?: true
    decision?: true
    score?: true
    notes?: true
    model?: true
    createdAt?: true
  }

  export type QualityReviewMaxAggregateInputType = {
    id?: true
    itemId?: true
    stage?: true
    decision?: true
    score?: true
    notes?: true
    model?: true
    createdAt?: true
  }

  export type QualityReviewCountAggregateInputType = {
    id?: true
    itemId?: true
    stage?: true
    decision?: true
    score?: true
    notes?: true
    reasons?: true
    model?: true
    createdAt?: true
    _all?: true
  }

  export type QualityReviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QualityReview to aggregate.
     */
    where?: QualityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QualityReviews to fetch.
     */
    orderBy?: QualityReviewOrderByWithRelationInput | QualityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QualityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QualityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QualityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QualityReviews
    **/
    _count?: true | QualityReviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QualityReviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QualityReviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QualityReviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QualityReviewMaxAggregateInputType
  }

  export type GetQualityReviewAggregateType<T extends QualityReviewAggregateArgs> = {
        [P in keyof T & keyof AggregateQualityReview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQualityReview[P]>
      : GetScalarType<T[P], AggregateQualityReview[P]>
  }




  export type QualityReviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QualityReviewWhereInput
    orderBy?: QualityReviewOrderByWithAggregationInput | QualityReviewOrderByWithAggregationInput[]
    by: QualityReviewScalarFieldEnum[] | QualityReviewScalarFieldEnum
    having?: QualityReviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QualityReviewCountAggregateInputType | true
    _avg?: QualityReviewAvgAggregateInputType
    _sum?: QualityReviewSumAggregateInputType
    _min?: QualityReviewMinAggregateInputType
    _max?: QualityReviewMaxAggregateInputType
  }

  export type QualityReviewGroupByOutputType = {
    id: string
    itemId: string
    stage: string
    decision: string
    score: number
    notes: string | null
    reasons: JsonValue
    model: string | null
    createdAt: Date
    _count: QualityReviewCountAggregateOutputType | null
    _avg: QualityReviewAvgAggregateOutputType | null
    _sum: QualityReviewSumAggregateOutputType | null
    _min: QualityReviewMinAggregateOutputType | null
    _max: QualityReviewMaxAggregateOutputType | null
  }

  type GetQualityReviewGroupByPayload<T extends QualityReviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QualityReviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QualityReviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QualityReviewGroupByOutputType[P]>
            : GetScalarType<T[P], QualityReviewGroupByOutputType[P]>
        }
      >
    >


  export type QualityReviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    stage?: boolean
    decision?: boolean
    score?: boolean
    notes?: boolean
    reasons?: boolean
    model?: boolean
    createdAt?: boolean
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["qualityReview"]>

  export type QualityReviewSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    stage?: boolean
    decision?: boolean
    score?: boolean
    notes?: boolean
    reasons?: boolean
    model?: boolean
    createdAt?: boolean
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["qualityReview"]>

  export type QualityReviewSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    stage?: boolean
    decision?: boolean
    score?: boolean
    notes?: boolean
    reasons?: boolean
    model?: boolean
    createdAt?: boolean
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["qualityReview"]>

  export type QualityReviewSelectScalar = {
    id?: boolean
    itemId?: boolean
    stage?: boolean
    decision?: boolean
    score?: boolean
    notes?: boolean
    reasons?: boolean
    model?: boolean
    createdAt?: boolean
  }

  export type QualityReviewOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "itemId" | "stage" | "decision" | "score" | "notes" | "reasons" | "model" | "createdAt", ExtArgs["result"]["qualityReview"]>
  export type QualityReviewInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }
  export type QualityReviewIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }
  export type QualityReviewIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | QuestionItemDefaultArgs<ExtArgs>
  }

  export type $QualityReviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QualityReview"
    objects: {
      item: Prisma.$QuestionItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string
      stage: string
      decision: string
      score: number
      notes: string | null
      reasons: Prisma.JsonValue
      model: string | null
      createdAt: Date
    }, ExtArgs["result"]["qualityReview"]>
    composites: {}
  }

  type QualityReviewGetPayload<S extends boolean | null | undefined | QualityReviewDefaultArgs> = $Result.GetResult<Prisma.$QualityReviewPayload, S>

  type QualityReviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QualityReviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QualityReviewCountAggregateInputType | true
    }

  export interface QualityReviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QualityReview'], meta: { name: 'QualityReview' } }
    /**
     * Find zero or one QualityReview that matches the filter.
     * @param {QualityReviewFindUniqueArgs} args - Arguments to find a QualityReview
     * @example
     * // Get one QualityReview
     * const qualityReview = await prisma.qualityReview.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QualityReviewFindUniqueArgs>(args: SelectSubset<T, QualityReviewFindUniqueArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QualityReview that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QualityReviewFindUniqueOrThrowArgs} args - Arguments to find a QualityReview
     * @example
     * // Get one QualityReview
     * const qualityReview = await prisma.qualityReview.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QualityReviewFindUniqueOrThrowArgs>(args: SelectSubset<T, QualityReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QualityReview that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewFindFirstArgs} args - Arguments to find a QualityReview
     * @example
     * // Get one QualityReview
     * const qualityReview = await prisma.qualityReview.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QualityReviewFindFirstArgs>(args?: SelectSubset<T, QualityReviewFindFirstArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QualityReview that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewFindFirstOrThrowArgs} args - Arguments to find a QualityReview
     * @example
     * // Get one QualityReview
     * const qualityReview = await prisma.qualityReview.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QualityReviewFindFirstOrThrowArgs>(args?: SelectSubset<T, QualityReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QualityReviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QualityReviews
     * const qualityReviews = await prisma.qualityReview.findMany()
     * 
     * // Get first 10 QualityReviews
     * const qualityReviews = await prisma.qualityReview.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const qualityReviewWithIdOnly = await prisma.qualityReview.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QualityReviewFindManyArgs>(args?: SelectSubset<T, QualityReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QualityReview.
     * @param {QualityReviewCreateArgs} args - Arguments to create a QualityReview.
     * @example
     * // Create one QualityReview
     * const QualityReview = await prisma.qualityReview.create({
     *   data: {
     *     // ... data to create a QualityReview
     *   }
     * })
     * 
     */
    create<T extends QualityReviewCreateArgs>(args: SelectSubset<T, QualityReviewCreateArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QualityReviews.
     * @param {QualityReviewCreateManyArgs} args - Arguments to create many QualityReviews.
     * @example
     * // Create many QualityReviews
     * const qualityReview = await prisma.qualityReview.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QualityReviewCreateManyArgs>(args?: SelectSubset<T, QualityReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QualityReviews and returns the data saved in the database.
     * @param {QualityReviewCreateManyAndReturnArgs} args - Arguments to create many QualityReviews.
     * @example
     * // Create many QualityReviews
     * const qualityReview = await prisma.qualityReview.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QualityReviews and only return the `id`
     * const qualityReviewWithIdOnly = await prisma.qualityReview.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QualityReviewCreateManyAndReturnArgs>(args?: SelectSubset<T, QualityReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QualityReview.
     * @param {QualityReviewDeleteArgs} args - Arguments to delete one QualityReview.
     * @example
     * // Delete one QualityReview
     * const QualityReview = await prisma.qualityReview.delete({
     *   where: {
     *     // ... filter to delete one QualityReview
     *   }
     * })
     * 
     */
    delete<T extends QualityReviewDeleteArgs>(args: SelectSubset<T, QualityReviewDeleteArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QualityReview.
     * @param {QualityReviewUpdateArgs} args - Arguments to update one QualityReview.
     * @example
     * // Update one QualityReview
     * const qualityReview = await prisma.qualityReview.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QualityReviewUpdateArgs>(args: SelectSubset<T, QualityReviewUpdateArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QualityReviews.
     * @param {QualityReviewDeleteManyArgs} args - Arguments to filter QualityReviews to delete.
     * @example
     * // Delete a few QualityReviews
     * const { count } = await prisma.qualityReview.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QualityReviewDeleteManyArgs>(args?: SelectSubset<T, QualityReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QualityReviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QualityReviews
     * const qualityReview = await prisma.qualityReview.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QualityReviewUpdateManyArgs>(args: SelectSubset<T, QualityReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QualityReviews and returns the data updated in the database.
     * @param {QualityReviewUpdateManyAndReturnArgs} args - Arguments to update many QualityReviews.
     * @example
     * // Update many QualityReviews
     * const qualityReview = await prisma.qualityReview.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QualityReviews and only return the `id`
     * const qualityReviewWithIdOnly = await prisma.qualityReview.updateManyAndReturn({
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
    updateManyAndReturn<T extends QualityReviewUpdateManyAndReturnArgs>(args: SelectSubset<T, QualityReviewUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QualityReview.
     * @param {QualityReviewUpsertArgs} args - Arguments to update or create a QualityReview.
     * @example
     * // Update or create a QualityReview
     * const qualityReview = await prisma.qualityReview.upsert({
     *   create: {
     *     // ... data to create a QualityReview
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QualityReview we want to update
     *   }
     * })
     */
    upsert<T extends QualityReviewUpsertArgs>(args: SelectSubset<T, QualityReviewUpsertArgs<ExtArgs>>): Prisma__QualityReviewClient<$Result.GetResult<Prisma.$QualityReviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QualityReviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewCountArgs} args - Arguments to filter QualityReviews to count.
     * @example
     * // Count the number of QualityReviews
     * const count = await prisma.qualityReview.count({
     *   where: {
     *     // ... the filter for the QualityReviews we want to count
     *   }
     * })
    **/
    count<T extends QualityReviewCountArgs>(
      args?: Subset<T, QualityReviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QualityReviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QualityReview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QualityReviewAggregateArgs>(args: Subset<T, QualityReviewAggregateArgs>): Prisma.PrismaPromise<GetQualityReviewAggregateType<T>>

    /**
     * Group by QualityReview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QualityReviewGroupByArgs} args - Group by arguments.
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
      T extends QualityReviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QualityReviewGroupByArgs['orderBy'] }
        : { orderBy?: QualityReviewGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QualityReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQualityReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QualityReview model
   */
  readonly fields: QualityReviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QualityReview.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QualityReviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends QuestionItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuestionItemDefaultArgs<ExtArgs>>): Prisma__QuestionItemClient<$Result.GetResult<Prisma.$QuestionItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the QualityReview model
   */
  interface QualityReviewFieldRefs {
    readonly id: FieldRef<"QualityReview", 'String'>
    readonly itemId: FieldRef<"QualityReview", 'String'>
    readonly stage: FieldRef<"QualityReview", 'String'>
    readonly decision: FieldRef<"QualityReview", 'String'>
    readonly score: FieldRef<"QualityReview", 'Float'>
    readonly notes: FieldRef<"QualityReview", 'String'>
    readonly reasons: FieldRef<"QualityReview", 'Json'>
    readonly model: FieldRef<"QualityReview", 'String'>
    readonly createdAt: FieldRef<"QualityReview", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QualityReview findUnique
   */
  export type QualityReviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter, which QualityReview to fetch.
     */
    where: QualityReviewWhereUniqueInput
  }

  /**
   * QualityReview findUniqueOrThrow
   */
  export type QualityReviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter, which QualityReview to fetch.
     */
    where: QualityReviewWhereUniqueInput
  }

  /**
   * QualityReview findFirst
   */
  export type QualityReviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter, which QualityReview to fetch.
     */
    where?: QualityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QualityReviews to fetch.
     */
    orderBy?: QualityReviewOrderByWithRelationInput | QualityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QualityReviews.
     */
    cursor?: QualityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QualityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QualityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QualityReviews.
     */
    distinct?: QualityReviewScalarFieldEnum | QualityReviewScalarFieldEnum[]
  }

  /**
   * QualityReview findFirstOrThrow
   */
  export type QualityReviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter, which QualityReview to fetch.
     */
    where?: QualityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QualityReviews to fetch.
     */
    orderBy?: QualityReviewOrderByWithRelationInput | QualityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QualityReviews.
     */
    cursor?: QualityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QualityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QualityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QualityReviews.
     */
    distinct?: QualityReviewScalarFieldEnum | QualityReviewScalarFieldEnum[]
  }

  /**
   * QualityReview findMany
   */
  export type QualityReviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter, which QualityReviews to fetch.
     */
    where?: QualityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QualityReviews to fetch.
     */
    orderBy?: QualityReviewOrderByWithRelationInput | QualityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QualityReviews.
     */
    cursor?: QualityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QualityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QualityReviews.
     */
    skip?: number
    distinct?: QualityReviewScalarFieldEnum | QualityReviewScalarFieldEnum[]
  }

  /**
   * QualityReview create
   */
  export type QualityReviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * The data needed to create a QualityReview.
     */
    data: XOR<QualityReviewCreateInput, QualityReviewUncheckedCreateInput>
  }

  /**
   * QualityReview createMany
   */
  export type QualityReviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QualityReviews.
     */
    data: QualityReviewCreateManyInput | QualityReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * QualityReview createManyAndReturn
   */
  export type QualityReviewCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * The data used to create many QualityReviews.
     */
    data: QualityReviewCreateManyInput | QualityReviewCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QualityReview update
   */
  export type QualityReviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * The data needed to update a QualityReview.
     */
    data: XOR<QualityReviewUpdateInput, QualityReviewUncheckedUpdateInput>
    /**
     * Choose, which QualityReview to update.
     */
    where: QualityReviewWhereUniqueInput
  }

  /**
   * QualityReview updateMany
   */
  export type QualityReviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QualityReviews.
     */
    data: XOR<QualityReviewUpdateManyMutationInput, QualityReviewUncheckedUpdateManyInput>
    /**
     * Filter which QualityReviews to update
     */
    where?: QualityReviewWhereInput
    /**
     * Limit how many QualityReviews to update.
     */
    limit?: number
  }

  /**
   * QualityReview updateManyAndReturn
   */
  export type QualityReviewUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * The data used to update QualityReviews.
     */
    data: XOR<QualityReviewUpdateManyMutationInput, QualityReviewUncheckedUpdateManyInput>
    /**
     * Filter which QualityReviews to update
     */
    where?: QualityReviewWhereInput
    /**
     * Limit how many QualityReviews to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QualityReview upsert
   */
  export type QualityReviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * The filter to search for the QualityReview to update in case it exists.
     */
    where: QualityReviewWhereUniqueInput
    /**
     * In case the QualityReview found by the `where` argument doesn't exist, create a new QualityReview with this data.
     */
    create: XOR<QualityReviewCreateInput, QualityReviewUncheckedCreateInput>
    /**
     * In case the QualityReview was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QualityReviewUpdateInput, QualityReviewUncheckedUpdateInput>
  }

  /**
   * QualityReview delete
   */
  export type QualityReviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
    /**
     * Filter which QualityReview to delete.
     */
    where: QualityReviewWhereUniqueInput
  }

  /**
   * QualityReview deleteMany
   */
  export type QualityReviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QualityReviews to delete
     */
    where?: QualityReviewWhereInput
    /**
     * Limit how many QualityReviews to delete.
     */
    limit?: number
  }

  /**
   * QualityReview without action
   */
  export type QualityReviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QualityReview
     */
    select?: QualityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QualityReview
     */
    omit?: QualityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QualityReviewInclude<ExtArgs> | null
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


  export const DocumentScalarFieldEnum: {
    id: 'id',
    discoveryArtifactId: 'discoveryArtifactId',
    examSlug: 'examSlug',
    examTitle: 'examTitle',
    kind: 'kind',
    sourceUrl: 'sourceUrl',
    storageKey: 'storageKey',
    checksum: 'checksum',
    contentType: 'contentType',
    status: 'status',
    failReason: 'failReason',
    attempts: 'attempts',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DocumentScalarFieldEnum = (typeof DocumentScalarFieldEnum)[keyof typeof DocumentScalarFieldEnum]


  export const ChunkScalarFieldEnum: {
    id: 'id',
    documentId: 'documentId',
    ordinal: 'ordinal',
    text: 'text',
    tokenCount: 'tokenCount',
    createdAt: 'createdAt'
  };

  export type ChunkScalarFieldEnum = (typeof ChunkScalarFieldEnum)[keyof typeof ChunkScalarFieldEnum]


  export const QuestionItemScalarFieldEnum: {
    id: 'id',
    fingerprint: 'fingerprint',
    examSlug: 'examSlug',
    subject: 'subject',
    subjectSlug: 'subjectSlug',
    emphasis: 'emphasis',
    origin: 'origin',
    status: 'status',
    type: 'type',
    prompt: 'prompt',
    options: 'options',
    correctIndex: 'correctIndex',
    referenceAnswer: 'referenceAnswer',
    explanation: 'explanation',
    locale: 'locale',
    documentId: 'documentId',
    generationRunId: 'generationRunId',
    qualityScore: 'qualityScore',
    qualityNotes: 'qualityNotes',
    failReasons: 'failReasons',
    reviewCount: 'reviewCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    publishedAt: 'publishedAt'
  };

  export type QuestionItemScalarFieldEnum = (typeof QuestionItemScalarFieldEnum)[keyof typeof QuestionItemScalarFieldEnum]


  export const GenerationRunScalarFieldEnum: {
    id: 'id',
    examSlug: 'examSlug',
    subject: 'subject',
    status: 'status',
    requested: 'requested',
    drafted: 'drafted',
    chunksUsed: 'chunksUsed',
    model: 'model',
    error: 'error',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt'
  };

  export type GenerationRunScalarFieldEnum = (typeof GenerationRunScalarFieldEnum)[keyof typeof GenerationRunScalarFieldEnum]


  export const QualityReviewScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    stage: 'stage',
    decision: 'decision',
    score: 'score',
    notes: 'notes',
    reasons: 'reasons',
    model: 'model',
    createdAt: 'createdAt'
  };

  export type QualityReviewScalarFieldEnum = (typeof QualityReviewScalarFieldEnum)[keyof typeof QualityReviewScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


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
   * Reference to a field of type 'DocumentKind'
   */
  export type EnumDocumentKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentKind'>
    


  /**
   * Reference to a field of type 'DocumentKind[]'
   */
  export type ListEnumDocumentKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentKind[]'>
    


  /**
   * Reference to a field of type 'ExtractionStatus'
   */
  export type EnumExtractionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExtractionStatus'>
    


  /**
   * Reference to a field of type 'ExtractionStatus[]'
   */
  export type ListEnumExtractionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExtractionStatus[]'>
    


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
   * Reference to a field of type 'QuestionItemOrigin'
   */
  export type EnumQuestionItemOriginFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemOrigin'>
    


  /**
   * Reference to a field of type 'QuestionItemOrigin[]'
   */
  export type ListEnumQuestionItemOriginFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemOrigin[]'>
    


  /**
   * Reference to a field of type 'QuestionItemStatus'
   */
  export type EnumQuestionItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemStatus'>
    


  /**
   * Reference to a field of type 'QuestionItemStatus[]'
   */
  export type ListEnumQuestionItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemStatus[]'>
    


  /**
   * Reference to a field of type 'QuestionItemType'
   */
  export type EnumQuestionItemTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemType'>
    


  /**
   * Reference to a field of type 'QuestionItemType[]'
   */
  export type ListEnumQuestionItemTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuestionItemType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'GenerationRunStatus'
   */
  export type EnumGenerationRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GenerationRunStatus'>
    


  /**
   * Reference to a field of type 'GenerationRunStatus[]'
   */
  export type ListEnumGenerationRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GenerationRunStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type DocumentWhereInput = {
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    id?: StringFilter<"Document"> | string
    discoveryArtifactId?: StringNullableFilter<"Document"> | string | null
    examSlug?: StringFilter<"Document"> | string
    examTitle?: StringNullableFilter<"Document"> | string | null
    kind?: EnumDocumentKindFilter<"Document"> | $Enums.DocumentKind
    sourceUrl?: StringNullableFilter<"Document"> | string | null
    storageKey?: StringNullableFilter<"Document"> | string | null
    checksum?: StringNullableFilter<"Document"> | string | null
    contentType?: StringNullableFilter<"Document"> | string | null
    status?: EnumExtractionStatusFilter<"Document"> | $Enums.ExtractionStatus
    failReason?: StringNullableFilter<"Document"> | string | null
    attempts?: IntFilter<"Document"> | number
    createdAt?: DateTimeFilter<"Document"> | Date | string
    updatedAt?: DateTimeFilter<"Document"> | Date | string
    chunks?: ChunkListRelationFilter
    questionItems?: QuestionItemListRelationFilter
  }

  export type DocumentOrderByWithRelationInput = {
    id?: SortOrder
    discoveryArtifactId?: SortOrderInput | SortOrder
    examSlug?: SortOrder
    examTitle?: SortOrderInput | SortOrder
    kind?: SortOrder
    sourceUrl?: SortOrderInput | SortOrder
    storageKey?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    contentType?: SortOrderInput | SortOrder
    status?: SortOrder
    failReason?: SortOrderInput | SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    chunks?: ChunkOrderByRelationAggregateInput
    questionItems?: QuestionItemOrderByRelationAggregateInput
  }

  export type DocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    discoveryArtifactId?: string
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    examSlug?: StringFilter<"Document"> | string
    examTitle?: StringNullableFilter<"Document"> | string | null
    kind?: EnumDocumentKindFilter<"Document"> | $Enums.DocumentKind
    sourceUrl?: StringNullableFilter<"Document"> | string | null
    storageKey?: StringNullableFilter<"Document"> | string | null
    checksum?: StringNullableFilter<"Document"> | string | null
    contentType?: StringNullableFilter<"Document"> | string | null
    status?: EnumExtractionStatusFilter<"Document"> | $Enums.ExtractionStatus
    failReason?: StringNullableFilter<"Document"> | string | null
    attempts?: IntFilter<"Document"> | number
    createdAt?: DateTimeFilter<"Document"> | Date | string
    updatedAt?: DateTimeFilter<"Document"> | Date | string
    chunks?: ChunkListRelationFilter
    questionItems?: QuestionItemListRelationFilter
  }, "id" | "discoveryArtifactId">

  export type DocumentOrderByWithAggregationInput = {
    id?: SortOrder
    discoveryArtifactId?: SortOrderInput | SortOrder
    examSlug?: SortOrder
    examTitle?: SortOrderInput | SortOrder
    kind?: SortOrder
    sourceUrl?: SortOrderInput | SortOrder
    storageKey?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    contentType?: SortOrderInput | SortOrder
    status?: SortOrder
    failReason?: SortOrderInput | SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DocumentCountOrderByAggregateInput
    _avg?: DocumentAvgOrderByAggregateInput
    _max?: DocumentMaxOrderByAggregateInput
    _min?: DocumentMinOrderByAggregateInput
    _sum?: DocumentSumOrderByAggregateInput
  }

  export type DocumentScalarWhereWithAggregatesInput = {
    AND?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    OR?: DocumentScalarWhereWithAggregatesInput[]
    NOT?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Document"> | string
    discoveryArtifactId?: StringNullableWithAggregatesFilter<"Document"> | string | null
    examSlug?: StringWithAggregatesFilter<"Document"> | string
    examTitle?: StringNullableWithAggregatesFilter<"Document"> | string | null
    kind?: EnumDocumentKindWithAggregatesFilter<"Document"> | $Enums.DocumentKind
    sourceUrl?: StringNullableWithAggregatesFilter<"Document"> | string | null
    storageKey?: StringNullableWithAggregatesFilter<"Document"> | string | null
    checksum?: StringNullableWithAggregatesFilter<"Document"> | string | null
    contentType?: StringNullableWithAggregatesFilter<"Document"> | string | null
    status?: EnumExtractionStatusWithAggregatesFilter<"Document"> | $Enums.ExtractionStatus
    failReason?: StringNullableWithAggregatesFilter<"Document"> | string | null
    attempts?: IntWithAggregatesFilter<"Document"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Document"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Document"> | Date | string
  }

  export type ChunkWhereInput = {
    AND?: ChunkWhereInput | ChunkWhereInput[]
    OR?: ChunkWhereInput[]
    NOT?: ChunkWhereInput | ChunkWhereInput[]
    id?: StringFilter<"Chunk"> | string
    documentId?: StringFilter<"Chunk"> | string
    ordinal?: IntFilter<"Chunk"> | number
    text?: StringFilter<"Chunk"> | string
    tokenCount?: IntFilter<"Chunk"> | number
    createdAt?: DateTimeFilter<"Chunk"> | Date | string
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }

  export type ChunkOrderByWithRelationInput = {
    id?: SortOrder
    documentId?: SortOrder
    ordinal?: SortOrder
    text?: SortOrder
    tokenCount?: SortOrder
    createdAt?: SortOrder
    document?: DocumentOrderByWithRelationInput
  }

  export type ChunkWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    documentId_ordinal?: ChunkDocumentIdOrdinalCompoundUniqueInput
    AND?: ChunkWhereInput | ChunkWhereInput[]
    OR?: ChunkWhereInput[]
    NOT?: ChunkWhereInput | ChunkWhereInput[]
    documentId?: StringFilter<"Chunk"> | string
    ordinal?: IntFilter<"Chunk"> | number
    text?: StringFilter<"Chunk"> | string
    tokenCount?: IntFilter<"Chunk"> | number
    createdAt?: DateTimeFilter<"Chunk"> | Date | string
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }, "id" | "documentId_ordinal">

  export type ChunkOrderByWithAggregationInput = {
    id?: SortOrder
    documentId?: SortOrder
    ordinal?: SortOrder
    text?: SortOrder
    tokenCount?: SortOrder
    createdAt?: SortOrder
    _count?: ChunkCountOrderByAggregateInput
    _avg?: ChunkAvgOrderByAggregateInput
    _max?: ChunkMaxOrderByAggregateInput
    _min?: ChunkMinOrderByAggregateInput
    _sum?: ChunkSumOrderByAggregateInput
  }

  export type ChunkScalarWhereWithAggregatesInput = {
    AND?: ChunkScalarWhereWithAggregatesInput | ChunkScalarWhereWithAggregatesInput[]
    OR?: ChunkScalarWhereWithAggregatesInput[]
    NOT?: ChunkScalarWhereWithAggregatesInput | ChunkScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Chunk"> | string
    documentId?: StringWithAggregatesFilter<"Chunk"> | string
    ordinal?: IntWithAggregatesFilter<"Chunk"> | number
    text?: StringWithAggregatesFilter<"Chunk"> | string
    tokenCount?: IntWithAggregatesFilter<"Chunk"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Chunk"> | Date | string
  }

  export type QuestionItemWhereInput = {
    AND?: QuestionItemWhereInput | QuestionItemWhereInput[]
    OR?: QuestionItemWhereInput[]
    NOT?: QuestionItemWhereInput | QuestionItemWhereInput[]
    id?: StringFilter<"QuestionItem"> | string
    fingerprint?: StringFilter<"QuestionItem"> | string
    examSlug?: StringFilter<"QuestionItem"> | string
    subject?: StringFilter<"QuestionItem"> | string
    subjectSlug?: StringFilter<"QuestionItem"> | string
    emphasis?: StringNullableFilter<"QuestionItem"> | string | null
    origin?: EnumQuestionItemOriginFilter<"QuestionItem"> | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFilter<"QuestionItem"> | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFilter<"QuestionItem"> | $Enums.QuestionItemType
    prompt?: StringFilter<"QuestionItem"> | string
    options?: JsonNullableFilter<"QuestionItem">
    correctIndex?: IntNullableFilter<"QuestionItem"> | number | null
    referenceAnswer?: StringNullableFilter<"QuestionItem"> | string | null
    explanation?: StringNullableFilter<"QuestionItem"> | string | null
    locale?: StringFilter<"QuestionItem"> | string
    documentId?: StringNullableFilter<"QuestionItem"> | string | null
    generationRunId?: StringNullableFilter<"QuestionItem"> | string | null
    qualityScore?: FloatNullableFilter<"QuestionItem"> | number | null
    qualityNotes?: StringNullableFilter<"QuestionItem"> | string | null
    failReasons?: JsonFilter<"QuestionItem">
    reviewCount?: IntFilter<"QuestionItem"> | number
    createdAt?: DateTimeFilter<"QuestionItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuestionItem"> | Date | string
    publishedAt?: DateTimeNullableFilter<"QuestionItem"> | Date | string | null
    document?: XOR<DocumentNullableScalarRelationFilter, DocumentWhereInput> | null
    generationRun?: XOR<GenerationRunNullableScalarRelationFilter, GenerationRunWhereInput> | null
    reviews?: QualityReviewListRelationFilter
  }

  export type QuestionItemOrderByWithRelationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    subjectSlug?: SortOrder
    emphasis?: SortOrderInput | SortOrder
    origin?: SortOrder
    status?: SortOrder
    type?: SortOrder
    prompt?: SortOrder
    options?: SortOrderInput | SortOrder
    correctIndex?: SortOrderInput | SortOrder
    referenceAnswer?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    locale?: SortOrder
    documentId?: SortOrderInput | SortOrder
    generationRunId?: SortOrderInput | SortOrder
    qualityScore?: SortOrderInput | SortOrder
    qualityNotes?: SortOrderInput | SortOrder
    failReasons?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    document?: DocumentOrderByWithRelationInput
    generationRun?: GenerationRunOrderByWithRelationInput
    reviews?: QualityReviewOrderByRelationAggregateInput
  }

  export type QuestionItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    fingerprint?: string
    AND?: QuestionItemWhereInput | QuestionItemWhereInput[]
    OR?: QuestionItemWhereInput[]
    NOT?: QuestionItemWhereInput | QuestionItemWhereInput[]
    examSlug?: StringFilter<"QuestionItem"> | string
    subject?: StringFilter<"QuestionItem"> | string
    subjectSlug?: StringFilter<"QuestionItem"> | string
    emphasis?: StringNullableFilter<"QuestionItem"> | string | null
    origin?: EnumQuestionItemOriginFilter<"QuestionItem"> | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFilter<"QuestionItem"> | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFilter<"QuestionItem"> | $Enums.QuestionItemType
    prompt?: StringFilter<"QuestionItem"> | string
    options?: JsonNullableFilter<"QuestionItem">
    correctIndex?: IntNullableFilter<"QuestionItem"> | number | null
    referenceAnswer?: StringNullableFilter<"QuestionItem"> | string | null
    explanation?: StringNullableFilter<"QuestionItem"> | string | null
    locale?: StringFilter<"QuestionItem"> | string
    documentId?: StringNullableFilter<"QuestionItem"> | string | null
    generationRunId?: StringNullableFilter<"QuestionItem"> | string | null
    qualityScore?: FloatNullableFilter<"QuestionItem"> | number | null
    qualityNotes?: StringNullableFilter<"QuestionItem"> | string | null
    failReasons?: JsonFilter<"QuestionItem">
    reviewCount?: IntFilter<"QuestionItem"> | number
    createdAt?: DateTimeFilter<"QuestionItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuestionItem"> | Date | string
    publishedAt?: DateTimeNullableFilter<"QuestionItem"> | Date | string | null
    document?: XOR<DocumentNullableScalarRelationFilter, DocumentWhereInput> | null
    generationRun?: XOR<GenerationRunNullableScalarRelationFilter, GenerationRunWhereInput> | null
    reviews?: QualityReviewListRelationFilter
  }, "id" | "fingerprint">

  export type QuestionItemOrderByWithAggregationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    subjectSlug?: SortOrder
    emphasis?: SortOrderInput | SortOrder
    origin?: SortOrder
    status?: SortOrder
    type?: SortOrder
    prompt?: SortOrder
    options?: SortOrderInput | SortOrder
    correctIndex?: SortOrderInput | SortOrder
    referenceAnswer?: SortOrderInput | SortOrder
    explanation?: SortOrderInput | SortOrder
    locale?: SortOrder
    documentId?: SortOrderInput | SortOrder
    generationRunId?: SortOrderInput | SortOrder
    qualityScore?: SortOrderInput | SortOrder
    qualityNotes?: SortOrderInput | SortOrder
    failReasons?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    _count?: QuestionItemCountOrderByAggregateInput
    _avg?: QuestionItemAvgOrderByAggregateInput
    _max?: QuestionItemMaxOrderByAggregateInput
    _min?: QuestionItemMinOrderByAggregateInput
    _sum?: QuestionItemSumOrderByAggregateInput
  }

  export type QuestionItemScalarWhereWithAggregatesInput = {
    AND?: QuestionItemScalarWhereWithAggregatesInput | QuestionItemScalarWhereWithAggregatesInput[]
    OR?: QuestionItemScalarWhereWithAggregatesInput[]
    NOT?: QuestionItemScalarWhereWithAggregatesInput | QuestionItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuestionItem"> | string
    fingerprint?: StringWithAggregatesFilter<"QuestionItem"> | string
    examSlug?: StringWithAggregatesFilter<"QuestionItem"> | string
    subject?: StringWithAggregatesFilter<"QuestionItem"> | string
    subjectSlug?: StringWithAggregatesFilter<"QuestionItem"> | string
    emphasis?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    origin?: EnumQuestionItemOriginWithAggregatesFilter<"QuestionItem"> | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusWithAggregatesFilter<"QuestionItem"> | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeWithAggregatesFilter<"QuestionItem"> | $Enums.QuestionItemType
    prompt?: StringWithAggregatesFilter<"QuestionItem"> | string
    options?: JsonNullableWithAggregatesFilter<"QuestionItem">
    correctIndex?: IntNullableWithAggregatesFilter<"QuestionItem"> | number | null
    referenceAnswer?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    explanation?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    locale?: StringWithAggregatesFilter<"QuestionItem"> | string
    documentId?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    generationRunId?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    qualityScore?: FloatNullableWithAggregatesFilter<"QuestionItem"> | number | null
    qualityNotes?: StringNullableWithAggregatesFilter<"QuestionItem"> | string | null
    failReasons?: JsonWithAggregatesFilter<"QuestionItem">
    reviewCount?: IntWithAggregatesFilter<"QuestionItem"> | number
    createdAt?: DateTimeWithAggregatesFilter<"QuestionItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QuestionItem"> | Date | string
    publishedAt?: DateTimeNullableWithAggregatesFilter<"QuestionItem"> | Date | string | null
  }

  export type GenerationRunWhereInput = {
    AND?: GenerationRunWhereInput | GenerationRunWhereInput[]
    OR?: GenerationRunWhereInput[]
    NOT?: GenerationRunWhereInput | GenerationRunWhereInput[]
    id?: StringFilter<"GenerationRun"> | string
    examSlug?: StringFilter<"GenerationRun"> | string
    subject?: StringFilter<"GenerationRun"> | string
    status?: EnumGenerationRunStatusFilter<"GenerationRun"> | $Enums.GenerationRunStatus
    requested?: IntFilter<"GenerationRun"> | number
    drafted?: IntFilter<"GenerationRun"> | number
    chunksUsed?: IntFilter<"GenerationRun"> | number
    model?: StringNullableFilter<"GenerationRun"> | string | null
    error?: StringNullableFilter<"GenerationRun"> | string | null
    startedAt?: DateTimeFilter<"GenerationRun"> | Date | string
    finishedAt?: DateTimeNullableFilter<"GenerationRun"> | Date | string | null
    questionItems?: QuestionItemListRelationFilter
  }

  export type GenerationRunOrderByWithRelationInput = {
    id?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    status?: SortOrder
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
    model?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    questionItems?: QuestionItemOrderByRelationAggregateInput
  }

  export type GenerationRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: GenerationRunWhereInput | GenerationRunWhereInput[]
    OR?: GenerationRunWhereInput[]
    NOT?: GenerationRunWhereInput | GenerationRunWhereInput[]
    examSlug?: StringFilter<"GenerationRun"> | string
    subject?: StringFilter<"GenerationRun"> | string
    status?: EnumGenerationRunStatusFilter<"GenerationRun"> | $Enums.GenerationRunStatus
    requested?: IntFilter<"GenerationRun"> | number
    drafted?: IntFilter<"GenerationRun"> | number
    chunksUsed?: IntFilter<"GenerationRun"> | number
    model?: StringNullableFilter<"GenerationRun"> | string | null
    error?: StringNullableFilter<"GenerationRun"> | string | null
    startedAt?: DateTimeFilter<"GenerationRun"> | Date | string
    finishedAt?: DateTimeNullableFilter<"GenerationRun"> | Date | string | null
    questionItems?: QuestionItemListRelationFilter
  }, "id">

  export type GenerationRunOrderByWithAggregationInput = {
    id?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    status?: SortOrder
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
    model?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    _count?: GenerationRunCountOrderByAggregateInput
    _avg?: GenerationRunAvgOrderByAggregateInput
    _max?: GenerationRunMaxOrderByAggregateInput
    _min?: GenerationRunMinOrderByAggregateInput
    _sum?: GenerationRunSumOrderByAggregateInput
  }

  export type GenerationRunScalarWhereWithAggregatesInput = {
    AND?: GenerationRunScalarWhereWithAggregatesInput | GenerationRunScalarWhereWithAggregatesInput[]
    OR?: GenerationRunScalarWhereWithAggregatesInput[]
    NOT?: GenerationRunScalarWhereWithAggregatesInput | GenerationRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GenerationRun"> | string
    examSlug?: StringWithAggregatesFilter<"GenerationRun"> | string
    subject?: StringWithAggregatesFilter<"GenerationRun"> | string
    status?: EnumGenerationRunStatusWithAggregatesFilter<"GenerationRun"> | $Enums.GenerationRunStatus
    requested?: IntWithAggregatesFilter<"GenerationRun"> | number
    drafted?: IntWithAggregatesFilter<"GenerationRun"> | number
    chunksUsed?: IntWithAggregatesFilter<"GenerationRun"> | number
    model?: StringNullableWithAggregatesFilter<"GenerationRun"> | string | null
    error?: StringNullableWithAggregatesFilter<"GenerationRun"> | string | null
    startedAt?: DateTimeWithAggregatesFilter<"GenerationRun"> | Date | string
    finishedAt?: DateTimeNullableWithAggregatesFilter<"GenerationRun"> | Date | string | null
  }

  export type QualityReviewWhereInput = {
    AND?: QualityReviewWhereInput | QualityReviewWhereInput[]
    OR?: QualityReviewWhereInput[]
    NOT?: QualityReviewWhereInput | QualityReviewWhereInput[]
    id?: StringFilter<"QualityReview"> | string
    itemId?: StringFilter<"QualityReview"> | string
    stage?: StringFilter<"QualityReview"> | string
    decision?: StringFilter<"QualityReview"> | string
    score?: FloatFilter<"QualityReview"> | number
    notes?: StringNullableFilter<"QualityReview"> | string | null
    reasons?: JsonFilter<"QualityReview">
    model?: StringNullableFilter<"QualityReview"> | string | null
    createdAt?: DateTimeFilter<"QualityReview"> | Date | string
    item?: XOR<QuestionItemScalarRelationFilter, QuestionItemWhereInput>
  }

  export type QualityReviewOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrder
    stage?: SortOrder
    decision?: SortOrder
    score?: SortOrder
    notes?: SortOrderInput | SortOrder
    reasons?: SortOrder
    model?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    item?: QuestionItemOrderByWithRelationInput
  }

  export type QualityReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QualityReviewWhereInput | QualityReviewWhereInput[]
    OR?: QualityReviewWhereInput[]
    NOT?: QualityReviewWhereInput | QualityReviewWhereInput[]
    itemId?: StringFilter<"QualityReview"> | string
    stage?: StringFilter<"QualityReview"> | string
    decision?: StringFilter<"QualityReview"> | string
    score?: FloatFilter<"QualityReview"> | number
    notes?: StringNullableFilter<"QualityReview"> | string | null
    reasons?: JsonFilter<"QualityReview">
    model?: StringNullableFilter<"QualityReview"> | string | null
    createdAt?: DateTimeFilter<"QualityReview"> | Date | string
    item?: XOR<QuestionItemScalarRelationFilter, QuestionItemWhereInput>
  }, "id">

  export type QualityReviewOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrder
    stage?: SortOrder
    decision?: SortOrder
    score?: SortOrder
    notes?: SortOrderInput | SortOrder
    reasons?: SortOrder
    model?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: QualityReviewCountOrderByAggregateInput
    _avg?: QualityReviewAvgOrderByAggregateInput
    _max?: QualityReviewMaxOrderByAggregateInput
    _min?: QualityReviewMinOrderByAggregateInput
    _sum?: QualityReviewSumOrderByAggregateInput
  }

  export type QualityReviewScalarWhereWithAggregatesInput = {
    AND?: QualityReviewScalarWhereWithAggregatesInput | QualityReviewScalarWhereWithAggregatesInput[]
    OR?: QualityReviewScalarWhereWithAggregatesInput[]
    NOT?: QualityReviewScalarWhereWithAggregatesInput | QualityReviewScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QualityReview"> | string
    itemId?: StringWithAggregatesFilter<"QualityReview"> | string
    stage?: StringWithAggregatesFilter<"QualityReview"> | string
    decision?: StringWithAggregatesFilter<"QualityReview"> | string
    score?: FloatWithAggregatesFilter<"QualityReview"> | number
    notes?: StringNullableWithAggregatesFilter<"QualityReview"> | string | null
    reasons?: JsonWithAggregatesFilter<"QualityReview">
    model?: StringNullableWithAggregatesFilter<"QualityReview"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"QualityReview"> | Date | string
  }

  export type DocumentCreateInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    chunks?: ChunkCreateNestedManyWithoutDocumentInput
    questionItems?: QuestionItemCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    chunks?: ChunkUncheckedCreateNestedManyWithoutDocumentInput
    questionItems?: QuestionItemUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chunks?: ChunkUpdateManyWithoutDocumentNestedInput
    questionItems?: QuestionItemUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chunks?: ChunkUncheckedUpdateManyWithoutDocumentNestedInput
    questionItems?: QuestionItemUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentCreateManyInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChunkCreateInput = {
    id?: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
    document: DocumentCreateNestedOneWithoutChunksInput
  }

  export type ChunkUncheckedCreateInput = {
    id?: string
    documentId: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
  }

  export type ChunkUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    document?: DocumentUpdateOneRequiredWithoutChunksNestedInput
  }

  export type ChunkUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChunkCreateManyInput = {
    id?: string
    documentId: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
  }

  export type ChunkUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChunkUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionItemCreateInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    document?: DocumentCreateNestedOneWithoutQuestionItemsInput
    generationRun?: GenerationRunCreateNestedOneWithoutQuestionItemsInput
    reviews?: QualityReviewCreateNestedManyWithoutItemInput
  }

  export type QuestionItemUncheckedCreateInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    documentId?: string | null
    generationRunId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    reviews?: QualityReviewUncheckedCreateNestedManyWithoutItemInput
  }

  export type QuestionItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    document?: DocumentUpdateOneWithoutQuestionItemsNestedInput
    generationRun?: GenerationRunUpdateOneWithoutQuestionItemsNestedInput
    reviews?: QualityReviewUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    documentId?: NullableStringFieldUpdateOperationsInput | string | null
    generationRunId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviews?: QualityReviewUncheckedUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemCreateManyInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    documentId?: string | null
    generationRunId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
  }

  export type QuestionItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QuestionItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    documentId?: NullableStringFieldUpdateOperationsInput | string | null
    generationRunId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GenerationRunCreateInput = {
    id?: string
    examSlug: string
    subject: string
    status?: $Enums.GenerationRunStatus
    requested?: number
    drafted?: number
    chunksUsed?: number
    model?: string | null
    error?: string | null
    startedAt?: Date | string
    finishedAt?: Date | string | null
    questionItems?: QuestionItemCreateNestedManyWithoutGenerationRunInput
  }

  export type GenerationRunUncheckedCreateInput = {
    id?: string
    examSlug: string
    subject: string
    status?: $Enums.GenerationRunStatus
    requested?: number
    drafted?: number
    chunksUsed?: number
    model?: string | null
    error?: string | null
    startedAt?: Date | string
    finishedAt?: Date | string | null
    questionItems?: QuestionItemUncheckedCreateNestedManyWithoutGenerationRunInput
  }

  export type GenerationRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    questionItems?: QuestionItemUpdateManyWithoutGenerationRunNestedInput
  }

  export type GenerationRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    questionItems?: QuestionItemUncheckedUpdateManyWithoutGenerationRunNestedInput
  }

  export type GenerationRunCreateManyInput = {
    id?: string
    examSlug: string
    subject: string
    status?: $Enums.GenerationRunStatus
    requested?: number
    drafted?: number
    chunksUsed?: number
    model?: string | null
    error?: string | null
    startedAt?: Date | string
    finishedAt?: Date | string | null
  }

  export type GenerationRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GenerationRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QualityReviewCreateInput = {
    id?: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
    item: QuestionItemCreateNestedOneWithoutReviewsInput
  }

  export type QualityReviewUncheckedCreateInput = {
    id?: string
    itemId: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
  }

  export type QualityReviewUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: QuestionItemUpdateOneRequiredWithoutReviewsNestedInput
  }

  export type QualityReviewUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QualityReviewCreateManyInput = {
    id?: string
    itemId: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
  }

  export type QualityReviewUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QualityReviewUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type EnumDocumentKindFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentKind | EnumDocumentKindFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentKindFilter<$PrismaModel> | $Enums.DocumentKind
  }

  export type EnumExtractionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ExtractionStatus | EnumExtractionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExtractionStatusFilter<$PrismaModel> | $Enums.ExtractionStatus
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

  export type ChunkListRelationFilter = {
    every?: ChunkWhereInput
    some?: ChunkWhereInput
    none?: ChunkWhereInput
  }

  export type QuestionItemListRelationFilter = {
    every?: QuestionItemWhereInput
    some?: QuestionItemWhereInput
    none?: QuestionItemWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ChunkOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuestionItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DocumentCountOrderByAggregateInput = {
    id?: SortOrder
    discoveryArtifactId?: SortOrder
    examSlug?: SortOrder
    examTitle?: SortOrder
    kind?: SortOrder
    sourceUrl?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    status?: SortOrder
    failReason?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentAvgOrderByAggregateInput = {
    attempts?: SortOrder
  }

  export type DocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    discoveryArtifactId?: SortOrder
    examSlug?: SortOrder
    examTitle?: SortOrder
    kind?: SortOrder
    sourceUrl?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    status?: SortOrder
    failReason?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentMinOrderByAggregateInput = {
    id?: SortOrder
    discoveryArtifactId?: SortOrder
    examSlug?: SortOrder
    examTitle?: SortOrder
    kind?: SortOrder
    sourceUrl?: SortOrder
    storageKey?: SortOrder
    checksum?: SortOrder
    contentType?: SortOrder
    status?: SortOrder
    failReason?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentSumOrderByAggregateInput = {
    attempts?: SortOrder
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

  export type EnumDocumentKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentKind | EnumDocumentKindFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentKindWithAggregatesFilter<$PrismaModel> | $Enums.DocumentKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDocumentKindFilter<$PrismaModel>
    _max?: NestedEnumDocumentKindFilter<$PrismaModel>
  }

  export type EnumExtractionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExtractionStatus | EnumExtractionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExtractionStatusWithAggregatesFilter<$PrismaModel> | $Enums.ExtractionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExtractionStatusFilter<$PrismaModel>
    _max?: NestedEnumExtractionStatusFilter<$PrismaModel>
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

  export type DocumentScalarRelationFilter = {
    is?: DocumentWhereInput
    isNot?: DocumentWhereInput
  }

  export type ChunkDocumentIdOrdinalCompoundUniqueInput = {
    documentId: string
    ordinal: number
  }

  export type ChunkCountOrderByAggregateInput = {
    id?: SortOrder
    documentId?: SortOrder
    ordinal?: SortOrder
    text?: SortOrder
    tokenCount?: SortOrder
    createdAt?: SortOrder
  }

  export type ChunkAvgOrderByAggregateInput = {
    ordinal?: SortOrder
    tokenCount?: SortOrder
  }

  export type ChunkMaxOrderByAggregateInput = {
    id?: SortOrder
    documentId?: SortOrder
    ordinal?: SortOrder
    text?: SortOrder
    tokenCount?: SortOrder
    createdAt?: SortOrder
  }

  export type ChunkMinOrderByAggregateInput = {
    id?: SortOrder
    documentId?: SortOrder
    ordinal?: SortOrder
    text?: SortOrder
    tokenCount?: SortOrder
    createdAt?: SortOrder
  }

  export type ChunkSumOrderByAggregateInput = {
    ordinal?: SortOrder
    tokenCount?: SortOrder
  }

  export type EnumQuestionItemOriginFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemOrigin | EnumQuestionItemOriginFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemOriginFilter<$PrismaModel> | $Enums.QuestionItemOrigin
  }

  export type EnumQuestionItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemStatus | EnumQuestionItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemStatusFilter<$PrismaModel> | $Enums.QuestionItemStatus
  }

  export type EnumQuestionItemTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemType | EnumQuestionItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemTypeFilter<$PrismaModel> | $Enums.QuestionItemType
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
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

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
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

  export type DocumentNullableScalarRelationFilter = {
    is?: DocumentWhereInput | null
    isNot?: DocumentWhereInput | null
  }

  export type GenerationRunNullableScalarRelationFilter = {
    is?: GenerationRunWhereInput | null
    isNot?: GenerationRunWhereInput | null
  }

  export type QualityReviewListRelationFilter = {
    every?: QualityReviewWhereInput
    some?: QualityReviewWhereInput
    none?: QualityReviewWhereInput
  }

  export type QualityReviewOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuestionItemCountOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    subjectSlug?: SortOrder
    emphasis?: SortOrder
    origin?: SortOrder
    status?: SortOrder
    type?: SortOrder
    prompt?: SortOrder
    options?: SortOrder
    correctIndex?: SortOrder
    referenceAnswer?: SortOrder
    explanation?: SortOrder
    locale?: SortOrder
    documentId?: SortOrder
    generationRunId?: SortOrder
    qualityScore?: SortOrder
    qualityNotes?: SortOrder
    failReasons?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    publishedAt?: SortOrder
  }

  export type QuestionItemAvgOrderByAggregateInput = {
    correctIndex?: SortOrder
    qualityScore?: SortOrder
    reviewCount?: SortOrder
  }

  export type QuestionItemMaxOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    subjectSlug?: SortOrder
    emphasis?: SortOrder
    origin?: SortOrder
    status?: SortOrder
    type?: SortOrder
    prompt?: SortOrder
    correctIndex?: SortOrder
    referenceAnswer?: SortOrder
    explanation?: SortOrder
    locale?: SortOrder
    documentId?: SortOrder
    generationRunId?: SortOrder
    qualityScore?: SortOrder
    qualityNotes?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    publishedAt?: SortOrder
  }

  export type QuestionItemMinOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    subjectSlug?: SortOrder
    emphasis?: SortOrder
    origin?: SortOrder
    status?: SortOrder
    type?: SortOrder
    prompt?: SortOrder
    correctIndex?: SortOrder
    referenceAnswer?: SortOrder
    explanation?: SortOrder
    locale?: SortOrder
    documentId?: SortOrder
    generationRunId?: SortOrder
    qualityScore?: SortOrder
    qualityNotes?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    publishedAt?: SortOrder
  }

  export type QuestionItemSumOrderByAggregateInput = {
    correctIndex?: SortOrder
    qualityScore?: SortOrder
    reviewCount?: SortOrder
  }

  export type EnumQuestionItemOriginWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemOrigin | EnumQuestionItemOriginFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemOriginWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemOrigin
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemOriginFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemOriginFilter<$PrismaModel>
  }

  export type EnumQuestionItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemStatus | EnumQuestionItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemStatusFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemStatusFilter<$PrismaModel>
  }

  export type EnumQuestionItemTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemType | EnumQuestionItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemTypeWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemTypeFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemTypeFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
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
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
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

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type EnumGenerationRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationRunStatus | EnumGenerationRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationRunStatusFilter<$PrismaModel> | $Enums.GenerationRunStatus
  }

  export type GenerationRunCountOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    status?: SortOrder
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
    model?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
  }

  export type GenerationRunAvgOrderByAggregateInput = {
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
  }

  export type GenerationRunMaxOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    status?: SortOrder
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
    model?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
  }

  export type GenerationRunMinOrderByAggregateInput = {
    id?: SortOrder
    examSlug?: SortOrder
    subject?: SortOrder
    status?: SortOrder
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
    model?: SortOrder
    error?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
  }

  export type GenerationRunSumOrderByAggregateInput = {
    requested?: SortOrder
    drafted?: SortOrder
    chunksUsed?: SortOrder
  }

  export type EnumGenerationRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationRunStatus | EnumGenerationRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.GenerationRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenerationRunStatusFilter<$PrismaModel>
    _max?: NestedEnumGenerationRunStatusFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type QuestionItemScalarRelationFilter = {
    is?: QuestionItemWhereInput
    isNot?: QuestionItemWhereInput
  }

  export type QualityReviewCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    stage?: SortOrder
    decision?: SortOrder
    score?: SortOrder
    notes?: SortOrder
    reasons?: SortOrder
    model?: SortOrder
    createdAt?: SortOrder
  }

  export type QualityReviewAvgOrderByAggregateInput = {
    score?: SortOrder
  }

  export type QualityReviewMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    stage?: SortOrder
    decision?: SortOrder
    score?: SortOrder
    notes?: SortOrder
    model?: SortOrder
    createdAt?: SortOrder
  }

  export type QualityReviewMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    stage?: SortOrder
    decision?: SortOrder
    score?: SortOrder
    notes?: SortOrder
    model?: SortOrder
    createdAt?: SortOrder
  }

  export type QualityReviewSumOrderByAggregateInput = {
    score?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type ChunkCreateNestedManyWithoutDocumentInput = {
    create?: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput> | ChunkCreateWithoutDocumentInput[] | ChunkUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChunkCreateOrConnectWithoutDocumentInput | ChunkCreateOrConnectWithoutDocumentInput[]
    createMany?: ChunkCreateManyDocumentInputEnvelope
    connect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
  }

  export type QuestionItemCreateNestedManyWithoutDocumentInput = {
    create?: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput> | QuestionItemCreateWithoutDocumentInput[] | QuestionItemUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutDocumentInput | QuestionItemCreateOrConnectWithoutDocumentInput[]
    createMany?: QuestionItemCreateManyDocumentInputEnvelope
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
  }

  export type ChunkUncheckedCreateNestedManyWithoutDocumentInput = {
    create?: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput> | ChunkCreateWithoutDocumentInput[] | ChunkUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChunkCreateOrConnectWithoutDocumentInput | ChunkCreateOrConnectWithoutDocumentInput[]
    createMany?: ChunkCreateManyDocumentInputEnvelope
    connect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
  }

  export type QuestionItemUncheckedCreateNestedManyWithoutDocumentInput = {
    create?: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput> | QuestionItemCreateWithoutDocumentInput[] | QuestionItemUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutDocumentInput | QuestionItemCreateOrConnectWithoutDocumentInput[]
    createMany?: QuestionItemCreateManyDocumentInputEnvelope
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumDocumentKindFieldUpdateOperationsInput = {
    set?: $Enums.DocumentKind
  }

  export type EnumExtractionStatusFieldUpdateOperationsInput = {
    set?: $Enums.ExtractionStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ChunkUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput> | ChunkCreateWithoutDocumentInput[] | ChunkUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChunkCreateOrConnectWithoutDocumentInput | ChunkCreateOrConnectWithoutDocumentInput[]
    upsert?: ChunkUpsertWithWhereUniqueWithoutDocumentInput | ChunkUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: ChunkCreateManyDocumentInputEnvelope
    set?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    disconnect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    delete?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    connect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    update?: ChunkUpdateWithWhereUniqueWithoutDocumentInput | ChunkUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: ChunkUpdateManyWithWhereWithoutDocumentInput | ChunkUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: ChunkScalarWhereInput | ChunkScalarWhereInput[]
  }

  export type QuestionItemUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput> | QuestionItemCreateWithoutDocumentInput[] | QuestionItemUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutDocumentInput | QuestionItemCreateOrConnectWithoutDocumentInput[]
    upsert?: QuestionItemUpsertWithWhereUniqueWithoutDocumentInput | QuestionItemUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: QuestionItemCreateManyDocumentInputEnvelope
    set?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    disconnect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    delete?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    update?: QuestionItemUpdateWithWhereUniqueWithoutDocumentInput | QuestionItemUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: QuestionItemUpdateManyWithWhereWithoutDocumentInput | QuestionItemUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
  }

  export type ChunkUncheckedUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput> | ChunkCreateWithoutDocumentInput[] | ChunkUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: ChunkCreateOrConnectWithoutDocumentInput | ChunkCreateOrConnectWithoutDocumentInput[]
    upsert?: ChunkUpsertWithWhereUniqueWithoutDocumentInput | ChunkUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: ChunkCreateManyDocumentInputEnvelope
    set?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    disconnect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    delete?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    connect?: ChunkWhereUniqueInput | ChunkWhereUniqueInput[]
    update?: ChunkUpdateWithWhereUniqueWithoutDocumentInput | ChunkUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: ChunkUpdateManyWithWhereWithoutDocumentInput | ChunkUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: ChunkScalarWhereInput | ChunkScalarWhereInput[]
  }

  export type QuestionItemUncheckedUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput> | QuestionItemCreateWithoutDocumentInput[] | QuestionItemUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutDocumentInput | QuestionItemCreateOrConnectWithoutDocumentInput[]
    upsert?: QuestionItemUpsertWithWhereUniqueWithoutDocumentInput | QuestionItemUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: QuestionItemCreateManyDocumentInputEnvelope
    set?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    disconnect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    delete?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    update?: QuestionItemUpdateWithWhereUniqueWithoutDocumentInput | QuestionItemUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: QuestionItemUpdateManyWithWhereWithoutDocumentInput | QuestionItemUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
  }

  export type DocumentCreateNestedOneWithoutChunksInput = {
    create?: XOR<DocumentCreateWithoutChunksInput, DocumentUncheckedCreateWithoutChunksInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutChunksInput
    connect?: DocumentWhereUniqueInput
  }

  export type DocumentUpdateOneRequiredWithoutChunksNestedInput = {
    create?: XOR<DocumentCreateWithoutChunksInput, DocumentUncheckedCreateWithoutChunksInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutChunksInput
    upsert?: DocumentUpsertWithoutChunksInput
    connect?: DocumentWhereUniqueInput
    update?: XOR<XOR<DocumentUpdateToOneWithWhereWithoutChunksInput, DocumentUpdateWithoutChunksInput>, DocumentUncheckedUpdateWithoutChunksInput>
  }

  export type DocumentCreateNestedOneWithoutQuestionItemsInput = {
    create?: XOR<DocumentCreateWithoutQuestionItemsInput, DocumentUncheckedCreateWithoutQuestionItemsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutQuestionItemsInput
    connect?: DocumentWhereUniqueInput
  }

  export type GenerationRunCreateNestedOneWithoutQuestionItemsInput = {
    create?: XOR<GenerationRunCreateWithoutQuestionItemsInput, GenerationRunUncheckedCreateWithoutQuestionItemsInput>
    connectOrCreate?: GenerationRunCreateOrConnectWithoutQuestionItemsInput
    connect?: GenerationRunWhereUniqueInput
  }

  export type QualityReviewCreateNestedManyWithoutItemInput = {
    create?: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput> | QualityReviewCreateWithoutItemInput[] | QualityReviewUncheckedCreateWithoutItemInput[]
    connectOrCreate?: QualityReviewCreateOrConnectWithoutItemInput | QualityReviewCreateOrConnectWithoutItemInput[]
    createMany?: QualityReviewCreateManyItemInputEnvelope
    connect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
  }

  export type QualityReviewUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput> | QualityReviewCreateWithoutItemInput[] | QualityReviewUncheckedCreateWithoutItemInput[]
    connectOrCreate?: QualityReviewCreateOrConnectWithoutItemInput | QualityReviewCreateOrConnectWithoutItemInput[]
    createMany?: QualityReviewCreateManyItemInputEnvelope
    connect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
  }

  export type EnumQuestionItemOriginFieldUpdateOperationsInput = {
    set?: $Enums.QuestionItemOrigin
  }

  export type EnumQuestionItemStatusFieldUpdateOperationsInput = {
    set?: $Enums.QuestionItemStatus
  }

  export type EnumQuestionItemTypeFieldUpdateOperationsInput = {
    set?: $Enums.QuestionItemType
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DocumentUpdateOneWithoutQuestionItemsNestedInput = {
    create?: XOR<DocumentCreateWithoutQuestionItemsInput, DocumentUncheckedCreateWithoutQuestionItemsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutQuestionItemsInput
    upsert?: DocumentUpsertWithoutQuestionItemsInput
    disconnect?: DocumentWhereInput | boolean
    delete?: DocumentWhereInput | boolean
    connect?: DocumentWhereUniqueInput
    update?: XOR<XOR<DocumentUpdateToOneWithWhereWithoutQuestionItemsInput, DocumentUpdateWithoutQuestionItemsInput>, DocumentUncheckedUpdateWithoutQuestionItemsInput>
  }

  export type GenerationRunUpdateOneWithoutQuestionItemsNestedInput = {
    create?: XOR<GenerationRunCreateWithoutQuestionItemsInput, GenerationRunUncheckedCreateWithoutQuestionItemsInput>
    connectOrCreate?: GenerationRunCreateOrConnectWithoutQuestionItemsInput
    upsert?: GenerationRunUpsertWithoutQuestionItemsInput
    disconnect?: GenerationRunWhereInput | boolean
    delete?: GenerationRunWhereInput | boolean
    connect?: GenerationRunWhereUniqueInput
    update?: XOR<XOR<GenerationRunUpdateToOneWithWhereWithoutQuestionItemsInput, GenerationRunUpdateWithoutQuestionItemsInput>, GenerationRunUncheckedUpdateWithoutQuestionItemsInput>
  }

  export type QualityReviewUpdateManyWithoutItemNestedInput = {
    create?: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput> | QualityReviewCreateWithoutItemInput[] | QualityReviewUncheckedCreateWithoutItemInput[]
    connectOrCreate?: QualityReviewCreateOrConnectWithoutItemInput | QualityReviewCreateOrConnectWithoutItemInput[]
    upsert?: QualityReviewUpsertWithWhereUniqueWithoutItemInput | QualityReviewUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: QualityReviewCreateManyItemInputEnvelope
    set?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    disconnect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    delete?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    connect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    update?: QualityReviewUpdateWithWhereUniqueWithoutItemInput | QualityReviewUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: QualityReviewUpdateManyWithWhereWithoutItemInput | QualityReviewUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: QualityReviewScalarWhereInput | QualityReviewScalarWhereInput[]
  }

  export type QualityReviewUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput> | QualityReviewCreateWithoutItemInput[] | QualityReviewUncheckedCreateWithoutItemInput[]
    connectOrCreate?: QualityReviewCreateOrConnectWithoutItemInput | QualityReviewCreateOrConnectWithoutItemInput[]
    upsert?: QualityReviewUpsertWithWhereUniqueWithoutItemInput | QualityReviewUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: QualityReviewCreateManyItemInputEnvelope
    set?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    disconnect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    delete?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    connect?: QualityReviewWhereUniqueInput | QualityReviewWhereUniqueInput[]
    update?: QualityReviewUpdateWithWhereUniqueWithoutItemInput | QualityReviewUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: QualityReviewUpdateManyWithWhereWithoutItemInput | QualityReviewUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: QualityReviewScalarWhereInput | QualityReviewScalarWhereInput[]
  }

  export type QuestionItemCreateNestedManyWithoutGenerationRunInput = {
    create?: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput> | QuestionItemCreateWithoutGenerationRunInput[] | QuestionItemUncheckedCreateWithoutGenerationRunInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutGenerationRunInput | QuestionItemCreateOrConnectWithoutGenerationRunInput[]
    createMany?: QuestionItemCreateManyGenerationRunInputEnvelope
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
  }

  export type QuestionItemUncheckedCreateNestedManyWithoutGenerationRunInput = {
    create?: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput> | QuestionItemCreateWithoutGenerationRunInput[] | QuestionItemUncheckedCreateWithoutGenerationRunInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutGenerationRunInput | QuestionItemCreateOrConnectWithoutGenerationRunInput[]
    createMany?: QuestionItemCreateManyGenerationRunInputEnvelope
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
  }

  export type EnumGenerationRunStatusFieldUpdateOperationsInput = {
    set?: $Enums.GenerationRunStatus
  }

  export type QuestionItemUpdateManyWithoutGenerationRunNestedInput = {
    create?: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput> | QuestionItemCreateWithoutGenerationRunInput[] | QuestionItemUncheckedCreateWithoutGenerationRunInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutGenerationRunInput | QuestionItemCreateOrConnectWithoutGenerationRunInput[]
    upsert?: QuestionItemUpsertWithWhereUniqueWithoutGenerationRunInput | QuestionItemUpsertWithWhereUniqueWithoutGenerationRunInput[]
    createMany?: QuestionItemCreateManyGenerationRunInputEnvelope
    set?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    disconnect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    delete?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    update?: QuestionItemUpdateWithWhereUniqueWithoutGenerationRunInput | QuestionItemUpdateWithWhereUniqueWithoutGenerationRunInput[]
    updateMany?: QuestionItemUpdateManyWithWhereWithoutGenerationRunInput | QuestionItemUpdateManyWithWhereWithoutGenerationRunInput[]
    deleteMany?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
  }

  export type QuestionItemUncheckedUpdateManyWithoutGenerationRunNestedInput = {
    create?: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput> | QuestionItemCreateWithoutGenerationRunInput[] | QuestionItemUncheckedCreateWithoutGenerationRunInput[]
    connectOrCreate?: QuestionItemCreateOrConnectWithoutGenerationRunInput | QuestionItemCreateOrConnectWithoutGenerationRunInput[]
    upsert?: QuestionItemUpsertWithWhereUniqueWithoutGenerationRunInput | QuestionItemUpsertWithWhereUniqueWithoutGenerationRunInput[]
    createMany?: QuestionItemCreateManyGenerationRunInputEnvelope
    set?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    disconnect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    delete?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    connect?: QuestionItemWhereUniqueInput | QuestionItemWhereUniqueInput[]
    update?: QuestionItemUpdateWithWhereUniqueWithoutGenerationRunInput | QuestionItemUpdateWithWhereUniqueWithoutGenerationRunInput[]
    updateMany?: QuestionItemUpdateManyWithWhereWithoutGenerationRunInput | QuestionItemUpdateManyWithWhereWithoutGenerationRunInput[]
    deleteMany?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
  }

  export type QuestionItemCreateNestedOneWithoutReviewsInput = {
    create?: XOR<QuestionItemCreateWithoutReviewsInput, QuestionItemUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: QuestionItemCreateOrConnectWithoutReviewsInput
    connect?: QuestionItemWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuestionItemUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: XOR<QuestionItemCreateWithoutReviewsInput, QuestionItemUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: QuestionItemCreateOrConnectWithoutReviewsInput
    upsert?: QuestionItemUpsertWithoutReviewsInput
    connect?: QuestionItemWhereUniqueInput
    update?: XOR<XOR<QuestionItemUpdateToOneWithWhereWithoutReviewsInput, QuestionItemUpdateWithoutReviewsInput>, QuestionItemUncheckedUpdateWithoutReviewsInput>
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

  export type NestedEnumDocumentKindFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentKind | EnumDocumentKindFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentKindFilter<$PrismaModel> | $Enums.DocumentKind
  }

  export type NestedEnumExtractionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ExtractionStatus | EnumExtractionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExtractionStatusFilter<$PrismaModel> | $Enums.ExtractionStatus
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

  export type NestedEnumDocumentKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentKind | EnumDocumentKindFieldRefInput<$PrismaModel>
    in?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    notIn?: $Enums.DocumentKind[] | ListEnumDocumentKindFieldRefInput<$PrismaModel>
    not?: NestedEnumDocumentKindWithAggregatesFilter<$PrismaModel> | $Enums.DocumentKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDocumentKindFilter<$PrismaModel>
    _max?: NestedEnumDocumentKindFilter<$PrismaModel>
  }

  export type NestedEnumExtractionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExtractionStatus | EnumExtractionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExtractionStatus[] | ListEnumExtractionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumExtractionStatusWithAggregatesFilter<$PrismaModel> | $Enums.ExtractionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExtractionStatusFilter<$PrismaModel>
    _max?: NestedEnumExtractionStatusFilter<$PrismaModel>
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

  export type NestedEnumQuestionItemOriginFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemOrigin | EnumQuestionItemOriginFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemOriginFilter<$PrismaModel> | $Enums.QuestionItemOrigin
  }

  export type NestedEnumQuestionItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemStatus | EnumQuestionItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemStatusFilter<$PrismaModel> | $Enums.QuestionItemStatus
  }

  export type NestedEnumQuestionItemTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemType | EnumQuestionItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemTypeFilter<$PrismaModel> | $Enums.QuestionItemType
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

  export type NestedEnumQuestionItemOriginWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemOrigin | EnumQuestionItemOriginFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemOrigin[] | ListEnumQuestionItemOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemOriginWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemOrigin
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemOriginFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemOriginFilter<$PrismaModel>
  }

  export type NestedEnumQuestionItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemStatus | EnumQuestionItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemStatus[] | ListEnumQuestionItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemStatusFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemStatusFilter<$PrismaModel>
  }

  export type NestedEnumQuestionItemTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuestionItemType | EnumQuestionItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.QuestionItemType[] | ListEnumQuestionItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumQuestionItemTypeWithAggregatesFilter<$PrismaModel> | $Enums.QuestionItemType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuestionItemTypeFilter<$PrismaModel>
    _max?: NestedEnumQuestionItemTypeFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
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

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type NestedEnumGenerationRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationRunStatus | EnumGenerationRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationRunStatusFilter<$PrismaModel> | $Enums.GenerationRunStatus
  }

  export type NestedEnumGenerationRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GenerationRunStatus | EnumGenerationRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.GenerationRunStatus[] | ListEnumGenerationRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumGenerationRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.GenerationRunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGenerationRunStatusFilter<$PrismaModel>
    _max?: NestedEnumGenerationRunStatusFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type ChunkCreateWithoutDocumentInput = {
    id?: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
  }

  export type ChunkUncheckedCreateWithoutDocumentInput = {
    id?: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
  }

  export type ChunkCreateOrConnectWithoutDocumentInput = {
    where: ChunkWhereUniqueInput
    create: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput>
  }

  export type ChunkCreateManyDocumentInputEnvelope = {
    data: ChunkCreateManyDocumentInput | ChunkCreateManyDocumentInput[]
    skipDuplicates?: boolean
  }

  export type QuestionItemCreateWithoutDocumentInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    generationRun?: GenerationRunCreateNestedOneWithoutQuestionItemsInput
    reviews?: QualityReviewCreateNestedManyWithoutItemInput
  }

  export type QuestionItemUncheckedCreateWithoutDocumentInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    generationRunId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    reviews?: QualityReviewUncheckedCreateNestedManyWithoutItemInput
  }

  export type QuestionItemCreateOrConnectWithoutDocumentInput = {
    where: QuestionItemWhereUniqueInput
    create: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput>
  }

  export type QuestionItemCreateManyDocumentInputEnvelope = {
    data: QuestionItemCreateManyDocumentInput | QuestionItemCreateManyDocumentInput[]
    skipDuplicates?: boolean
  }

  export type ChunkUpsertWithWhereUniqueWithoutDocumentInput = {
    where: ChunkWhereUniqueInput
    update: XOR<ChunkUpdateWithoutDocumentInput, ChunkUncheckedUpdateWithoutDocumentInput>
    create: XOR<ChunkCreateWithoutDocumentInput, ChunkUncheckedCreateWithoutDocumentInput>
  }

  export type ChunkUpdateWithWhereUniqueWithoutDocumentInput = {
    where: ChunkWhereUniqueInput
    data: XOR<ChunkUpdateWithoutDocumentInput, ChunkUncheckedUpdateWithoutDocumentInput>
  }

  export type ChunkUpdateManyWithWhereWithoutDocumentInput = {
    where: ChunkScalarWhereInput
    data: XOR<ChunkUpdateManyMutationInput, ChunkUncheckedUpdateManyWithoutDocumentInput>
  }

  export type ChunkScalarWhereInput = {
    AND?: ChunkScalarWhereInput | ChunkScalarWhereInput[]
    OR?: ChunkScalarWhereInput[]
    NOT?: ChunkScalarWhereInput | ChunkScalarWhereInput[]
    id?: StringFilter<"Chunk"> | string
    documentId?: StringFilter<"Chunk"> | string
    ordinal?: IntFilter<"Chunk"> | number
    text?: StringFilter<"Chunk"> | string
    tokenCount?: IntFilter<"Chunk"> | number
    createdAt?: DateTimeFilter<"Chunk"> | Date | string
  }

  export type QuestionItemUpsertWithWhereUniqueWithoutDocumentInput = {
    where: QuestionItemWhereUniqueInput
    update: XOR<QuestionItemUpdateWithoutDocumentInput, QuestionItemUncheckedUpdateWithoutDocumentInput>
    create: XOR<QuestionItemCreateWithoutDocumentInput, QuestionItemUncheckedCreateWithoutDocumentInput>
  }

  export type QuestionItemUpdateWithWhereUniqueWithoutDocumentInput = {
    where: QuestionItemWhereUniqueInput
    data: XOR<QuestionItemUpdateWithoutDocumentInput, QuestionItemUncheckedUpdateWithoutDocumentInput>
  }

  export type QuestionItemUpdateManyWithWhereWithoutDocumentInput = {
    where: QuestionItemScalarWhereInput
    data: XOR<QuestionItemUpdateManyMutationInput, QuestionItemUncheckedUpdateManyWithoutDocumentInput>
  }

  export type QuestionItemScalarWhereInput = {
    AND?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
    OR?: QuestionItemScalarWhereInput[]
    NOT?: QuestionItemScalarWhereInput | QuestionItemScalarWhereInput[]
    id?: StringFilter<"QuestionItem"> | string
    fingerprint?: StringFilter<"QuestionItem"> | string
    examSlug?: StringFilter<"QuestionItem"> | string
    subject?: StringFilter<"QuestionItem"> | string
    subjectSlug?: StringFilter<"QuestionItem"> | string
    emphasis?: StringNullableFilter<"QuestionItem"> | string | null
    origin?: EnumQuestionItemOriginFilter<"QuestionItem"> | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFilter<"QuestionItem"> | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFilter<"QuestionItem"> | $Enums.QuestionItemType
    prompt?: StringFilter<"QuestionItem"> | string
    options?: JsonNullableFilter<"QuestionItem">
    correctIndex?: IntNullableFilter<"QuestionItem"> | number | null
    referenceAnswer?: StringNullableFilter<"QuestionItem"> | string | null
    explanation?: StringNullableFilter<"QuestionItem"> | string | null
    locale?: StringFilter<"QuestionItem"> | string
    documentId?: StringNullableFilter<"QuestionItem"> | string | null
    generationRunId?: StringNullableFilter<"QuestionItem"> | string | null
    qualityScore?: FloatNullableFilter<"QuestionItem"> | number | null
    qualityNotes?: StringNullableFilter<"QuestionItem"> | string | null
    failReasons?: JsonFilter<"QuestionItem">
    reviewCount?: IntFilter<"QuestionItem"> | number
    createdAt?: DateTimeFilter<"QuestionItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuestionItem"> | Date | string
    publishedAt?: DateTimeNullableFilter<"QuestionItem"> | Date | string | null
  }

  export type DocumentCreateWithoutChunksInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    questionItems?: QuestionItemCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateWithoutChunksInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    questionItems?: QuestionItemUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentCreateOrConnectWithoutChunksInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutChunksInput, DocumentUncheckedCreateWithoutChunksInput>
  }

  export type DocumentUpsertWithoutChunksInput = {
    update: XOR<DocumentUpdateWithoutChunksInput, DocumentUncheckedUpdateWithoutChunksInput>
    create: XOR<DocumentCreateWithoutChunksInput, DocumentUncheckedCreateWithoutChunksInput>
    where?: DocumentWhereInput
  }

  export type DocumentUpdateToOneWithWhereWithoutChunksInput = {
    where?: DocumentWhereInput
    data: XOR<DocumentUpdateWithoutChunksInput, DocumentUncheckedUpdateWithoutChunksInput>
  }

  export type DocumentUpdateWithoutChunksInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questionItems?: QuestionItemUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateWithoutChunksInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    questionItems?: QuestionItemUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentCreateWithoutQuestionItemsInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    chunks?: ChunkCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateWithoutQuestionItemsInput = {
    id?: string
    discoveryArtifactId?: string | null
    examSlug: string
    examTitle?: string | null
    kind?: $Enums.DocumentKind
    sourceUrl?: string | null
    storageKey?: string | null
    checksum?: string | null
    contentType?: string | null
    status?: $Enums.ExtractionStatus
    failReason?: string | null
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    chunks?: ChunkUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentCreateOrConnectWithoutQuestionItemsInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutQuestionItemsInput, DocumentUncheckedCreateWithoutQuestionItemsInput>
  }

  export type GenerationRunCreateWithoutQuestionItemsInput = {
    id?: string
    examSlug: string
    subject: string
    status?: $Enums.GenerationRunStatus
    requested?: number
    drafted?: number
    chunksUsed?: number
    model?: string | null
    error?: string | null
    startedAt?: Date | string
    finishedAt?: Date | string | null
  }

  export type GenerationRunUncheckedCreateWithoutQuestionItemsInput = {
    id?: string
    examSlug: string
    subject: string
    status?: $Enums.GenerationRunStatus
    requested?: number
    drafted?: number
    chunksUsed?: number
    model?: string | null
    error?: string | null
    startedAt?: Date | string
    finishedAt?: Date | string | null
  }

  export type GenerationRunCreateOrConnectWithoutQuestionItemsInput = {
    where: GenerationRunWhereUniqueInput
    create: XOR<GenerationRunCreateWithoutQuestionItemsInput, GenerationRunUncheckedCreateWithoutQuestionItemsInput>
  }

  export type QualityReviewCreateWithoutItemInput = {
    id?: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
  }

  export type QualityReviewUncheckedCreateWithoutItemInput = {
    id?: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
  }

  export type QualityReviewCreateOrConnectWithoutItemInput = {
    where: QualityReviewWhereUniqueInput
    create: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput>
  }

  export type QualityReviewCreateManyItemInputEnvelope = {
    data: QualityReviewCreateManyItemInput | QualityReviewCreateManyItemInput[]
    skipDuplicates?: boolean
  }

  export type DocumentUpsertWithoutQuestionItemsInput = {
    update: XOR<DocumentUpdateWithoutQuestionItemsInput, DocumentUncheckedUpdateWithoutQuestionItemsInput>
    create: XOR<DocumentCreateWithoutQuestionItemsInput, DocumentUncheckedCreateWithoutQuestionItemsInput>
    where?: DocumentWhereInput
  }

  export type DocumentUpdateToOneWithWhereWithoutQuestionItemsInput = {
    where?: DocumentWhereInput
    data: XOR<DocumentUpdateWithoutQuestionItemsInput, DocumentUncheckedUpdateWithoutQuestionItemsInput>
  }

  export type DocumentUpdateWithoutQuestionItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chunks?: ChunkUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateWithoutQuestionItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    discoveryArtifactId?: NullableStringFieldUpdateOperationsInput | string | null
    examSlug?: StringFieldUpdateOperationsInput | string
    examTitle?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumDocumentKindFieldUpdateOperationsInput | $Enums.DocumentKind
    sourceUrl?: NullableStringFieldUpdateOperationsInput | string | null
    storageKey?: NullableStringFieldUpdateOperationsInput | string | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    contentType?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumExtractionStatusFieldUpdateOperationsInput | $Enums.ExtractionStatus
    failReason?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chunks?: ChunkUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type GenerationRunUpsertWithoutQuestionItemsInput = {
    update: XOR<GenerationRunUpdateWithoutQuestionItemsInput, GenerationRunUncheckedUpdateWithoutQuestionItemsInput>
    create: XOR<GenerationRunCreateWithoutQuestionItemsInput, GenerationRunUncheckedCreateWithoutQuestionItemsInput>
    where?: GenerationRunWhereInput
  }

  export type GenerationRunUpdateToOneWithWhereWithoutQuestionItemsInput = {
    where?: GenerationRunWhereInput
    data: XOR<GenerationRunUpdateWithoutQuestionItemsInput, GenerationRunUncheckedUpdateWithoutQuestionItemsInput>
  }

  export type GenerationRunUpdateWithoutQuestionItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GenerationRunUncheckedUpdateWithoutQuestionItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    status?: EnumGenerationRunStatusFieldUpdateOperationsInput | $Enums.GenerationRunStatus
    requested?: IntFieldUpdateOperationsInput | number
    drafted?: IntFieldUpdateOperationsInput | number
    chunksUsed?: IntFieldUpdateOperationsInput | number
    model?: NullableStringFieldUpdateOperationsInput | string | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QualityReviewUpsertWithWhereUniqueWithoutItemInput = {
    where: QualityReviewWhereUniqueInput
    update: XOR<QualityReviewUpdateWithoutItemInput, QualityReviewUncheckedUpdateWithoutItemInput>
    create: XOR<QualityReviewCreateWithoutItemInput, QualityReviewUncheckedCreateWithoutItemInput>
  }

  export type QualityReviewUpdateWithWhereUniqueWithoutItemInput = {
    where: QualityReviewWhereUniqueInput
    data: XOR<QualityReviewUpdateWithoutItemInput, QualityReviewUncheckedUpdateWithoutItemInput>
  }

  export type QualityReviewUpdateManyWithWhereWithoutItemInput = {
    where: QualityReviewScalarWhereInput
    data: XOR<QualityReviewUpdateManyMutationInput, QualityReviewUncheckedUpdateManyWithoutItemInput>
  }

  export type QualityReviewScalarWhereInput = {
    AND?: QualityReviewScalarWhereInput | QualityReviewScalarWhereInput[]
    OR?: QualityReviewScalarWhereInput[]
    NOT?: QualityReviewScalarWhereInput | QualityReviewScalarWhereInput[]
    id?: StringFilter<"QualityReview"> | string
    itemId?: StringFilter<"QualityReview"> | string
    stage?: StringFilter<"QualityReview"> | string
    decision?: StringFilter<"QualityReview"> | string
    score?: FloatFilter<"QualityReview"> | number
    notes?: StringNullableFilter<"QualityReview"> | string | null
    reasons?: JsonFilter<"QualityReview">
    model?: StringNullableFilter<"QualityReview"> | string | null
    createdAt?: DateTimeFilter<"QualityReview"> | Date | string
  }

  export type QuestionItemCreateWithoutGenerationRunInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    document?: DocumentCreateNestedOneWithoutQuestionItemsInput
    reviews?: QualityReviewCreateNestedManyWithoutItemInput
  }

  export type QuestionItemUncheckedCreateWithoutGenerationRunInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    documentId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    reviews?: QualityReviewUncheckedCreateNestedManyWithoutItemInput
  }

  export type QuestionItemCreateOrConnectWithoutGenerationRunInput = {
    where: QuestionItemWhereUniqueInput
    create: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput>
  }

  export type QuestionItemCreateManyGenerationRunInputEnvelope = {
    data: QuestionItemCreateManyGenerationRunInput | QuestionItemCreateManyGenerationRunInput[]
    skipDuplicates?: boolean
  }

  export type QuestionItemUpsertWithWhereUniqueWithoutGenerationRunInput = {
    where: QuestionItemWhereUniqueInput
    update: XOR<QuestionItemUpdateWithoutGenerationRunInput, QuestionItemUncheckedUpdateWithoutGenerationRunInput>
    create: XOR<QuestionItemCreateWithoutGenerationRunInput, QuestionItemUncheckedCreateWithoutGenerationRunInput>
  }

  export type QuestionItemUpdateWithWhereUniqueWithoutGenerationRunInput = {
    where: QuestionItemWhereUniqueInput
    data: XOR<QuestionItemUpdateWithoutGenerationRunInput, QuestionItemUncheckedUpdateWithoutGenerationRunInput>
  }

  export type QuestionItemUpdateManyWithWhereWithoutGenerationRunInput = {
    where: QuestionItemScalarWhereInput
    data: XOR<QuestionItemUpdateManyMutationInput, QuestionItemUncheckedUpdateManyWithoutGenerationRunInput>
  }

  export type QuestionItemCreateWithoutReviewsInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
    document?: DocumentCreateNestedOneWithoutQuestionItemsInput
    generationRun?: GenerationRunCreateNestedOneWithoutQuestionItemsInput
  }

  export type QuestionItemUncheckedCreateWithoutReviewsInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    documentId?: string | null
    generationRunId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
  }

  export type QuestionItemCreateOrConnectWithoutReviewsInput = {
    where: QuestionItemWhereUniqueInput
    create: XOR<QuestionItemCreateWithoutReviewsInput, QuestionItemUncheckedCreateWithoutReviewsInput>
  }

  export type QuestionItemUpsertWithoutReviewsInput = {
    update: XOR<QuestionItemUpdateWithoutReviewsInput, QuestionItemUncheckedUpdateWithoutReviewsInput>
    create: XOR<QuestionItemCreateWithoutReviewsInput, QuestionItemUncheckedCreateWithoutReviewsInput>
    where?: QuestionItemWhereInput
  }

  export type QuestionItemUpdateToOneWithWhereWithoutReviewsInput = {
    where?: QuestionItemWhereInput
    data: XOR<QuestionItemUpdateWithoutReviewsInput, QuestionItemUncheckedUpdateWithoutReviewsInput>
  }

  export type QuestionItemUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    document?: DocumentUpdateOneWithoutQuestionItemsNestedInput
    generationRun?: GenerationRunUpdateOneWithoutQuestionItemsNestedInput
  }

  export type QuestionItemUncheckedUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    documentId?: NullableStringFieldUpdateOperationsInput | string | null
    generationRunId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ChunkCreateManyDocumentInput = {
    id?: string
    ordinal: number
    text: string
    tokenCount?: number
    createdAt?: Date | string
  }

  export type QuestionItemCreateManyDocumentInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    generationRunId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
  }

  export type ChunkUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChunkUncheckedUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChunkUncheckedUpdateManyWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    ordinal?: IntFieldUpdateOperationsInput | number
    text?: StringFieldUpdateOperationsInput | string
    tokenCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionItemUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    generationRun?: GenerationRunUpdateOneWithoutQuestionItemsNestedInput
    reviews?: QualityReviewUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemUncheckedUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    generationRunId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviews?: QualityReviewUncheckedUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemUncheckedUpdateManyWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    generationRunId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QualityReviewCreateManyItemInput = {
    id?: string
    stage: string
    decision: string
    score: number
    notes?: string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: string | null
    createdAt?: Date | string
  }

  export type QualityReviewUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QualityReviewUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QualityReviewUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    stage?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    reasons?: JsonNullValueInput | InputJsonValue
    model?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuestionItemCreateManyGenerationRunInput = {
    id?: string
    fingerprint: string
    examSlug: string
    subject: string
    subjectSlug: string
    emphasis?: string | null
    origin: $Enums.QuestionItemOrigin
    status?: $Enums.QuestionItemStatus
    type: $Enums.QuestionItemType
    prompt: string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: number | null
    referenceAnswer?: string | null
    explanation?: string | null
    locale?: string
    documentId?: string | null
    qualityScore?: number | null
    qualityNotes?: string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string | null
  }

  export type QuestionItemUpdateWithoutGenerationRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    document?: DocumentUpdateOneWithoutQuestionItemsNestedInput
    reviews?: QualityReviewUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemUncheckedUpdateWithoutGenerationRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    documentId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviews?: QualityReviewUncheckedUpdateManyWithoutItemNestedInput
  }

  export type QuestionItemUncheckedUpdateManyWithoutGenerationRunInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    examSlug?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    subjectSlug?: StringFieldUpdateOperationsInput | string
    emphasis?: NullableStringFieldUpdateOperationsInput | string | null
    origin?: EnumQuestionItemOriginFieldUpdateOperationsInput | $Enums.QuestionItemOrigin
    status?: EnumQuestionItemStatusFieldUpdateOperationsInput | $Enums.QuestionItemStatus
    type?: EnumQuestionItemTypeFieldUpdateOperationsInput | $Enums.QuestionItemType
    prompt?: StringFieldUpdateOperationsInput | string
    options?: NullableJsonNullValueInput | InputJsonValue
    correctIndex?: NullableIntFieldUpdateOperationsInput | number | null
    referenceAnswer?: NullableStringFieldUpdateOperationsInput | string | null
    explanation?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    documentId?: NullableStringFieldUpdateOperationsInput | string | null
    qualityScore?: NullableFloatFieldUpdateOperationsInput | number | null
    qualityNotes?: NullableStringFieldUpdateOperationsInput | string | null
    failReasons?: JsonNullValueInput | InputJsonValue
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
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