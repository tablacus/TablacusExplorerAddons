if (window.Addon == 1) {
	AddEvent("BrowserCreated", function (doc)
	{
		var item = GetAddonElement("tabdesign");
		var css = doc.styleSheets.item(0);
		var ar = ["activetab", "tab", "tab2", "tab3", "tab0", "default"];
		for (var i = 0; i < ar.length; i++) {
			var n = ar[i];
			var n2 = n == "default" ? "tab0 li" : n;
			var s = item.getAttribute(n);
			if (s) {
				if (css.insertRule) {
					css.insertRule([".", n2, " { ", s, " }"].join(""), css.cssRules.length);
					if (s = item.getAttribute(n + '_before')) {
						css.insertRule([".", n2, ":before { ", s, " }"].join(""), css.cssRules.length);
					}
					if (s = item.getAttribute(n + '_after')) {
						css.insertRule([".", n2, ":after { ", s, " }"].join(""), css.cssRules.length);
					}
				} else if (css.addRule) {
					css.addRule("." + n2, s);
					if (s = item.getAttribute(n + '_before')) {
						css.addRule("." + n2 + ":before", s);
					}
					if (s = item.getAttribute(n + '_after')) {
						css.addRule("." + n2 + ":after", s);
					}
				}
			}
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
