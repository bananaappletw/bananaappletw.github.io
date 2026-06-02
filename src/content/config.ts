import { defineCollection, z } from 'astro:content';

const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).optional(),
  author: z.string().optional(),
});

const blog = defineCollection({
  type: 'content',
  schema: postSchema,
});

const archives = defineCollection({
  type: 'content',
  schema: postSchema,
});

const treasure = defineCollection({
  type: 'content',
  schema: postSchema,
});

export const collections = { blog, archives, treasure };
