// Load environment variables
require('dotenv').config();

/**
 * EDS ACCS Mesh Configuration
 *
 * Simplified mesh for Adobe Commerce Cloud Service (ACCS) backend:
 * - SINGLE SOURCE: ACCS supergraph already federates all services
 * - NO FILTERING: products/categories are service-based in supergraph
 * - PASSTHROUGH: Proxies ACCS GraphQL directly with store headers
 * - EXTENSIBLE: Can add custom sources/resolvers for future templates
 *
 * Key differences from PaaS mesh:
 * - No separate Catalog Service source (built into ACCS supergraph)
 * - No x-api-key or Magento-Environment-Id headers needed
 * - Single endpoint handles all queries (products, categories, cart, etc.)
 *
 * For EDS storefronts with PaaS backend, use eds-commerce-mesh instead.
 */
module.exports = {
  meshConfig: {
    // Enable response caching for EDS performance
    responseConfig: {
      cache: true,
      includeHTTPDetails: true,
      CORS: {
        credentials: true,
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 60480,
        methods: ['GET', 'POST'],
        origin: '*',
      },
    },
    sources: [
      {
        name: 'ACCSGraphQL',
        handler: {
          graphql: {
            endpoint: '{env.ACCS_GRAPHQL_ENDPOINT}',
            operationHeaders: {
              'Content-Type': 'application/json',
              Store: "{context.headers['store']}",
              'Magento-Website-Code': "{context.headers['magento-website-code']}",
              'Magento-Store-View-Code': "{context.headers['magento-store-view-code']}",
              'Magento-Store-Code': "{context.headers['magento-store-code']}",
              'Magento-Customer-Group': "{context.headers['magento-customer-group']}",
            },
            // schemaHeaders are used during schema introspection at deployment time.
            schemaHeaders: {
              'Content-Type': 'application/json',
              'Magento-Website-Code': '{env.ACCS_WEBSITE_CODE}',
              'Magento-Store-View-Code': '{env.ACCS_STORE_VIEW_CODE}',
              'Magento-Store-Code': '{env.ACCS_STORE_CODE}',
            },
          },
        },
        // NO transforms - ACCS supergraph already has service-based queries
        // (products/categories from Catalog Service are federated in)
      },
    ],
    // additionalTypeDefs and additionalResolvers are added by build script if schema/resolvers exist
  },
};
