import type {
  Empty,
  Digit,
  Letter,
  Trim,
  TrimLeft,
  Expand,
  UnionToIntersection,
} from "./utils";

type TakeValueModifiers<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? TakeValueModifiers<Tail>
    : Head extends "!" | "]"
    ? `${Head}${TakeValueModifiers<Tail>}`
    : ""
  : T;

type TakeValueToken<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? TakeValueModifiers<Tail>
    : `${Head}${TakeValueToken<Tail>}`
  : T;

type TakeValue<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? TakeValue<Tail>
    : Head extends Digit
    ? TakeValue<Tail>
    : Head extends "["
    ? `${Head}${TakeValue<Tail>}`
    : Head extends Letter | "_"
    ? `${Head}${TakeValueToken<Tail>}`
    : ""
  : T;

type TakeToken<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? ""
    : `${Head}${TakeToken<Tail>}`
  : T;

type FirstToken<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? FirstToken<Tail>
    : `${Head}${TakeToken<Tail>}`
  : T;

type SkipValueModifiers<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty | "!" | "]"
    ? SkipValueModifiers<Tail>
    : `${Head}${Tail}`
  : T;

type SkipValueToken<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty
    ? SkipValueModifiers<T>
    : SkipValueToken<Tail>
  : T;

type SkipValue<T> = T extends `${infer Head}${infer Tail}`
  ? Head extends Empty | Digit | "["
    ? SkipValue<Tail>
    : Head extends Letter | "_"
    ? SkipValueToken<Tail>
    : T
  : T;

type StripDescriptions<TSchema> =
  TSchema extends `${infer Before}"""${infer _}"""${infer After}`
    ? StripDescriptions<`${Before}${After}`>
    : TSchema extends `${infer Before}"""${infer _}`
    ? StripDescriptions<Before>
    : TSchema extends `${infer Before}"${infer Middle}\n${infer After}`
    ? Middle extends `${infer _}"${infer _}`
      ? StripDescriptions<`${Before}\n${After}`>
      : StripDescriptions<Before>
    : TSchema;

type StripComments<TSchema> =
  TSchema extends `${infer Before}#${infer _}\n${infer After}`
    ? StripComments<`${Before}\n${After}`>
    : TSchema;

type StripDirectiveDecorators<T> = FirstToken<T> extends `${infer First}`
  ? T extends `${infer _}${First}${infer Rest}`
    ? FirstToken<Rest> extends "|"
      ? Rest extends `${infer _}|${infer Rest}`
        ? StripDirectiveDecorators<Rest>
        : never
      : Rest
    : never
  : never;

type StripDirectiveDeclarations<TSchema> =
  TSchema extends `${infer Before} directive ${infer _} on ${infer After}`
    ? StripDirectiveDecorators<After> extends `${infer Stripped}`
      ? `${Before}${StripDirectiveDeclarations<Stripped>}`
      : TSchema
    : TSchema;

type StripDirectiveInvocations<TSchema> =
  TSchema extends `${infer Before}@${infer Name}(${infer _})${infer Rest}`
    ? Trim<Name> extends `${infer _}${Empty}${infer _}`
      ? TSchema extends `${infer _}@${infer Rest}`
        ? TrimLeft<Rest> extends `${infer _}${Empty}${infer Rest}`
          ? `${Before}${StripDirectiveInvocations<TrimLeft<Rest>>}`
          : TSchema
        : TSchema
      : `${Before}${StripDirectiveInvocations<TrimLeft<Rest>>}`
    : TSchema extends `${infer Before}@${infer Rest}`
    ? TrimLeft<Rest> extends `${infer _}${Empty}${infer Rest}`
      ? `${Before}${StripDirectiveInvocations<TrimLeft<Rest>>}`
      : TSchema
    : TSchema;

type StripDirectives<TSchema> =
  StripDirectiveDeclarations<TSchema> extends `${infer WithoutDirectiveDeclarations}`
    ? StripDirectiveInvocations<WithoutDirectiveDeclarations>
    : never;

type ParseEnumSignature<TSignature> =
  TSignature extends `${infer _}${Empty}${infer _}`
    ? FirstToken<TSignature> extends `${infer Head}`
      ? Head extends ""
        ? never
        : TrimLeft<TSignature> extends `${Head}${infer Rest}`
        ? Head | ParseEnumSignature<Rest>
        : never
      : never
    : FirstToken<TSignature>;

type ParseEnums<TSchema> =
  TSchema extends `${infer _}enum ${infer Name}{${infer Signature}}${infer Rest}`
    ? {
        [K in Trim<Name>]: ParseEnumSignature<Signature>;
      } & ParseEnums<Rest>
    : {};

export type GraphEnums<TSchema> = ParseEnums<TSchema> extends infer Enums
  ? Expand<Enums>
  : never;

type ParseValue<
  TValue extends string,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TValue extends "Int"
  ? number
  : TValue extends "Float"
  ? number
  : TValue extends "String"
  ? string
  : TValue extends "Boolean"
  ? boolean
  : TValue extends "ID"
  ? string
  : TValue extends keyof TEnums
  ? TEnums[TValue]
  : TValue extends keyof TUnions
  ? TUnions[TValue]
  : TValue;

type ParseNullableModifier<
  TValue extends string,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TValue extends `${infer Value}!`
  ? ParseValue<Value, TEnums, TUnions>
  : ParseValue<TValue, TEnums, TUnions> | undefined;

type ParseListModifier<
  TValue extends string,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TValue extends `[${infer Inner}]!`
  ? ParseListModifier<Inner, TEnums, TUnions>[]
  : TValue extends `[${infer Inner}]`
  ? ParseListModifier<Inner, TEnums, TUnions>[] | undefined
  : ParseNullableModifier<TValue, TEnums, TUnions>;

type ParseFieldValue<
  TValue extends string,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TValue extends `[${infer _}]`
  ? ParseListModifier<TValue, TEnums, TUnions>
  : TValue extends `[${infer _}]!`
  ? ParseListModifier<TValue, TEnums, TUnions>
  : ParseNullableModifier<TValue, TEnums, TUnions>;

type ParseField<
  TField extends string,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TField extends `${infer Key}:${infer Value}`
  ? { [K in Key]: ParseFieldValue<Value, TEnums, TUnions> }
  : never;

type ParseTypeSignature<TSignature> =
  TSignature extends `${infer Key}(${infer _})${infer _}:${infer Value}`
    ? Key extends `${infer _}:${infer _}`
      ? TSignature extends `${infer Key}:${infer Value}`
        ?
            | `${Trim<Key>}:${TakeValue<Value>}`
            | ParseTypeSignature<SkipValue<Value>>
        : never
      :
          | `${Trim<Key>}:${TakeValue<Value>}`
          | ParseTypeSignature<SkipValue<Value>>
    : TSignature extends `${infer Key}:${infer Value}`
    ? `${Trim<Key>}:${TakeValue<Value>}` | ParseTypeSignature<SkipValue<Value>>
    : never;

type ParseFields<
  TSignature,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = Expand<
  UnionToIntersection<
    ParseField<ParseTypeSignature<TSignature>, TEnums, TUnions>
  >
>;

type ParseInterfaces<
  TSchema,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSchema extends `${infer _}interface ${infer RawName}{${infer Signature}}${infer Rest}`
  ? RawName extends `${infer Name} implements ${infer _}`
    ? Trim<Name> extends `${infer InterfaceName}`
      ? {
          [K in InterfaceName]: ParseFields<Signature, TEnums, TUnions>;
        } & ParseInterfaces<Rest, TEnums, TUnions>
      : {} & ParseInterfaces<Rest, TEnums, TUnions>
    : Trim<RawName> extends `${infer InterfaceName}`
    ? {
        [K in InterfaceName]: ParseFields<Signature, TEnums, TUnions>;
      } & ParseInterfaces<Rest, TEnums, TUnions>
    : {} & ParseInterfaces<Rest, TEnums, TUnions>
  : {};

export type GraphInterfaces<
  TSchema,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = ParseInterfaces<TSchema, TEnums, TUnions> extends infer Interfaces
  ? Expand<Interfaces>
  : never;

type ParseUnionSignature<TSignature> =
  FirstToken<TSignature> extends `${infer First}`
    ? TSignature extends `${infer _}${First}${infer Rest}`
      ? FirstToken<Rest> extends "|"
        ? Rest extends `${infer _}|${infer Rest}`
          ? First | ParseUnionSignature<Rest>
          : never
        : First
      : never
    : never;

type ParseUnions<TSchema> =
  TSchema extends `${infer _}union ${infer Name}=${infer Rest}`
    ? {
        [UnionName in Trim<Name>]: ParseUnionSignature<Rest>;
      } & ParseUnions<Rest>
    : {};

export type GraphUnions<TSchema> = ParseUnions<TSchema> extends infer Unions
  ? Expand<Unions>
  : never;

type ParseTypes<
  TSchema,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSchema extends `${infer _}type ${infer RawName}{${infer Signature}}${infer Rest}`
  ? RawName extends `${infer Name} implements ${infer _}`
    ? Trim<Name> extends `${infer TypeName}`
      ? TypeName extends "Query" | "Mutation"
        ? {} & ParseTypes<Rest, TEnums, TUnions>
        : {
            [K in TypeName]: ParseFields<Signature, TEnums, TUnions>;
          } & ParseTypes<Rest, TEnums, TUnions>
      : {} & ParseTypes<Rest, TEnums, TUnions>
    : Trim<RawName> extends `${infer TypeName}`
    ? TypeName extends "Query" | "Mutation"
      ? {} & ParseTypes<Rest, TEnums, TUnions>
      : {
          [K in TypeName]: ParseFields<Signature, TEnums, TUnions>;
        } & ParseTypes<Rest, TEnums, TUnions>
    : {} & ParseTypes<Rest, TEnums, TUnions>
  : {};

type ParseToken<TInternal, TExternal, TToken> = TToken extends Array<infer _>
  ? { [Token in keyof TToken]: ParseToken<TInternal, TExternal, TToken[Token]> }
  : TToken extends keyof TInternal
  ? TInternal[TToken] extends infer Ref extends Record<string, any>
    ? { [Token in keyof Ref]: ParseToken<TInternal, TExternal, Ref[Token]> }
    : TInternal[TToken]
  : TToken extends keyof TExternal
  ? TExternal[TToken] extends infer Ref extends Record<string, any>
    ? { [Token in keyof Ref]: ParseToken<TInternal, TExternal, Ref[Token]> }
    : TExternal[TToken]
  : TToken;

type ParseTokens<TInternal, TExternal = unknown> = {
  [TypeName in keyof TInternal]: TInternal[TypeName] extends infer Type
    ? {
        [TypeKey in keyof Type]: Type[TypeKey] extends infer TypeValue
          ? TypeValue extends Array<unknown> | string
            ? ParseToken<TInternal, TExternal, TypeValue>
            : TypeValue
          : never;
      }
    : never;
};

// TODO: add `Mutation` type inference
// TODO: add `Subscription` type inference
// TODO: input object types
export type GraphOutputTypes<TSchema> = StripDescriptions<
  StripComments<StripDirectives<TSchema>>
> extends infer Stripped
  ? ParseEnums<Stripped> extends infer Enums extends Record<string, unknown>
    ? ParseUnions<Stripped> extends infer Unions extends Record<string, unknown>
      ? ParseInterfaces<Stripped, Enums, Unions> extends infer Interfaces
        ? Expand<ParseTypes<Stripped, Enums, Unions>> extends infer Types
          ? ParseTokens<Types, Interfaces>
          : never
        : never
      : never
    : never
  : never;

type ParseQuery<
  TSchema,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSchema extends `${infer _}type ${infer RawName}{${infer Signature}}${infer Rest}`
  ? Trim<RawName> extends `${infer TypeName}`
    ? TypeName extends "Query"
      ? { Query: ParseFields<Signature, TEnums, TUnions> }
      : ParseQuery<Rest, TEnums, TUnions>
    : ParseQuery<Rest, TEnums, TUnions>
  : never;

export type GraphQueryType<TSchema> = StripDescriptions<
  StripComments<StripDirectives<TSchema>>
> extends infer Stripped
  ? ParseEnums<Stripped> extends infer Enums extends Record<string, unknown>
    ? ParseUnions<Stripped> extends infer Unions extends Record<string, unknown>
      ? ParseInterfaces<Stripped, Enums, Unions> extends infer Interfaces
        ? ParseQuery<Stripped, Enums, Unions> extends infer Query
          ? GraphOutputTypes<Stripped> extends infer Types
            ? ParseTokens<
                ParseTokens<Query, Interfaces>,
                Types
              > extends infer Parsed
              ? Parsed extends { Query: infer Output }
                ? Output
                : never
              : never
            : never
          : never
        : never
      : never
    : never
  : never;

type ParseArguments<
  TSignature,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSignature extends `${infer _}:${infer Value}`
  ? [
      ParseFieldValue<TakeValue<Value>, TEnums, TUnions>,
      ...ParseArguments<SkipValue<Value>, TEnums, TUnions>
    ]
  : [];

type ParseQueryResolverSignature<
  TSignature,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSignature extends `${infer Name}(${infer Args})${infer _}:${infer Value}`
  ? Name extends `${infer _}:${infer _}`
    ? TSignature extends `${infer Name}:${infer Value}`
      ? {
          [K in Trim<Name>]: {
            args: [];
            value: ParseFieldValue<TakeValue<Value>, TEnums, TUnions>;
          };
        } & ParseQueryResolverSignature<SkipValue<Value>, TEnums, TUnions>
      : never
    : {
        [K in Trim<Name>]: {
          args: ParseArguments<Args, TEnums, TUnions>;
          value: ParseFieldValue<TakeValue<Value>, TEnums, TUnions>;
        };
      } & ParseQueryResolverSignature<SkipValue<Value>, TEnums, TUnions>
  : TSignature extends `${infer Name}:${infer Value}`
  ? {
      [K in Trim<Name>]: {
        args: [];
        value: ParseFieldValue<TakeValue<Value>, TEnums, TUnions>;
      };
    } & ParseQueryResolverSignature<SkipValue<Value>, TEnums, TUnions>
  : {};

type ParseQueryResolver<
  TSchema,
  TEnums extends Record<string, unknown>,
  TUnions extends Record<string, unknown>
> = TSchema extends `${infer _}type ${infer RawName}{${infer Signature}}${infer Rest}`
  ? Trim<RawName> extends `${infer TypeName}`
    ? TypeName extends "Query"
      ? ParseQueryResolverSignature<Signature, TEnums, TUnions>
      : ParseQueryResolver<Rest, TEnums, TUnions>
    : ParseQueryResolver<Rest, TEnums, TUnions>
  : never;

type QueryResolverMap<TParsedSignature> = {
  [K in keyof TParsedSignature]: TParsedSignature[K] extends {
    args: infer Args extends Array<unknown>;
    value: infer Value;
  }
    ? (...args: Args) => Value
    : never;
};

export type GraphQueryResolvers<TSchema> = StripDescriptions<
  StripComments<StripDirectives<TSchema>>
> extends infer Stripped
  ? ParseEnums<Stripped> extends infer Enums extends Record<string, unknown>
    ? ParseUnions<Stripped> extends infer Unions extends Record<string, unknown>
      ? ParseInterfaces<Stripped, Enums, Unions> extends infer Interfaces
        ? Expand<
            ParseQueryResolver<Stripped, Enums, Unions>
          > extends infer QueryResolvers
          ? GraphOutputTypes<Stripped> extends infer Types
            ? ParseTokens<
                ParseTokens<QueryResolvers, Interfaces>,
                Types
              > extends infer Parsed
              ? QueryResolverMap<Parsed>
              : never
            : never
          : never
        : never
      : never
    : never
  : never;
