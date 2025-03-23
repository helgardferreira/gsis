import type { GraphOutputTypes, GraphQueryType } from ".";

export const typeDefs = `#graphql
  enum Episode {
    NEW_HOPE
    EMPIRE
    JEDI
  }

  enum LengthUnit {
    METER
    FOOT
  }

  directive @lower on FIELD_DEFINITION

  directive @deprecated(
    reason: String = "No longer supported"
  ) on FIELD_DEFINITION | ENUM_VALUE

  directive @upper on FIELD_DEFINITION

  interface Character {
    appearsIn: [Episode]!
    friends: [Character]
    id: ID!
    name: String!
  }

  type Starship {
    id: ID!
    name: String! @lower
    length(unit: LengthUnit = METER): Float @deprecated (reason: "Use \`fullName\`.")
  }

  type Human implements Character {
    appearsIn: [Episode]!
    friends: [Character]
    id: ID!
    name: String! @upper
    starships: [Starship]
    totalCredits: Int
  }

  type Droid implements Character {
    appearsIn: [Episode]!
    friends: [Character]
    id: ID!
    name: String!
    primaryFunction: String
  }

  """
  Members of a Union type need to be concrete Object types; you can’t
  define one using Interface types or other Union types as members.
  """
  union SearchResult = Human | Droid | Starship

  union DroidLike = Droid | Starship

  type Query {
    droid(id: ID!): Droid
    """
    Fetches the hero of a specified Star Wars film.
    """
    hero(
      "The name of the film that the hero appears in."
      episode: Episode
    ): Character
    search(
      id: ID!
      episode: Episode
    ): SearchResult
  }
`;

type ExampleOutput = GraphOutputTypes<typeof typeDefs>;

export const exampleOutput: ExampleOutput = {
  Starship: {
    id: "",
    name: "",
    length: undefined,
  },
  Human: {
    id: "",
    name: "",
    appearsIn: [],
    friends: [
      {
        id: "",
        name: "",
        appearsIn: [],
        friends: [
          {
            id: "",
            name: "",
            appearsIn: [],
            friends: undefined,
          },
        ],
      },
    ],
    starships: undefined,
    totalCredits: undefined,
  },
  Droid: {
    id: "",
    name: "",
    appearsIn: [],
    friends: undefined,
    primaryFunction: undefined,
  },
};

type ExampleQuery = GraphQueryType<typeof typeDefs>;

export const exampleQuery: ExampleQuery = {
  droid: {
    id: "",
    name: "",
    appearsIn: [],
    friends: undefined,
    primaryFunction: undefined,
  },
  hero: {
    id: "",
    name: "",
    appearsIn: [],
    friends: undefined,
  },
  search: {
    id: "",
    name: "",
    appearsIn: [],
    friends: undefined,
    primaryFunction: undefined,
  },
};
