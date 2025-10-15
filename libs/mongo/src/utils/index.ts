import { PopulateOptions } from 'mongoose';

type PathNode = {
  path: string;
  select: string;
  paths?: PopulateOptions[];
};

export function parseFieldsProjection(fields: string[]): PathNode {
  // Recursive builder function
  function buildTree(path: string, keys: string[]): PathNode {
    const attributes: string[] = [];
    const grouped: Record<string, string[]> = {};

    for (const key of keys) {
      const parts = key.split('.');
      if (parts.length === 1) {
        attributes.push(parts[0]);
      } else {
        const [first, ...rest] = parts;
        if (!grouped[first]) grouped[first] = [];
        grouped[first].push(rest.join('.'));
      }
    }

    const node: PathNode = {
      path,
      select: attributes.join(' '),
    };

    const subPaths = Object.entries(grouped).map(([child, childKeys]) =>
      buildTree(child, childKeys),
    );

    if (subPaths.length) node.paths = subPaths;
    return node;
  }

  return buildTree('default', fields);
}
