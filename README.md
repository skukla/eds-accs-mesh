# EDS ACCS Mesh

Adobe API Mesh configuration for **Edge Delivery Services (EDS)** storefronts with **Adobe Commerce Cloud Service (ACCS)** backend.

## Overview

This mesh provides a **simplified passthrough configuration** for ACCS-backed EDS storefronts:

- **Single source** - ACCS supergraph federates all services (no separate Catalog Service)
- **No filtering** - Products/categories queries are service-based in the supergraph
- **Passthrough** - Proxies ACCS GraphQL directly with store headers
- **Extensible** - Can add custom sources/resolvers for future templates

## ACCS vs PaaS

| Aspect               | PaaS (eds-commerce-mesh)                  | ACCS (this mesh)      |
| -------------------- | ----------------------------------------- | --------------------- |
| **Sources**          | 2 (CommerceGraphQL + CatalogService)      | 1 (ACCS supergraph)   |
| **Catalog Service**  | Separate endpoint with x-api-key          | Built into supergraph |
| **Headers**          | x-api-key, Magento-Environment-Id, etc.   | Store codes only      |
| **Query transforms** | Filters products/categories from Commerce | None needed           |

## Quick Start

```bash
# Install dependencies
npm install

# Build mesh.json from mesh.config.js
npm run build

# Create mesh in Adobe I/O (first time)
npm run create

# Update existing mesh
npm run update
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# ACCS GraphQL endpoint (from your ACCS dashboard)
ACCS_GRAPHQL_ENDPOINT=https://na1-sandbox.api.commerce.adobe.com/your-env-id/graphql

# Store codes
ACCS_WEBSITE_CODE=base
ACCS_STORE_CODE=main_website_store
ACCS_STORE_VIEW_CODE=default
```

### Finding Your ACCS Endpoint

1. Log in to your ACCS dashboard
2. Navigate to the environment details
3. Copy the GraphQL endpoint URL (format: `https://{region}-sandbox.api.commerce.adobe.com/{env-id}/graphql`)

## Mesh Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  API Mesh (ACCS)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              ACCSGraphQL                         │   │
│  │   (ACCS supergraph - all services federated)    │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│            Response Caching Enabled                     │
│                         │                               │
└─────────────────────────┼──────────────────────────────┘
                          │
                  ┌───────┴───────┐
                  │  EDS Dropin   │
                  │  (unprefixed) │
                  └───────────────┘
```

## Scripts

- `npm run build` - Generate mesh.json from mesh.config.js
- `npm run create` - Build and create new mesh
- `npm run update` - Build and update existing mesh
- `npm run status` - Check mesh deployment status
- `npm run describe` - Show mesh configuration details

## Related Repositories

- **[eds-commerce-mesh](https://github.com/skukla/commerce-eds-mesh)** - EDS mesh for PaaS backend
- **[headless-commerce-mesh](https://github.com/skukla/headless-commerce-mesh)** - Prefixed mesh for Headless storefronts

## License

Private - All rights reserved
