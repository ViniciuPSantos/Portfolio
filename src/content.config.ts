import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Projetos: um arquivo por projeto por idioma em src/content/projects/{pt,en}/.
 * O id da entrada é o caminho sem extensão ("pt/fluxen"), e o `slug` do
 * frontmatter é o mesmo nos dois idiomas.
 */
const projects = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/projects',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        order: z.number().int().positive(),
        featured: z.boolean(),
        status: z.enum(['producao', 'pessoal', 'academico']),
        hasCase: z.boolean(),
        /** Resumo da página do case (e do card, se não houver cardSummary). */
        summary: z.string().min(1),
        cardSummary: z.string().optional(),
        stack: z.array(z.string()).min(1),
        /** Versão curta do stack para o card da home. */
        cardStack: z.array(z.string()).optional(),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        /** Texto mostrado no lugar da imagem enquanto não há print. */
        coverPlaceholder: z.string().optional(),
        links: z
          .object({
            site: z.url().optional(),
            repo: z.url().optional(),
          })
          .default({}),
        meta: z
          .object({
            role: z.string(),
            period: z.string(),
            status: z.string(),
            stack: z.string(),
          })
          .optional(),
        credit: z.string().optional(),
      })
      .refine((p) => !p.hasCase || p.meta, { message: 'Projetos com hasCase: true precisam de `meta`.' })
      .refine((p) => !p.cover || p.coverAlt, { message: '`cover` precisa de `coverAlt`.' }),
});

export const collections = { projects };
