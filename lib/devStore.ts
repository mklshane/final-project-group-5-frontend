/** Module-level flag — when true, the route guard skips all redirects. DEV only. */
let bypassGuard = false;

export const devStore = {
  isBypassing: () => bypassGuard,
  setBypass: (val: boolean) => { bypassGuard = val; },
};
