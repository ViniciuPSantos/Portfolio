import { getCollection, type CollectionEntry } from 'astro:content';
import { langs, type Lang } from '../i18n/utils';

export type Project = CollectionEntry<'projects'>;

const langOf = (p: Project): Lang => p.id.split('/')[0] as Lang;

let checked = false;

/** Garante que os dois idiomas têm exatamente os mesmos projetos. */
async function checkParity(): Promise<void> {
  if (checked) return;
  const all = await getCollection('projects');
  const slugs = Object.fromEntries(
    langs.map((l) => [l, all.filter((p) => langOf(p) === l).map((p) => p.data.slug).sort().join(',')]),
  );
  if (slugs.pt !== slugs.en) {
    throw new Error(`Projetos diferentes entre idiomas. pt: [${slugs.pt}] en: [${slugs.en}]`);
  }
  for (const p of all) {
    const fileSlug = p.id.split('/')[1];
    if (fileSlug !== p.data.slug) {
      throw new Error(`O arquivo ${p.id} tem slug "${p.data.slug}"; renomeie o arquivo ou o slug.`);
    }
  }
  checked = true;
}

export async function getProjects(lang: Lang): Promise<Project[]> {
  await checkParity();
  const list = await getCollection('projects', (p) => langOf(p) === lang);
  return list.sort((a, b) => a.data.order - b.data.order);
}

/** Próximo projeto com case study, em ordem circular. */
export function nextCase(list: Project[], current: Project): Project | undefined {
  const cases = list.filter((p) => p.data.hasCase);
  if (cases.length < 2) return undefined;
  const i = cases.findIndex((p) => p.data.slug === current.data.slug);
  return cases[(i + 1) % cases.length];
}
