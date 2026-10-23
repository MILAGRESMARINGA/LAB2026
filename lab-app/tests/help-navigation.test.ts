// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {MAIN_TABS,MainNavigation,navigationTabFromSearch} from '../src/components/MainNavigation';
import {HELP_ENTRIES,HelpCenter} from '../src/components/HelpCenter';
import {ConsistencyFlame} from '../src/components/ConsistencyFlame';
describe('Navegação, Ajuda e mascote',()=>{
 it('preserva as cinco abas e inclui Ajuda em links diretos válidos',()=>{
  expect(MAIN_TABS.map(t=>t.label)).toEqual(['Jornada','Estudos','Bíblia','GCs','Perfil','Ajuda']);
  const html=renderToStaticMarkup(React.createElement(MainNavigation,{activeTab:'help'}));
  expect((html.match(/href=/g)??[]).length).toBe(6);
  expect(html).toContain('/?tab=profile');expect(html).toContain('/?tab=groups');expect(html).toContain('/?tab=studies');
  expect(navigationTabFromSearch('?tab=help')).toBe('help');expect(navigationTabFromSearch('?tab=groups')).toBe('groups');expect(navigationTabFromSearch('?tab=https://example.com')).toBe('journey');
 });
 it('explica regras e separa o ranking do GC da Liga geral e das conquistas pessoais',()=>{
  expect(HELP_ENTRIES.find(e=>e.id==='clock')?.answer).toContain('24 horas');
  expect(HELP_ENTRIES.find(e=>e.id==='global')?.answer).toContain('Não é uma classificação individual');
  expect(HELP_ENTRIES.find(e=>e.id==='local')?.destination).toBe('groups');
  expect(HELP_ENTRIES.find(e=>e.id==='achievements')?.destination).toBe('profile');
 });
 it('oferece atalhos das respostas para as abas sem alterar progresso',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),navigate=vi.fn();
  try{
   await act(async()=>root.render(React.createElement(HelpCenter,{onNavigate:navigate})));
   const button=[...host.querySelectorAll('button')].find(b=>b.textContent==='Ver meu Perfil')!;
   await act(async()=>button.click());expect(navigate).toHaveBeenCalledWith('profile');
   const input=host.querySelector('input')!;
   await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'zznaoencontrar');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
   expect(host.querySelector('[role="status"]')?.textContent).toContain('Nenhuma resposta');
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('mantém a Chama visível e usa a constância informada, sem criar XP',()=>{
  const html=renderToStaticMarkup(React.createElement(ConsistencyFlame,{compact:true,completedDays:7,status:'active'}));
  expect(html).toContain('Mascote Chama Viva');expect(html).toContain('7 dias confirmados');expect(html).toContain('tone-steady');expect(html).not.toContain('XP');
 });
});
