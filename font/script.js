const Addon_Id = "font";
if (window.Addon == 1) {
	await $.importScript("addons\\" + Addon_Id + "\\sync.js");
	Promise.all([$.DefaultFont.lfFaceName, $.DefaultFont.lfHeight, $.DefaultFont.lfWeight]).then(function (r) {
		document.body.style.fontFamily = r[0];
		document.body.style.fontSize = Math.abs(r[1]) + "px";
		document.body.style.fontWeight = r[2] || 400;
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
