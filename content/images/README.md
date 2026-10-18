# Trusted diagram icons

- `d2/chrome.svg`: verified catalog URL https://icons.d2lang.com/dev/chrome.svg (HTTP 200), Chrome logo from the catalog's Devicon set.
- SHA-256: `d4f14cd4afe14722b2437f6cbcc0811063f1f8a47a6f2722e97fed9927e66a31`.
- Devicon's MIT notice is retained in `LICENSE-devicon.txt` (https://github.com/devicons/devicon/blob/master/LICENSE). Product names/logos remain their owners' trademarks; used here solely to identify Chrome, not to imply endorsement.
- Reviewed SVG: paths, circles, local gradients only; no script, event handler, foreignObject, or external resource. Do not auto-refresh this asset during builds.
- `assetsRoot: content/images/d2` embeds the reviewed file into both SVG themes at build time. Authored paths are relative to each MDX file. There is no catalog request at reading time.
- AngularJS is not Angular: the catalog's `angularjs.svg` is deliberately not used for modern Angular components.
