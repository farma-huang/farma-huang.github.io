---
name: blog-writing
description: Write blog posts for Farma's personal Astro-based website. Use this skill whenever the user asks to write a blog post, learning notes, article, or any content destined for the blog. Also trigger when the user mentions writing to a file under `src/pages/posts/`, creating a new post, or recording learning notes (學習心得/筆記). This skill covers the full workflow — from creating the markdown file with correct frontmatter, to sourcing an SVG image, to writing in the user's preferred straightforward narrative style (平鋪直敘).
---

# Blog Writing Skill

This skill captures the end-to-end workflow for creating a blog post on Farma's personal website (an Astro-based static site).

## Writing Style

Write in **平鋪直敘**（straightforward narrative）— the tone of someone recording what they learned, not lecturing or being overly formal. Think of it as a developer writing notes for their future self: clear, factual, and approachable. Avoid marketing language, hype, or unnecessary filler.

Characteristics of this style:
- Explain concepts plainly, as if walking through your own understanding
- Use Traditional Chinese (繁體中文) unless the user specifies otherwise
- Include code examples where they naturally fit the topic
- Structure content with `##` headings to break up sections
- End with a brief wrap-up (小結 / 總結), not a dramatic conclusion
- When introducing English technical terms, include the Chinese translation on first mention (e.g., "CI 是 Continuous Integration，也就是持續整合")

## File & Directory Structure

Blog posts live in a date-based directory structure:

```
src/pages/posts/{year}/{month}/{date}/{year}-{month}-{date}.md
```

For example, a post published on April 8, 2023 goes to:
```
src/pages/posts/2023/04/08/2023-04-08.md
```

The `{month}` and `{date}` are always zero-padded to two digits (e.g., `02`, `08`).

## Frontmatter Template

Every post starts with this exact frontmatter structure:

```yaml
---
title: '文章標題'
layout: '@layouts/PostLayout.astro'
pubDate: '{year}-{month}-{date}'
description: '簡短描述文章內容'
image:
  url: '/assets/images/{year}/{month}/{date}/filename.svg'
  alt: '圖片描述'
---
```

Notes:
- `title`: A concise, descriptive title in Traditional Chinese
- `layout`: Always `'@layouts/PostLayout.astro'` — do not change this
- `pubDate`: Matches the date in the file path
- `description`: One sentence summarizing the article content
- `image.url`: Path to the cover image (see Image Sourcing below)
- `image.alt`: Brief alt text for the image
- The `author` field is optional — some posts include it, some don't. Omit it unless the user specifies

## Image Sourcing

Cover images use SVG (preferred) or PNG format. The workflow:

1. **Find an appropriate icon** from [SVG Repo](https://www.svgrepo.com/) that relates to the blog topic
2. **Download the SVG file** and place it in the public assets directory:
   ```
   public/assets/images/{year}/{month}/{date}/filename.svg
   ```
3. **Reference it in frontmatter** using the path relative to `public/`:
   ```yaml
   image:
     url: '/assets/images/{year}/{month}/{date}/filename.svg'
   ```

The SVG filename should be descriptive (e.g., `azure-blob-storage-svgrepo-com.svg`, `github-color-svgrepo-com.svg`).

If you cannot download from SVG Repo, use the `generate_image` tool to create a simple PNG icon and place it in the same directory pattern.

## Content Structure

A typical blog post follows this general structure:

1. **Introduction** — Briefly explain what the topic is and why it matters (1-2 paragraphs, no heading needed or use a `## 什麼是 X` heading)
2. **Core Concepts** — Break the topic into logical sections with `##` headings
3. **Practical Examples** — Include code snippets, configuration examples, or step-by-step instructions where relevant
4. **Wrap-up** — A short `## 小結` or `## 總結` section summarizing key takeaways

Keep the content focused. A learning notes post typically covers one main topic in depth rather than skimming across many topics.

## Checklist

When creating a blog post, follow these steps:

1. Determine the publish date (use today's date if not specified)
2. Create the markdown file at `src/pages/posts/{year}/{month}/{date}/{year}-{month}-{date}.md`
3. If the file already exists with empty frontmatter, fill in the `title`, `description`, `image.alt`, and write the content
4. Source or generate a cover image and place it in `public/assets/images/{year}/{month}/{date}/`
5. Write the article content in 平鋪直敘 style
6. Verify the `image.url` in frontmatter matches the actual file path
