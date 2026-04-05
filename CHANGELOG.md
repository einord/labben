# Changelog

## [0.2.0](https://github.com/einord/labben/compare/labben-v0.1.0...labben-v0.2.0) (2026-04-05)


### Features

* add release-please and commit linting ([530bca8](https://github.com/einord/labben/commit/530bca881e9bdeae3c7ddc720138ffefe62ea65e))


### Bug Fixes

* add defense-in-depth domain validation in nginx config generation ([#42](https://github.com/einord/labben/issues/42)) ([90473c1](https://github.com/einord/labben/commit/90473c181f0434f4e9116d7e66c40fded3d3782c))
* add missing stat import in backup service ([#47](https://github.com/einord/labben/issues/47)) ([9731def](https://github.com/einord/labben/commit/9731defa55e17e23af25177c66d2f9b259ef9752)), closes [#24](https://github.com/einord/labben/issues/24)
* improve error handling when Docker daemon is unavailable ([#48](https://github.com/einord/labben/issues/48)) ([d2c3fb5](https://github.com/einord/labben/commit/d2c3fb5c286f798797a0b9f4065e454c5ec87972))
* log symlink errors and surface status in system health ([#43](https://github.com/einord/labben/issues/43)) ([0a3b0b8](https://github.com/einord/labben/commit/0a3b0b80deeba4b24946622dcdbaa56ebe8bd1d9))
* restrict API access during setup mode ([#39](https://github.com/einord/labben/issues/39)) ([cd01f7e](https://github.com/einord/labben/commit/cd01f7e0f03d31f3e2dae42ee361e47933ac7542)), closes [#10](https://github.com/einord/labben/issues/10)
* standardize COMPOSE_PATH env variable across all services ([#44](https://github.com/einord/labben/issues/44)) ([0be68ad](https://github.com/einord/labben/commit/0be68ad531a5a864bde0465035f8d0f540b17ba0))
* verify session userId matches request in passkey registration ([#45](https://github.com/einord/labben/issues/45)) ([cb22043](https://github.com/einord/labben/commit/cb22043745b30e32b6c205443b880e7af2d57229))
