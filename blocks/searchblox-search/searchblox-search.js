import { readBlockConfig } from '../../scripts/aem.js';
import { mount } from '../../widgets/searchblox-search/searchblox-core.js';
import { loadSiteConfig } from '../../widgets/searchblox-search/searchblox-search.js';

/**
 * EDS block variant. Authors configure it with a two-column table, on top of the
 * site-wide widgets/searchblox-search/searchblox-config.json:
 *
 * | SearchBlox Search |                                  |
 * | Domain            | https://search.example.com       |
 * | Collections       | 12, 14                           |
 * | Facets            | contenttype, keywords:Topics     |
 * | Page Size         | 10                               |
 * | Autosuggest       | true                             |
 * | Results Page      | /search   (optional: box only)   |
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.replaceChildren();
  mount(block, { ...(await loadSiteConfig()), ...config });
}
