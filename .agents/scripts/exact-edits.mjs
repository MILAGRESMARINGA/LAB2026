import fs from 'node:fs';
import path from 'node:path';
import {validateAgentPatch} from './agent-writer-core.mjs';
export function materializeEdits(root, edits, agent) {
  if(!Array.isArray(edits)||edits.length<1||edits.length>8)throw Error('Patch must contain 1–8 edits');
  const materialized=new Map();
  for(const edit of edits){
    const checked=validateAgentPatch([edit],agent);
    if(!checked.ok)throw Error(checked.reason);
    const file=checked.files[0];
    const find = edit.find;
    if (typeof find !== 'string') throw Error('Exact match text required');
    const target = path.resolve(root, file.path);
    if (materialized.has(file.path)||fs.existsSync(target)) {
      if (fs.existsSync(target)&&(fs.lstatSync(target).isSymbolicLink() || !fs.realpathSync(target).startsWith(fs.realpathSync(root) + path.sep))) throw Error('Symlink or escaped source');
      const original = materialized.get(file.path)?.content??fs.readFileSync(target, 'utf8');
      if (!find || !original.includes(find) || original.indexOf(find) !== original.lastIndexOf(find)) throw Error('Replacement must match exactly once');
      if (find === file.content) throw Error('No-op replacement');
      materialized.set(file.path,{path:file.path, content:original.replace(find, () => file.content)});
      continue;
    }
    if (find !== '') throw Error('New file cannot contain match text');
    materialized.set(file.path,file);
  }
  const checked=validateAgentPatch([...materialized.values()],agent);
  if(!checked.ok)throw Error(checked.reason);
  return checked.files;
}
