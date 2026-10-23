# SearchBlox for Adobe Experience Manager and Edge Delivery Services

**Works with:** Edge Delivery Services (aem.page / aem.live sites, as a widget or a block) · AEM as a Cloud Service · AEM 6.x

A search widget for Adobe Experience Manager (AEM) sites, both Edge Delivery Services (EDS) and classic AEM, powered by the [SearchBlox Search API](https://developer.searchblox.com/reference/new-search-api-restv2apisearchquery). It brings the SearchBlox search plugin's features to a page as one embeddable widget: hybrid search, suggestions, facets, AI overview, AI Mode, a chatbot and more. Plain JavaScript and CSS, no build step and no dependencies.

## Quick start

1. **SearchBlox:** make the collection Public, and add your site's address to `cors.allowOrigin` (see [SearchBlox setup](#1-searchblox-setup-once)).
2. **EDS:** copy `widgets/searchblox-search/` into the site repo, add `widgets/searchblox-search/searchblox-config.json` with `{ "domain": "https://search.example.com", "collections": "1" }`, push, and paste `https://main--<site>--<org>.aem.page/widgets/searchblox-search/searchblox-search.html` on its own line in a page. [Details](#2a-eds-aemlive)
3. **AEM:** copy `aem-classic/clientlib-searchblox/` into the project's client libraries, set `domain` and `collections` in its `js/searchblox-config.js`, embed `searchblox.search` in the site's client library, deploy, and add `<div class="searchblox-search"></div>` with an Embed component. [Details](#2b-aem-6x-and-aem-as-a-cloud-service)

That gives a working search page. Then turn on more [features](#features) with [options](#options).

## Features

Each feature is turned on with an [option](#options). The SearchBlox column is what has to exist in the SearchBlox console first.

| Feature | What visitors get | Option | SearchBlox needs |
| --- | --- | --- | --- |
| Search | Hybrid (keyword + meaning) search with result cards, page numbers and a no-results page with popular searches. An empty search lists everything | `domain`, `collections` | A public collection |
| Keyword search | Plain keyword matching, with a sort menu (relevance or date, newest or oldest first) | `vectorWeight=0` | — |
| Suggestions | Suggestions after 3 characters, the typed part in bold | `autosuggest` (on), `smartSuggest` | A SmartSuggest index (optional) |
| Trending searches | A list shown when the empty search box is focused | `trending` | A collection whose document titles are the searches |
| Voice search | A microphone in the search box | `voiceSearch` | Speech-to-text, for browsers without their own (Firefox, Edge, Brave) |
| Facets | Filters beside the results, with selected-filter chips and **Clear all** | `facets` | — |
| Date facet | Last 24 hours, past week, month or year, or a custom From–To range | `facets=…,lastmodified:Date` | — |
| Featured results | Promoted results above page 1 | `featured` (on) | Featured results in the console |
| More like this | A button on web-page results that finds similar pages | always on | — |
| SmartFAQs | Matching questions above the results and in the suggestions | `smartFaqs` (on) | SmartFAQs generated for the collection |
| AI overview | An AI answer with key points, sources and related questions | `aiOverview` | An LLM on the collection |
| AI recommendations | Related pages once a visitor has opened 3 results | `recommendations` | An LLM |
| LLM-generated fields | Generated titles, descriptions and topics, instead of or beside the page's own | `llmFields` | LLM enrichment of the collection |
| SearchAI Assist | Summarize, compare or ask about up to 4 picked results | `assist` | An LLM |
| AI Mode | A conversation in place of the results, with references and follow-up questions | `aiMode` | A chatbot |
| Chatbot | A chat button at the bottom right | `chatbot`, `chatSuggestions`, `chatReferences` | A chatbot |
| Settings menus | Search ratio and feature switches beside the search button, for demos and tuning | `settings` | — |

The chatbot's own console settings (greeting, labels, sensitive-data and profanity masking) apply to the chat.

## 1. SearchBlox setup (once)

1. Make the collections to search **Public**. For AEM or EDS collections, set the Publish Domain / Publisher URL so results link to the live site.
2. Allow the site's origins in `cors.allowOrigin` in `webapps/ROOT/WEB-INF/web.xml` (space-separated), then restart SearchBlox:
   ```
   https://www.mysite.com https://main--mysite--myorg.aem.page https://main--mysite--myorg.aem.live
   ```
   Without this, the browser blocks every request.
3. Note the collection IDs (for `collections`) and names (for `aiOverview`, `smartSuggest` and `trending`), and set up what the features you want need (see the table above).

## 2a. EDS (aem.live)

1. Copy `widgets/searchblox-search/` into the site repo's `/widgets/` folder. The files pass the boilerplate's lint check.
2. Put the site-wide options in a new file next to them, `widgets/searchblox-search/searchblox-config.json` (camelCase names, as in [Options](#options)), and push:
   ```json
   {
     "domain": "https://search.example.com",
     "collections": "1",
     "facets": "contenttype,keywords:Topics,lastmodified:Date",
     "aiOverview": "my-collection",
     "chatbot": "my-chatbot"
   }
   ```
   Every widget and block on the site uses these, so a change here (a new collection, a feature switched on) is one edit and push. The widget package doesn't include this file, so updating the widget never overwrites it. If the file isn't valid JSON, the browser console says so and it's ignored.
3. In the page document, paste the widget link **on its own line**:
   ```
   https://main--<site>--<org>.aem.page/widgets/searchblox-search/searchblox-search.html
   ```
   To change an option for this widget only, add it to the link: `…/searchblox-search.html?pageSize=20&aiMode=my-chatbot`. Options in the link override the file. Separate them with `&`, and write `#` as `%23` (e.g. `accent=%23e11d48`). Without the file, put every option, including `domain`, in the link.
4. Preview and publish.

For a header search box, put a widget link ending in `?resultsPage=/search&placeholder=Search` on its own line in the third section of the `nav` document (the boilerplate's tools section, at the right of the header), and put the full widget on `/search`. A short placeholder fits phones, where the box shares the top row with the menu button. A chatbot in the site-wide file shows on every page that has a widget.

The site must be based on an `aem-boilerplate` version from June 2026 or later, which turns `/widgets/` links into widgets. Older sites can copy `blocks/widget/` and `buildWidgetAutoBlocks` from `scripts/scripts.js` of the [current boilerplate](https://github.com/adobe/aem-boilerplate), or use the block below.

**Block alternative:** copy `widgets/searchblox-search/` and `blocks/searchblox-search/` into the repo, then add a table to the page. It uses `searchblox-config.json` too; rows (names in any case, e.g. `Page Size`) override it for that block:

| SearchBlox Search | |
| --- | --- |
| Page Size | 20 |
| AI Overview | my-collection |

## 2b. AEM (6.x and AEM as a Cloud Service)

1. Copy `aem-classic/clientlib-searchblox/` into `ui.apps/src/main/content/jcr_root/apps/<site>/clientlibs/`.
2. Set the site-wide options in `js/searchblox-config.js`, in camelCase:
   ```js
   window.SearchBloxConfig = {
     domain: 'https://search.example.com',
     collections: '1',
     facets: 'contenttype,keywords:Topics,lastmodified:Date',
     smartSuggest: 'my-collection',
     aiOverview: 'my-collection',
     chatbot: 'my-chatbot',
     aiMode: 'my-chatbot',
   };
   ```
3. Load it on every page by adding `searchblox.search` to the `embed` list of the site's base client library. In a project made from the AEM archetype that's `ui.apps/src/main/content/jcr_root/apps/<site>/clientlibs/clientlib-base/.content.xml`:
   ```xml
   embed="[core.wcm.components.accordion.v1,…,searchblox.search]"
   ```
   Then build and deploy (on AEM as a Cloud Service, push to Cloud Manager and run the deployment pipeline).
4. Authors add an **Embed** component (from AEM Core Components) in **HTML** mode on the search page:
   ```html
   <div class="searchblox-search"></div>
   ```
   For a header search box, put this in the header Experience Fragment:
   ```html
   <div class="searchblox-search" data-results-page="/content/<site>/search.html"></div>
   ```

A `data-*` attribute on an element overrides the site-wide option for that element, in dashed form (`data-page-size="20"`, `data-ai-mode=""` to turn AI Mode off there).

## Troubleshooting

| What you see | Usually means |
| --- | --- |
| "Search is unavailable right now" on every search, and CORS errors in the browser console | The site's address isn't in SearchBlox's `cors.allowOrigin` (include `http://localhost:3000` for `aem up`), or SearchBlox wasn't restarted after the change |
| "There is no public collection available to search", or results from unrelated collections | The collections in `collections` aren't Public, or the IDs are wrong. Keyword search reports it; hybrid search falls back to every public collection |
| "Set the domain option…" in place of the widget | No `domain`: on EDS, `searchblox-config.json` is missing (or invalid JSON; the console says so) and the link has none; on AEM, `searchblox-config.js` isn't loaded or doesn't set it |
| The EDS widget link shows as a plain link | The site's boilerplate predates widget support (see [EDS](#2a-eds-aemlive)), or the link isn't alone in its paragraph |
| Nothing at all on an AEM page | The `searchblox.search` client library isn't embedded or deployed, or the Embed component isn't in HTML mode |
| A feature doesn't appear | Its option isn't set, or its SearchBlox side isn't set up (see [Features](#features)); the browser console names the failing request |

## Options

Option names are camelCase in EDS links, `searchblox-config.json` and AEM's `searchblox-config.js`, dashed in `data-*` attributes. Lists are comma-separated. Booleans take `true` or `false`.

**Search**

| Option | Default | Description |
| --- | --- | --- |
| `domain` | required | SearchBlox URL, e.g. `https://search.example.com` |
| `collections` | all public | Collection IDs to search |
| `vectorWeight` | `0.2` | Share of meaning-based matching, `0`–`1`. `0` is keyword search, which adds a sort menu |
| `vectorThreshold` | `0.6` | Minimum similarity for hybrid results, `0`–`1` |
| `sort` | `relevance` | Initial order: `relevance` (the console's manual ranking first) or `date` |
| `pageSize` | `10` | Results per page (at most 50 in hybrid search) |
| `loadMore` | `false` | A **Load more** button instead of page numbers |
| `resultsPage` | none | Makes the widget a search box only, which goes to this page with `?q=` |
| `placeholder` | `Enter a search term...` | Search box placeholder |
| `topQueries` | `true` | Popular searches ("Or search for:") when nothing matches |

**Suggestions and voice**

| Option | Default | Description |
| --- | --- | --- |
| `autosuggest` | `true` | Suggestions while typing, from 3 characters |
| `suggestLimit` | `6` | Number of suggestions |
| `smartSuggest` | none | Collection name whose SmartSuggest index supplies the suggestions; falls back to autocomplete |
| `trending` | none | Collection name whose document titles are listed as trending searches |
| `voiceSearch` | `false` | Microphone button in the search box |

**Results and facets**

| Option | Default | Description |
| --- | --- | --- |
| `facets` | none | Facet fields, each with an optional label: `contenttype,keywords:Topics,colname:Collection,lastmodified:Date` |
| `checkboxFacets` | `topics,keywords` | Facets that allow several values; the others allow one |
| `dateFacets` | `lastmodified` | Facet fields shown as dates (presets and a custom range) |
| `featured` | `true` | Featured results on page 1 |
| `urlDisplay` | `true` | Each result's URL under its title |
| `newTab` | `false` | Open results in a new tab |
| `smartFaqs` | `true` | SmartFAQs above the results and in the suggestions |
| `llmFields` | `off` | LLM-generated fields: `off`, `replace` (generated text, with topic chips) or `both` (the page's own, with a box of the generated) |

**AI**

| Option | Default | Description |
| --- | --- | --- |
| `aiOverview` | none | Collection names to answer from |
| `recommendations` | `false` | AI recommendations after 3 opened results |
| `assist` | `false` | SearchAI Assist button on each result |
| `aiMode` | none | Chatbot name for AI Mode. On a search box only, the button opens AI Mode on the results page |
| `chatbot` | none | Chatbot name for the chat button |
| `chatSuggestions` | `false` | Suggest SmartFAQ questions in the chat while typing |
| `chatReferences` | `false` | Under each chat answer, the top 2 search results for the question |
| `settings` | `false` | Search Settings and Plugin Settings menus (for demos; not for visitors) |

**Page, look and analytics**

| Option | Default | Description |
| --- | --- | --- |
| `syncUrl` | `true` | Keep the query, page, filters and sort in the page address, and the query in the page title |
| `queryParam` | `q` | Address parameter for the query |
| `analytics` | `true` | Send clicks to SearchBlox analytics, as the plugin does. Set `false` if consent is needed first |
| `accent` | SearchBlox purple | Brand color, e.g. `#e11d48` |
| `scheme` | `auto` | `light` or `dark`; `auto` detects the page background |

The widget inherits the page's font and text color. To restyle it, set CSS variables on `.searchblox-search`: `--sb-accent`, `--sb-accent-contrast`, `--sb-radius`, `--sb-font`, `--sb-surface`.

Filters are kept in the address as the SearchBlox plugin writes them (`f.contenttype.filter=html`), so plugin links open filtered.

## Development

```bash
node scripts/build-aem.mjs                            # regenerate the AEM client library after changing widgets/
node test/smoke.mjs https://search.example.com 1      # check the API calls against a live server
node demo/serve.mjs https://search.example.com        # local demo at http://localhost:8787
```

The smoke test also checks SmartSuggest, the AI overview, the chatbot and SmartFAQs when you name them: `--smartsuggest=my-collection --ai-overview=my-collection --chatbot=my-chatbot --faq-collections=1` (see the top of `test/smoke.mjs`).

The demo shows a header search box and a results page with every feature on. Options for your server (collection IDs and names, chatbot) go in `demo/demo.local.json`, which git ignores; copy `demo/demo.local.example.json` to start. Its top bar has switches for a dark page and for the AI features (on wherever configured); any option can also be set in the demo page's URL, e.g. `?vectorWeight=0`.

To update a site, copy the new files into its repo: the files of `widgets/searchblox-search/` for EDS (the site's `searchblox-config.json` stays), or the clientlib's `css/searchblox-search.css` and `js/searchblox-search.js` for AEM (keep the site's `searchblox-config.js`).

## Third-party notices

- Icons from [Tabler Icons](https://tabler.io/icons) (MIT License, © Paweł Kuna), plus the "AI chip" icon used by the SearchBlox search plugin (from SVGRepo).
- The chat's default profanity word list is from [badwords-list](https://github.com/MauriceButler/badwords) 2.0.1 (MIT License, © 2013 Maurice Butler).

---

Adobe and Adobe Experience Manager are either registered trademarks or trademarks of Adobe in the United States and/or other countries. This project is not affiliated with or endorsed by Adobe.
