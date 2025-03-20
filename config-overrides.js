module.exports = {
    devServer: function(configFunction) {
      return function(proxy, allowedHost) {
        const config = configFunction(proxy, allowedHost);
        
        // Replace deprecated options with setupMiddlewares
        delete config.onBeforeSetupMiddleware;
        delete config.onAfterSetupMiddleware;
        
        config.setupMiddlewares = (middlewares, devServer) => {
          if (!devServer) {
            throw new Error('webpack-dev-server is not defined');
          }
          
          // Add your custom middleware here
          // ...
          
          return middlewares;
        };
        
        return config;
      };
    }
  };