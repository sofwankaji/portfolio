import {cleanProject,type Project} from './content.ts';

export function hasProjectTitle(project:Project){
 return !!project.title.trim() && project.title.trim()!=='Untitled project';
}

// Order belongs to the collection; a recovered document must not undo a later reorder.
export function mergePortfolioDraft(saved:Project,draft:Project|null):Project{
 if(draft && draft.revision!==saved.revision)throw new Error(`มีร่างเก่าของ ${saved.title} กรุณาเปิดผลงานและบันทึกก่อน Push`);
 const project=cleanProject(draft||saved);
 project.order=saved.order;
 project.status=hasProjectTitle(project)&&!project.keepDraft?'published':'draft';
 return project;
}

export function sameProjectContent(a:Project,b:Project){
 return JSON.stringify({...a,revision:0,updatedAt:''})===JSON.stringify({...b,revision:0,updatedAt:''});
}
