# Atlas Quest

*A vintage geography adventure — parchment map, compass rose, wax stamps and airmail stripes.*

Live: https://kumarnikhildeveloperaccount.github.io/atlasquest/

## Features
- **Map Room** – a stylised, hand-written SVG world map (equirectangular, simplified coastlines) with a pin for each of 195 countries. Drag to pan, pinch / Ctrl+wheel / buttons to zoom, arrow keys and +/− on keyboard. Tap a pin for its gazetteer card; an airmail plane flies between pins and the compass needle swings to the bearing.
- **Expeditions** (10 questions each unless timed):
  - Flags of the World (only flags that can be drawn faithfully with simple shapes)
  - Capital Cities (both directions)
  - Continents (transcontinental countries excluded)
  - Find the Region (tap a blank map; scored by great-circle distance, with a multiple-choice fallback for keyboard/screen-reader users)
  - Currencies
  - Around the World in 80 Seconds (timed, combo multiplier)
  - Daily Challenge (seeded by the local date — identical for everyone that day)
- **Passport** – multiple traveller profiles in `localStorage`, 20 passport stamps (achievements, one secret), best scores per expedition, a date-keyed daily streak with a 28-day calendar, **PNG export of the passport**, JSON backup/restore.
- **Gazetteer** – searchable, filterable list of all 195 countries (capital, continent, currency, notes).
- Two themes (Parchment day / Lamplight night), synthesized Web Audio sounds (off by default), reduced-motion support, low-power mode, fully responsive 360px → 4K.

## Files
```
index.html  404.html  favicon.svg  manifest.webmanifest  README.md
css/base.css  css/views.css
js/data.js  js/flags.js  js/mapdata.js  js/map.js  js/audio.js
js/profile.js  js/passport.js  js/quiz.js  js/app.js
```
No libraries, no CDNs, no web fonts, no APIs, no trackers.

## Data notes & honest limitations
- The map is **stylised and approximate**: recognisable, not survey-accurate. No borders; pins are rough positions.
- 195 countries = 193 UN members + Vatican City + Palestine. Where a fact is contested or in transition it is omitted (e.g. capitals of Israel, Palestine, Nauru, Equatorial Guinea; currencies of Palestine and Zimbabwe) and that country sits out that quiz.
- Facts reflect the author's knowledge at time of writing (e.g. Bulgaria uses the euro from 1 Jan 2026). Capitals with nuance (Bolivia, South Africa, Netherlands…) carry a footnote.
- Flags are drawn for ~65 countries only; flags with coats of arms, script or detailed emblems are skipped rather than drawn wrong. Colours are close approximations.
- Daily challenge uses the device's local date, so travellers in different time zones may see the next puzzle at different moments.

## Credits
Designed & built by **Kumar Nikhil** — [Portfolio](https://kumarnikhildeveloperaccount.github.io/) · [LinkedIn](https://www.linkedin.com/in/kumar-nikhil-1000a9192/) · [Email](mailto:nkashyapnikhilnk@gmail.com)

With gratitude to God — Om Namah Paarvati Pateh, Har Har Mahadev. May God bless you and everyone.
