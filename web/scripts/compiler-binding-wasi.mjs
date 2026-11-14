import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const wasi = require('@astrojs/compiler-binding-wasm32-wasi');

export const compileAstro = wasi.compileAstro;
export const compileAstroSync = wasi.compileAstroSync;
export const parseAstro = wasi.parseAstro;
export const parseAstroSync = wasi.parseAstroSync;
export const extractStylesSync = wasi.extractStylesSync;
export const CompactOptions = wasi.CompactOptions;
export const DiagnosticSeverity = wasi.DiagnosticSeverity;
export const ScopedStyleStrategy = wasi.ScopedStyleStrategy;
export const SourcemapOption = wasi.SourcemapOption;
