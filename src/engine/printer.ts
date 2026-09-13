import { AstNode, BlockNode } from '../grammar/ast';

export function printTree(node: AstNode, indent = '', isLast = true): string {
  const marker = isLast ? '└── ' : '├── ';
  const nextIndent = indent + (isLast ? '    ' : '│   ');

  let line = '';
  if (node.kind === 'block') {
    line = `${indent}${marker}${node.name}\n`;
    const count = node.children.length;
    node.children.forEach((child, i) => {
      line += printTree(child, nextIndent, i === count - 1);
    });
    return line;
  } else if (node.kind === 'property') {
    return `${indent}${marker}${node.name} = "${node.value}"\n`;
  } else {
    return `${indent}${marker}${node.name}\n`;
  }
}

export function printRoot(root: BlockNode): string {
  let out = '';
  for (const child of root.children) {
    out += printTree(child);
  }
  return out;
}
