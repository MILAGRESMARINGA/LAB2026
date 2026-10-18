import fs from 'node:fs';
import path from 'node:path';
import {validateAgentPatch} from './agent-writer-core.mjs';
export function materializeEdits(root, edits, agent) {
  const checked = validateAgentPatch(edits, agent);
  if (!checked.ok) throw Error(checked.reason);
  return checked.files.map((file, index) => {
    const find = edits[index].find;
    if (typeof find !== 'string') throw Error('Exact match text required');
    const target = path.resolve(root, file.path);
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isSymbolicLink() || !fs.realpathSync(target).startsWith(fs.realpathSync(root) + path.sep)) throw Error('Symlink or escaped source');
      const original = fs.readFileSync(target, 'utf8');
      if (!find || !original.includes(find) || original.indexOf(find) !== original.lastIndexOf(find)) throw Error('Replacement must match exactly once');
      if (find === file.content) throw Error('No-op replacement');
      return {path:file.path, content:original.replace(find, () => file.content)};
    }
    if (find !== '') throw Error('New file cannot contain match text');
    return file;
  });
}
