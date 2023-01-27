---
title: 'MDX Markdown + Tailwind'
layout: '@layouts/PostLayout.astro'
description: 'MDX test'
pubDate: '2023-01-02'
---
```
import Button from '@components/Button.astro';

<div class="grid place-items-center content-center">
	<Button>Tailwind Button in Markdown!</Button>
	<a href="/" class="p-4 underline">
		Go home...
	</a>
</div>
```