import { isObject } from '@core/utils';
import { IncludeOptions, Op } from 'sequelize';

/**
 * Represents a node in the field projection tree structure.
 * Used to organize field selections and nested populate operations.
 */
type AttributeNode = {
  /** The path/name of this node */
  association: string;
  /** Space-separated string of field names to select */
  attributes: string[];
  /** Optional nested populate operations */
  include?: IncludeOptions[];
};

/**
 * Represents a node in the populate tree structure.
 * Used to build nested Mongoose populate operations.
 */
type PopulateNode = {
  /** The path/field to populate */
  association: string;
  /** Nested populate operations */
  include: PopulateNode[];
};

/**
 * Parses an array of dot-notation field paths into a structured projection tree.
 *
 * This function processes field selections that may include nested relations
 * (e.g., ['id', 'name', 'country.name', 'country.code']) and converts them into
 * a tree structure with separate select and populate operations.
 *
 * @param fields - Array of field paths in dot-notation (e.g., ['name', 'user.email'])
 * @returns An AttributeNode containing select fields and nested populate operations
 *
 * @example
 * ```typescript
 * const fields = ['id', 'name', 'country.name', 'country.code'];
 * const result = parseFieldsProjection(fields);
 * // Result: {
 * //   path: 'default',
 * //   select: 'id name',
 * //   populate: [
 * //     { path: 'country', select: 'name code' }
 * //   ]
 * // }
 * ```
 */
export function parseFieldsProjection(fields: string[]): AttributeNode {
  /**
   * Recursively builds a tree structure from field paths.
   *
   * @param path - The current path/node name
   * @param keys - Array of field keys to process
   * @returns An AttributeNode with select and populate information
   */
  function buildTree(path: string, keys: string[]): AttributeNode {
    const attributes: string[] = [];
    const grouped: Record<string, string[]> = {};

    // Separate direct fields from nested fields
    for (const key of keys) {
      const parts = key.split('.');

      if (parts.length === 1) {
        // Direct field - add to select list
        attributes.push(parts[0]);
      } else {
        // Nested field - group by first part
        const [first, ...rest] = parts;
        if (!grouped[first]) {
          grouped[first] = [];
        }
        grouped[first].push(rest.join('.'));
      }
    }

    // Create node with select fields
    const node: AttributeNode = {
      association: path,
      attributes,
    };

    // Process nested paths recursively
    const subPaths = Object.entries(grouped).map(([child, childKeys]) =>
      buildTree(child, childKeys),
    );

    if (subPaths.length > 0) {
      node.include = subPaths;
    }

    return node;
  }

  return buildTree('default', fields);
}

/**
 * Builds a nested Mongoose populate structure from dot-notation paths.
 *
 * Converts an array of dot-notation strings into a hierarchical structure
 * suitable for Mongoose's populate() method. This allows for deep population
 * of related documents.
 *
 * @param fields - Array of dot-notation paths (e.g., ['user', 'user.profile', 'comments'])
 * @returns Array of PopulateNode objects representing the populate structure
 *
 * @example
 * ```typescript
 * const fields = ['user', 'user.profile', 'user.profile.avatar', 'comments'];
 * const result = buildPopulateTree(fields);
 * // Result: [
 * //   {
 * //     path: 'user',
 * //     populate: [
 * //       {
 * //         path: 'profile',
 * //         populate: [
 * //           { path: 'avatar', populate: [] }
 * //         ]
 * //       }
 * //     ]
 * //   },
 * //   { path: 'comments', populate: [] }
 * // ]
 * ```
 */
export function buildPopulateTree(fields: string[]): PopulateNode[] {
  const root: Record<string, unknown> = {};

  // Build tree structure from dot-notation paths
  for (const field of fields) {
    const parts = field.split('.');
    let current = root;

    // Navigate/create nested structure
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
  }

  /**
   * Recursively converts a plain object tree into an array of PopulateNode objects.
   *
   * @param obj - The object to convert
   * @returns Array of PopulateNode objects
   */
  const toPopulateNodes = (obj: Record<string, unknown>): PopulateNode[] =>
    Object.entries(obj).map(([key, value]) => ({
      association: key,
      include: toPopulateNodes(value as Record<string, unknown>),
    }));

  return toPopulateNodes(root);
}

export const opAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $or: Op.or,
};

export function mapOperatorToQuery(
  where: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof where !== 'object') return where;
  for (const key of Object.keys(where)) {
    if (Object.prototype.hasOwnProperty.call(where, key)) {
      const value = where[key];
      if (Array.isArray(value)) {
        where[key] = value.map((x) => mapOperatorToQuery(x));
      } else if (isObject(value)) {
        where[key] = mapOperatorToQuery(value);
      }
      if (Object.prototype.hasOwnProperty.call(opAliases, key)) {
        where[opAliases[key]] = where[key];
        delete where[key];
      }
    }
  }
  return where;
}
