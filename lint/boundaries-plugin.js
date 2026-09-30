// Architecture boundaries for src/:
//  - a module (src/modules/<name>) may import only from itself, shared, or npm packages
//  - shared (src/shared) must not import from any module
// Code needed by 2+ modules belongs in src/shared.
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '..', 'src');

function toSrcRelative(absPath) {
  const rel = path.relative(SRC, absPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep);
}

// Returns ['modules', name] | ['shared'] | null for a path relative to src/
function layerOf(parts) {
  if (!parts) return null;
  if (parts[0] === 'modules' && parts[1]) return ['modules', parts[1]];
  if (parts[0] === 'shared') return ['shared'];
  return null;
}

function resolveImport(source, filename) {
  if (source.startsWith('@/')) return path.join(SRC, source.slice(2));
  if (source.startsWith('.')) return path.resolve(path.dirname(filename), source);
  return null; // npm package
}

const noCrossModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow imports between modules and from shared into modules' },
    messages: {
      crossModule:
        "Module '{{from}}' must not import from module '{{to}}'. Move the shared code to src/shared.",
      sharedToModule: "src/shared must not import from module '{{to}}'.",
    },
    schema: [],
  },
  create(context) {
    const fromLayer = layerOf(toSrcRelative(path.resolve(context.filename)));
    if (!fromLayer) return {};

    function check(node) {
      if (!node.source || typeof node.source.value !== 'string') return;
      const target = resolveImport(node.source.value, context.filename);
      if (!target) return;
      const toLayer = layerOf(toSrcRelative(target));
      if (!toLayer || toLayer[0] !== 'modules') return;

      if (fromLayer[0] === 'shared') {
        context.report({ node: node.source, messageId: 'sharedToModule', data: { to: toLayer[1] } });
      } else if (fromLayer[1] !== toLayer[1]) {
        context.report({
          node: node.source,
          messageId: 'crossModule',
          data: { from: fromLayer[1], to: toLayer[1] },
        });
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

export default {
  meta: { name: 'boundaries' },
  rules: { 'no-cross-module': noCrossModule },
};
