/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as TripTripIdImport } from './routes/trip.$tripId'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const TripTripIdRoute = TripTripIdImport.update({
  id: '/trip/$tripId',
  path: '/trip/$tripId',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/trip/$tripId': {
      id: '/trip/$tripId'
      path: '/trip/$tripId'
      fullPath: '/trip/$tripId'
      preLoaderRoute: typeof TripTripIdImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/trip/$tripId': typeof TripTripIdRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/trip/$tripId': typeof TripTripIdRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/trip/$tripId': typeof TripTripIdRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/trip/$tripId'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/trip/$tripId'
  id: '__root__' | '/' | '/trip/$tripId'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  TripTripIdRoute: typeof TripTripIdRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  TripTripIdRoute: TripTripIdRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/trip/$tripId"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/trip/$tripId": {
      "filePath": "trip.$tripId.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
