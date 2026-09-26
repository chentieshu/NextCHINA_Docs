import meta from '../../content/data/research-meta.json';
import categories from '../../content/data/categories.json';
import sources from '../../content/data/sources.json';
import products from '../../content/data/products.json';
import benchmarks from '../../content/data/benchmarks.json';
import apiPrices from '../../content/data/model-api-prices.json';

export const research = {
  ...meta,
  categories: categories.categories,
  sources: sources.sources,
  products: products.products,
  benchmarks: benchmarks.benchmarks,
  modelApiPrices: apiPrices.modelApiPrices
};

export default research;
