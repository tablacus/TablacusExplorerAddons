var items = te.Data.Addons.getElementsByTagName("tabdesign");
if (items.length) {
	var item = items[0];
}
else {
	item = { getAttribute: function () {} };
}
if (window.Addon == 1) {
	var newStyle = document.createElement("style");
	newStyle.type = "text/css";
	var oHead = document.getElementsByTagName("head").item(0);
	oHead.appendChild(newStyle);
	var css = document.styleSheets.item(0);
	var ar = ["activetab", "tab", "tab2", "tab3", "tab0", "default"];
	var sd = ["border-radius: 9px 9px 0px 0px; border-bottom: 0px", "border-radius: 9px 9px 0px 0px", "border-radius: 9px 9px 0px 0px", "border-radius: 9px 9px 0px 0px"];
	css2 = ["<style>\n"];
	for (var i in ar) {
		var n = ar[i];
		var n2 = n == "default" ? "tab0 li" : n;
		if (css.insertRule) {
			css.insertRule([".", n2, " { ", item.getAttribute(n) || sd[i], " }"].join(""), css.cssRules.length);
			var s = item.getAttribute(n + '_before');
			if (s) {
				css.insertRule([".", n2, ":before { ", s, " }"].join(""), css.cssRules.length);
			}
			var s = item.getAttribute(n + '_after');
			if (s) {
				css.insertRule([".", n2, ":after { ", s, " }"].join(""), css.cssRules.length);
			}
		}
		else if (css.addRule) {
			css.addRule("." + n2, item.getAttribute(n) || sd);
			var s = item.getAttribute(n + '_before');
			if (s) {
				css.addRule("." + n2 + ":before", s);
			}
			s = item.getAttribute(n + '_after');
			if (s) {
				css.addRule("." + n2 + ":after", s);
			}
		}
	}
}
