// Checks request building and response parsing against a live SearchBlox server.
// Usage: node test/smoke.mjs https://your-searchblox-server [collectionId] [--option=value ...]
// Optional checks run when their options are given:
//   --smartsuggest=name      a collection with a SmartSuggest index
//   --suggest-prefix=text    what to type for SmartSuggest (default "sea")
//   --ai-overview=name       a collection with an LLM, for the AI overview
//   --ai-query=text          the AI overview question (default "search")
//   --chatbot=name           a chatbot
//   --faq-collections=ids    collections with SmartFAQs
//   --faq-query=text         the SmartFAQ search (default "search")
import {
  buildSearchUrl, buildSmartSuggestUrl, buildSuggestUrl, normaliseConfig, overview, parseOverview, parseResponse, search, suggest,
  chat, chatSettings, maskSensitive, parseChatAnswer, smartFaq, smartFaqs,
} from '../widgets/searchblox-search/searchblox-core.js';

const args = process.argv.slice(2);
const [domain, col] = args.filter((a) => !a.startsWith('--'));
const flag = (name, fallback = '') => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback;
if (!domain) {
  console.error('Usage: node test/smoke.mjs <searchblox-url> [collectionId] [--smartsuggest=name] [--ai-overview=name] [--chatbot=name] [--faq-collections=ids]');
  process.exit(1);
}
const skip = (msg) => console.log(`skip - ${msg}`);

const config = normaliseConfig({
  domain, collections: col || '', facets: 'contenttype,keywords:Tags', 'page-size': '5',
});
const assert = (cond, msg) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
};

assert(config.facets[1].label === 'Tags' && normaliseConfig({ facets: 'topics' }).facets[0].label === 'Topics', 'facet labels parse');
assert(buildSearchUrl(config, { query: 'a b' }).includes('public=true'), 'search url is public');
assert(buildSearchUrl(config, { query: 'a' }).includes('/hybrid-search?') && config.vectorWeight === 0.2 && config.vectorThreshold === 0.6, 'hybrid search is the default');
const keyword = normaliseConfig({ domain, vectorWeight: '0', pageSize: '80' });
assert(buildSearchUrl(keyword, { query: 'a' }).includes('/search?') && !buildSearchUrl(keyword, { query: 'a' }).includes('v.weight'), 'vectorWeight 0 uses keyword search');
assert(keyword.pageSize === 80 && normaliseConfig({ pageSize: '80' }).pageSize === 50, 'hybrid caps page size at 50');
const product = parseResponse({ result: [{ title: 'null', url: 'db?url=', product_name: 'Cape dress', product_url: 'https://shop.example/p1' }, { title: 'Record', url: 'db?url=' }] }).results;
assert(product[0].title === 'Cape dress' && product[0].url === 'https://shop.example/p1' && product[1].url === '', 'structured records use product fields, never db?url=');
assert(config.analytics === true && normaliseConfig({ analytics: 'false' }).analytics === false, 'analytics option parses');

const first = await search(config, { query: 'search', page: 1, filters: {} });
console.log(`   ${buildSearchUrl(config, { query: 'search', page: 1 })}`);
assert(first.hits > 0, `search returns hits (${first.hits})`);
assert(first.results.length <= 5, 'page size respected');
assert(first.results.every((r) => r.url && r.title), 'results have url + title');
assert(Array.isArray(first.facets.contenttype), 'contenttype facet present');

const type = first.facets.contenttype[0]?.value;
const filtered = await search(config, { query: 'search', page: 1, filters: { contenttype: type } });
assert(filtered.hits > 0 && filtered.hits <= first.hits, `facet filter narrows (${type}: ${filtered.hits})`);
assert(filtered.results.every((r) => r.contenttype.toLowerCase() === type.toLowerCase()), 'filtered results match type');
assert(config.checkboxFacets.join() === 'topics,keywords', 'keywords and topics are checkbox facets by default');
const two = buildSearchUrl(config, { query: 'a', filters: { keywords: ['x', 'y'] } });
assert(two.includes('f.keywords.filter=x&f.keywords.filter=y'), 'checkbox facets send every selected value');

const page2 = await search(config, { query: 'search', page: 2, filters: {} });
assert(page2.currentPage === 2, 'pagination');
assert(page2.results[0]?.uid !== first.results[0]?.uid, 'page 2 differs from page 1');

const kw = await search(keyword, { query: 'search', page: 1, filters: {} });
assert(kw.hits > 0, `keyword search still works (${kw.hits} hits)`);

const suggestions = await suggest(config, 'sea');
console.log(`   ${buildSuggestUrl(config, 'sea')} -> ${JSON.stringify(suggestions)}`);
assert(Array.isArray(suggestions), 'autosuggest returns a list');

if (flag('smartsuggest')) {
  const smart = normaliseConfig({ domain, smartSuggest: flag('smartsuggest') });
  const prefix = flag('suggest-prefix', 'sea');
  const phrases = await suggest(smart, prefix);
  console.log(`   ${buildSmartSuggestUrl(smart, prefix)} -> ${JSON.stringify(phrases)}`);
  assert(phrases.length > 0 && phrases.every((p) => typeof p === 'string'), 'smartsuggest returns phrases');
} else skip('smartsuggest (--smartsuggest=name)');
// "nosuchindex" has no SmartSuggest index.
const fallback = await suggest(normaliseConfig({ domain, smartSuggest: 'nosuchindex' }), 'sea');
assert(fallback.length > 0, 'missing smartsuggest index falls back to autocomplete');
const raw = parseOverview({ overview: '```json\n{"overview":"Hi","key_points":["a"]}\n```' });
assert(raw.overview === 'Hi' && raw.keyPoints[0] === 'a', 'raw LLM JSON overview is recovered');
assert(parseOverview({ overview: 'x', insufficientSupport: true }).overview === '', 'unsupported answers are hidden');

// Takes 5-15 s: the server runs an LLM over chunks from the collection.
if (flag('ai-overview')) {
  const ai = await overview(normaliseConfig({ domain, aiOverview: flag('ai-overview') }), flag('ai-query', 'search'));
  console.log(`   ai-overview -> ${ai.overview.slice(0, 80)}... (${ai.sources.length} sources, ${ai.followups.length} follow-ups)`);
  assert(ai.overview.length > 0 && ai.sources.length > 0 && ai.sources.every((s) => s.url.startsWith('http')), 'ai overview returns an answer with sources');
} else skip('ai overview (--ai-overview=name)');
const answer = parseChatAnswer('Yes. <source>https://a.example/x</source> <source>db?url=7</source>');
assert(answer.text === 'Yes.' && answer.sources.join() === 'https://a.example/x', 'chat sources are extracted');
const masked = maskSensitive('a@b.co, 123-45-6789, 4111 1111 1111 1111', { maskSensitiveData: true });
assert(masked === '####, ####, ####', `sensitive data is masked (${masked})`);

if (flag('chatbot')) {
  const bot = normaliseConfig({ domain, chatbot: flag('chatbot') });
  const settings = await chatSettings(bot);
  const turn = await chat(bot, { question: 'What can you help me with?', useKg: settings.useKg });
  console.log(`   chat -> ${turn.text.slice(0, 80)}... (${turn.sources.length} sources)`);
  assert(turn.text && turn.conversationId && turn.id, 'chatbot answers with a conversation id');
  const next = await chat(bot, { question: 'Tell me more.', conversationId: turn.conversationId, useKg: settings.useKg });
  assert(next.conversationId === turn.conversationId, 'follow-up keeps the conversation');
} else skip('chatbot (--chatbot=name)');
if (flag('faq-collections')) {
  const faqConfig = normaliseConfig({ domain, collections: flag('faq-collections') });
  const faqs = await smartFaqs(faqConfig, flag('faq-query', 'search'), 10);
  console.log(`   smart-faq -> ${faqs.length} FAQs, e.g. "${faqs[0]?.question}"`);
  assert(faqs.length > 0 && faqs.every((f) => f.uid && f.question && f.answer), 'smartfaqs list returns questions and answers');
  const one = await smartFaq(faqConfig, faqs[0].uid);
  assert(one?.uid === faqs[0].uid && one.question === faqs[0].question, 'a single smartfaq loads by uid');
} else skip('smartfaqs (--faq-collections=ids)');
console.log('All checks passed.');
