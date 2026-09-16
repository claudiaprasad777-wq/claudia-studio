import { error } from '@sveltejs/kit';
import { pages } from '$lib/pages.js';

export const entries = () => Object.keys(pages).filter((page) => page !== 'index').map((page) => ({ page }));

export function load({ params }) {
  const page = params.page === '' ? 'index' : params.page;
  const content = pages[page];
  if (!content) error(404, 'Page not found');
  return { page, content };
}
