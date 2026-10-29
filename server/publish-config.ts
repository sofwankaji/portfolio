import fs from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {ROOT} from './store.ts';
export const publishConfigSchema=z.object({
 repository:z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
 branch:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/).refine(x=>!x.includes('..')&&!x.endsWith('/')),
 basePath:z.string().regex(/^(?:\/[A-Za-z0-9_-]+)*$/),
 siteUrl:z.string().url().refine(x=>/^https:\/\/[A-Za-z0-9-]+\.github\.io\//.test(x)),
 workflow:z.literal('pages.yml')
});
export type PublishConfig=z.infer<typeof publishConfigSchema>;
export async function readPublishConfig(){return publishConfigSchema.parse(JSON.parse(await fs.readFile(path.join(ROOT,'publish.config.json'),'utf8')));}
