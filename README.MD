# [Website](https://rad.icmt.cc/)

# [Documentation](https://icmt.cc/p/rad-the-local-radiaton-website/)

# Note! If you have a spare GM tube and esp8266, maybe you want to set it up on my server and on my site users can switch from one location to another?

# How to Start:

* Deterministic local setup:
	* Run `npm run verify:local`.
	* This resets local state, initializes D1, seeds fixture data, and checks JS syntax.
* End-to-end smoke test (API + frontend contracts):
	* Run `npm run test:e2e:local`.
	* This boots local worker, validates core endpoints, and checks key frontend markers.
* Start local server: Run `npm run dev`.
* Optional parity check against Cloudflare runtime: Run `npm run dev:remote`.
* Optional live-data seed (non-deterministic): Run `npm run db:seed:live` to fetch latest readings from [rad.icmt.cc](https://rad.icmt.cc/).
* View the site: Open [http://localhost:8787](http://localhost:8787).

# Workflow Notes

* `npm run db:seed` now uses deterministic fixture data by default.
* Use `npm run db:seed:live` only when you want to test against current production-like data.
