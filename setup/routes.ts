import type { RouteRecordRaw } from 'vue-router'

// Replace the default presenter page (/presenter/:no) with the
// presenter-top layout: speaker notes on top, current and next
// slide side by side below.
export default function setupRoutes(routes: RouteRecordRaw[]) {
  return routes.map(route =>
    route.name === 'presenter'
      ? { ...route, component: () => import('../components/PresenterTop.vue') }
      : route,
  )
}
