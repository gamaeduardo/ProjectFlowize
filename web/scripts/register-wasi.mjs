import { register } from 'node:module';

register('./wasi-loader.mjs', import.meta.url);
