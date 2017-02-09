'use strict';

const path = require('path');

const Compiler = require('./lib/compiler');
const Renderer = require('./lib/renderer');

function vueEasyRenderer(basePath, rendererConfig) {
  const head = (rendererConfig && rendererConfig.head) || {};
  const webpackConfig = (rendererConfig && rendererConfig.webpackConfig);
  const streamFlag = !(rendererConfig && rendererConfig.stream);
  const useStore = rendererConfig && rendererConfig.store;
  const preCompile = (rendererConfig && rendererConfig.preCompile) || [];
  const plugins = (rendererConfig && rendererConfig.plugins) || [];

  const compiler = new Compiler({webpackConfig, basePath: path.resolve(basePath)});
  const renderer = new Renderer(compiler, {head, useStore, plugins});

  preCompile.forEach(filePath => compiler.compile(path.resolve(basePath, filePath)));

  return (ctx, next) => {
    ctx.vueRender = (vueFilePath, context, config) => {
      ctx.set('Content-Type', 'text/html');
      const filePath = path.resolve(basePath, vueFilePath);
      const rendererFn = streamFlag ? renderer.renderToStream.bind(renderer) : renderer.renderToString.bind(renderer);
      return rendererFn(filePath, context, config).then(result => {
        ctx.body = result;
        return Promise.resolve();
      }).catch(e => {
        console.error('vueRenderError', e);
        return Promise.resolve();
      });
    };
    ctx.vueRenderToStream = (vueFilePath, context, config) => {
      const filePath = path.resolve(basePath, vueFilePath);
      return renderer.renderToStream(filePath, context, config);
    };
    ctx.vueRenderToString = (vueFilePath, context, config) => {
      const filePath = path.resolve(basePath, vueFilePath);
      return renderer.renderToString(filePath, context, config);
    };
    return next();
  };
}

module.exports = vueEasyRenderer;