if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", async function () {
		const item = await GetAddonElement("tabdesign");
		const css = document.styleSheets.item(0);
		const ar = ["activetab", "tab", "tab2", "tab3", "tab0", "default"];
		for (let i = 0; i < ar.length; i++) {
			const n = ar[i];
			const n2 = n == "default" ? "tab0 li" : n;
			let s = item.getAttribute(n);
			if (s) {
				if (css.insertRule) {
					css.insertRule([".", n2, " { ", s.replace(/\xa0/g, "\n"), " }"].join(""), css.cssRules.length);
					if (s = item.getAttribute(n + '_before')) {
						css.insertRule([".", n2, ":before { ", s.replace(/\xa0/g, "\n"), " }"].join(""), css.cssRules.length);
					}
					if (s = item.getAttribute(n + '_after')) {
						css.insertRule([".", n2, ":after { ", s.replace(/\xa0/g, "\n"), " }"].join(""), css.cssRules.length);
					}
				} else if (css.addRule) {
					css.addRule("." + n2, s.replace(/\xa0/g, "\n"));
					if (s = item.getAttribute(n + '_before')) {
						css.addRule("." + n2 + ":before", s.replace(/\xa0/g, "\n"));
					}
					if (s = item.getAttribute(n + '_after')) {
						css.addRule("." + n2 + ":after", s.replace(/\xa0/g, "\n"));
					}
				}
			}
		}
	}.toString().replace(/^[^{]+{|}$/g, ""));
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
