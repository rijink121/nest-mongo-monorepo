export enum AppEngine {
  SQL = 'sql',
  Mongo = 'mongo',
}

export enum SqlDialect {
  MySQL = 'mysql',
  Postgres = 'postgres',
}

export enum CDNStorage {
  Local,
  Aws,
  Azure,
}

export enum Environment {
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}
