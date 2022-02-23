if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", async function () {
		const item = ui_.Addons ? GetAddonElement("tabdesign") : await $.GetAddonElement("tabdesign");
		const ar = ["activetab", "tab", "tab2", "tab3", "tab0", "default"];
		for (let i = 0; i < ar.length; i++) {
			const n = ar[i];
			const n2 = n == "default" ? "tab0 li" : n;
			let s = await item.getAttribute(n);
			if (s) {
				AddRule([".", n2, " { ", s.replace(/\xa0/g, "\n"), " }"].join(""));
				if (s = await item.getAttribute(n + '_before')) {
					AddRule([".", n2, ":before { ", s.replace(/\xa0/g, "\n"), " }"].join(""));
				}
				if (s = await item.getAttribute(n + '_after')) {
					AddRule([".", n2, ":after { ", s.replace(/\xa0/g, "\n"), " }"].join(""));
				}
			}
		}
	}.toString().replace(/^[^{]+{|}$/g, ""));
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
