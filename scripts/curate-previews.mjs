// One-off curation pass over scripts/previews.json: override the auto-picked
// `chosen` track with the hand-selected signature track per album, and null out
// albums where iTunes' top match was the wrong record (so they play nothing
// rather than the wrong song). Re-runnable; only sets the keys listed here.
//
//   node scripts/curate-previews.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET = path.join(__dirname, "previews.json");

// recordId -> chosen track id (the signature "taste test" track), or null to
// suppress the preview entirely (wrong-album match / not really this record).
const PICKS = {
  // — signature-track upgrades (match is correct, pick the iconic cut) —
  "alabama-shakes-sound-and-color": 1586886959, // Don't Wanna Fight
  "alan-parsons-project-i-robot": 1240904823, // I Wouldn't Want to Be Like You
  "alan-parsons-project-tales-of-mystery-and-imagination": 1434894450, // The Raven
  "anderson-paak-malibu": 1074099194, // Come Down
  "anderson-paak-malibu-2": 1074099194, // Come Down
  "beach-boys-with-the-royal-philharmonic-orchestra": 1377349262, // Good Vibrations
  "berlioz-open-this-wall": 1741008357, // open this wall (title track)
  "david-sanborn-voyeur": 184614724, // Run for Cover
  "father-john-misty-fear-fun": 669285168, // Hollywood Forever Cemetery Sings
  "frankie-goes-to-hollywood-welcome-to-the-pleasuredome": 1365569655, // Relax
  "marty-robbins-gunfighter-ballads-and-trail-songs": 158517936, // El Paso
  "pablo-cruise-reflector": 1443547409, // Cool Love
  "pink-floyd-the-wall": 1065976170, // Comfortably Numb
  "robert-palmer-sneaking-sally-through-the-alley": 1440661853, // Sneakin' Sally Through the Alley
  "santana-abraxas": 871146600, // Black Magic Woman / Gypsy Queen
  "santana-amigos": 897788773, // Europa (Earth's Cry Heaven's Smile)
  "santana-shango": 192663380, // Hold On
  "silk-sonic-an-evening-with-silk-sonic": 1612867242, // Leave the Door Open
  "sister-sledge-we-are-family": 1691509918, // We Are Family (title track)
  "snarky-puppy-family-dinner": 1292525337, // Something (feat. Lalah Hathaway)
  "engelbert-humperdinck-wonderland-by-night": 1443158068, // Wonderland By Night (title cut on the comp)

  // — wrong-album matches: suppress rather than play the wrong song —
  "anderson-paak-tiny-desk-concert": null, // matched a Ferxxo "Tiny Desk" EP
  "anderson-paak-venice": null, // matched the Silk Sonic "Love's Train" single
  "klique-try-it-out": null, // matched a Skrillex single
  "leon-bridges-leon": null, // matched "Beyond" (wrong, earlier era)
  "pink-floyd-dark-side-of-the-moon": null, // matched a reggae tribute album
  "asap-rocky-dont-be-dumb": null, // matched a Kelly Rowland single
};

const sheet = JSON.parse(fs.readFileSync(SHEET, "utf8"));
let changed = 0;
const warn = [];

for (const [id, trackId] of Object.entries(PICKS)) {
  const e = sheet[id];
  if (!e) {
    warn.push(`${id}: not in worksheet`);
    continue;
  }
  if (trackId === null) {
    e.chosen = null;
    e.chosenName = null;
    changed++;
    continue;
  }
  const t = e.tracks.find((x) => x.id === trackId);
  if (!t) {
    warn.push(`${id}: track ${trackId} not found`);
    continue;
  }
  if (!t.preview) {
    warn.push(`${id}: track ${trackId} (${t.name}) has no preview url`);
    continue;
  }
  e.chosen = t.id;
  e.chosenName = t.name;
  changed++;
}

fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");
console.log(`Curated ${changed} picks.`);
if (warn.length) {
  console.log("Warnings:");
  warn.forEach((w) => console.log("  - " + w));
}
