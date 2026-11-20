/**
 * Freebuff Sites entrypoint for the static worksheet build.
 * The app is a client-only SPA: everything is served from ./dist and unknown
 * paths fall back to index.html (spa: true in sites.json), so this Worker only
 * has to hand the request to the Assets binding.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
