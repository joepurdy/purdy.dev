import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().default("Joe Purdy"),
    description: z.string().default(""),
    tags: z.array(z.string()).default([]),
    slug: z.string(),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
    cover: z
      .object({
        url: z.string(),
        caption: z.string().default(""),
      })
      .optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/pages" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    description: z.string().default(""),
  }),
});

export const collections = { posts, pages };
