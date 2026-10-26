# Firefox release process

Moo produces one Firefox Manifest V3 package. Firefox and Zen are the supported targets. The retained Safari project, Marketplace assets and upstream attribution are historical material; current CI does not build or submit them.

1. Start from a reviewed checkout and run `bun install --frozen-lockfile`, `bun run test`, `bun run lint`, `bun run build` and `node scripts/validateFirefox.cjs`.
2. Test `build/firefox/manifest.json` through `about:debugging` in Firefox and Zen. Check startup, restart persistence, permissions, Google account changes, feeds, uploaded pictures, narrow splits and keyboard workflows. The localhost preview does not provide the extension APIs.
3. Set a numeric version with `node scripts/setVersion.cjs 1.2.3`. Review the package, Firefox manifest and constants changes. Update the lockfile if the package metadata requires it. Write reviewed release notes in `docs/RELEASE-NOTES.md`, rerun the checks, then commit and create the matching `v1.2.3` tag through the usual review process.
4. Run **Manual Firefox release** with the existing tag. It verifies the tag format, package version, tests and archive contents. It creates a draft unless Publish immediately is explicitly selected. Configure the `firefox-release` GitHub environment's reviewers before enabling public release operations.
5. Review the draft and unsigned archive before publication. The workflow does not sign or submit to AMO, merge branches, bump versions automatically or publish Chrome artifacts.

Firefox Release and Beta require a Mozilla-signed add-on for normal installation. Temporary installation is for development and ends at restart. Renaming a ZIP to XPI does not sign it. For a durable distribution, submit the reviewed archive and required build sources to AMO using either listed or self-distributed signing, then distribute the returned signed XPI. Signing credentials stay outside this repository. See Mozilla's [signing overview](https://www.extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) and [temporary installation instructions](https://www.extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

GitHub releases can distribute the unsigned archive for temporary installation. Publishing a GitHub release does not sign the extension or submit it to AMO.
