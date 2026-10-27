import { DUBAN_ADS, EXPLORE_PICKS, WHATS_ON } from "./explore-durban";

let passed = 0;
function ok(c: boolean, m: string) {
  if (!c) throw new Error(m);
  passed++;
}

ok(EXPLORE_PICKS.length >= 8, "at least 8 guide picks");
ok(EXPLORE_PICKS.every((p) => p.sourceUrl.startsWith("http")), "all picks have sources");
ok(EXPLORE_PICKS.every((p) => !/review|★|stars/i.test(p.why)), "no review fluff");
ok(WHATS_ON.every((w) => w.sourceUrl.startsWith("http") && w.whenLabel.length > 0), "whats-on dated+sourced");
ok(DUBAN_ADS.every((a) => /home|stay|shop|WhatsApp|THUMA|Advertise/i.test(a.text)), "ads are Duban promos");
ok(!DUBAN_ADS.some((a) => /Coca|Nike|FakeBrand/i.test(a.text)), "no fake brands");

console.log(`explore-durban.test.ts: ${passed} assertions passed`);
