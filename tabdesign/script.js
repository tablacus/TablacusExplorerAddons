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
	document.getElementsByTagName("head").item(0).appendChild(newStyle);
	var css = document.styleSheets.item(0);
	var sd = "border-radius: 9px 9px 0px 0px";
	var ar = ["activetab", "tab", "tab2"];
	for (var i in ar) {
		if (css.insertRule) {
			css.insertRule([".", ar[i], " { ", item.getAttribute(ar[i]) || sd, " }"].join(""), css.cssRules.length);
		}
		else if (css.addRule) {
			css.addRule("." + ar[i], item.getAttribute(ar[i]) || sd);
		}
	}
}
