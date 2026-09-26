import meta from '../../content/data/research-meta.json';
import categories from '../../content/data/categories.json';
import sources from '../../content/data/sources.json';
import benchmarks from '../../content/data/benchmarks.json';
import apiPrices from '../../content/data/model-api-prices.json';
import audio from '../../content/data/products/audio.json';
import video from '../../content/data/products/video.json';
import image from '../../content/data/products/image.json';
import threeD from '../../content/data/products/3d.json';
import music from '../../content/data/products/music.json';
import assistants from '../../content/data/products/assistants.json';
import platforms from '../../content/data/products/platforms.json';
import agents from '../../content/data/products/agents.json';

const products = [
  ...audio.products,
  ...video.products,
  ...image.products,
  ...threeD.products,
  ...music.products,
  ...assistants.products,
  ...platforms.products,
  ...agents.products
];

export const research = {
  ...meta,
  categories: categories.categories,
  sources: sources.sources,
  products,
  benchmarks: benchmarks.benchmarks,
  modelApiPrices: apiPrices.modelApiPrices
};

export default research;
