# Changelog

## [0.2.1](https://github.com/einord/labben/compare/labben-v0.2.0...labben-v0.2.1) (2026-04-09)


### Bug Fixes

* made deploy quicker ([455229e](https://github.com/einord/labben/commit/455229ede246a74d9906c1c3520a10f50b24b7ae))

## [0.2.0](https://github.com/einord/labben/compare/labben-v0.1.0...labben-v0.2.0) (2026-04-08)


### Features

* add confirmation dialogs for destructive operations ([#58](https://github.com/einord/labben/issues/58)) ([8f3f5c6](https://github.com/einord/labben/commit/8f3f5c63d2b2b97eeee0ed01ed8a62ac3d6f05d4))
* add Docker status polling and improve state synchronization ([#56](https://github.com/einord/labben/issues/56)) ([029e065](https://github.com/einord/labben/commit/029e065a19891f149dbd1ec92b3a2470a81c504b))
* add per-project concurrency control for Docker operations ([#57](https://github.com/einord/labben/issues/57)) ([e399c3a](https://github.com/einord/labben/commit/e399c3a531dc778867174843e8fbb60cc938f7e2))
* add release-please and commit linting ([530bca8](https://github.com/einord/labben/commit/530bca881e9bdeae3c7ddc720138ffefe62ea65e))
* add server-side restart endpoint and improve update error messages ([#55](https://github.com/einord/labben/issues/55)) ([855bd38](https://github.com/einord/labben/commit/855bd38b4602ec7a0ae2542c5fe8c1b8df9982f1)), closes [#19](https://github.com/einord/labben/issues/19)
* graceful degradation when Docker is unavailable ([407aa00](https://github.com/einord/labben/commit/407aa0008b490138050d592e98f68917f639ad41))
* harden session management with revocation, rotation, and secret handling ([#51](https://github.com/einord/labben/issues/51)) ([dd896d8](https://github.com/einord/labben/commit/dd896d8426dea6132e40e9125f34b632a815d0ce))
* make Proxy and Backup features discoverable in navigation ([#60](https://github.com/einord/labben/issues/60)) ([6dd6a4d](https://github.com/einord/labben/commit/6dd6a4d71b366bcfc9e7dc3859da8dd1b4a20203))
* validate configuration at startup and YAML on compose save ([#50](https://github.com/einord/labben/issues/50)) ([2d90369](https://github.com/einord/labben/commit/2d90369ff31f04c8427ebcbfdca0239ceb4f1840))


### Bug Fixes

* add authentication to WebSocket log stream ([#49](https://github.com/einord/labben/issues/49)) ([dc7ae7f](https://github.com/einord/labben/commit/dc7ae7f085a6e91dfac17883f2f3f0570807787c))
* add defense-in-depth domain validation in nginx config generation ([#42](https://github.com/einord/labben/issues/42)) ([90473c1](https://github.com/einord/labben/commit/90473c181f0434f4e9116d7e66c40fded3d3782c))
* add loading states and double-click protection on container/proxy operations ([#59](https://github.com/einord/labben/issues/59)) ([42d820c](https://github.com/einord/labben/commit/42d820cd0df10b4c7a15edfdf9c8f2837690bddd))
* add missing stat import in backup service ([#47](https://github.com/einord/labben/issues/47)) ([9731def](https://github.com/einord/labben/commit/9731defa55e17e23af25177c66d2f9b259ef9752)), closes [#24](https://github.com/einord/labben/issues/24)
* improve error handling when Docker daemon is unavailable ([#48](https://github.com/einord/labben/issues/48)) ([d2c3fb5](https://github.com/einord/labben/commit/d2c3fb5c286f798797a0b9f4065e454c5ec87972))
* log symlink errors and surface status in system health ([#43](https://github.com/einord/labben/issues/43)) ([0a3b0b8](https://github.com/einord/labben/commit/0a3b0b80deeba4b24946622dcdbaa56ebe8bd1d9))
* made project build and improved testing ([5b3cd44](https://github.com/einord/labben/commit/5b3cd442800e25142269e000939e85852ae69cd7))
* restrict API access during setup mode ([#39](https://github.com/einord/labben/issues/39)) ([cd01f7e](https://github.com/einord/labben/commit/cd01f7e0f03d31f3e2dae42ee361e47933ac7542)), closes [#10](https://github.com/einord/labben/issues/10)
* restrict backup destination paths to prevent path traversal ([#52](https://github.com/einord/labben/issues/52)) ([bee1d1a](https://github.com/einord/labben/commit/bee1d1aedc4e1b3188e350cdb6eeff78f318a013))
* standardize COMPOSE_PATH env variable across all services ([#44](https://github.com/einord/labben/issues/44)) ([0be68ad](https://github.com/einord/labben/commit/0be68ad531a5a864bde0465035f8d0f540b17ba0))
* surface silent fetch errors and add missing error details ([#54](https://github.com/einord/labben/issues/54)) ([b49d62b](https://github.com/einord/labben/commit/b49d62bd086e2a42f208ee35994bcecd610f6040))
* use host paths directly for compose commands instead of resolveComposePath ([#53](https://github.com/einord/labben/issues/53)) ([e08052a](https://github.com/einord/labben/commit/e08052af5b6462bb96e9ee86c51d2d24ad130516)), closes [#38](https://github.com/einord/labben/issues/38)
* verify session userId matches request in passkey registration ([#45](https://github.com/einord/labben/issues/45)) ([cb22043](https://github.com/einord/labben/commit/cb22043745b30e32b6c205443b880e7af2d57229))
* wait for hydration before interacting with settings modal in e2e tests ([23c413b](https://github.com/einord/labben/commit/23c413bfd3675254bce51c552be550a92fb29bde))


### Documentation

* enforce test gate before PR creation in implement and review skills ([51d0019](https://github.com/einord/labben/commit/51d00191947ec4edf1c9ec9121643499b83729a1))
