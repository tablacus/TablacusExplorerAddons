SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
let arFunc = await api.CreateObject("Array");
await MainWindow.RunEvent1("AddType", arFunc);
if (window.chrome) {
	arFunc = await api.CreateObject("SafeArray", arFunc);
}
let oa = document.F.Type;
for (let i = 0; i < arFunc.length; i++) {
	const o = oa[++oa.length - 1];
	o.value = arFunc[i];
	o.innerText = (await GetText(arFunc[i])).replace(/&|\.\.\.$/g, "").replace(/\(\w\)/, "");
}

GetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		const p = await api.CreateObject("Object");
		if (!s && !ui_.AttrType) {
			s = ui_.AttrPath;
			if (!s) {
				ui_.AttrPath = await $.GetAddonElement(Addon_Id).getAttribute("Path");
				s = ui_.AttrPath;
			}
		}
		p.s = s;
		await MainWindow.OptionDecode(ui_.AttrType || item.getAttribute("Type"), p);
		s = await p.s;
	}
	return s;
}

SetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (ui_.AttrPath) {
			item.removeAttribute("Path");
		}
		const p = await api.CreateObject("Object");
		p.s = s;
		await MainWindow.OptionEncode(ui_.AttrType, p);
		s = await p.s;
	}
	return s;
}

SaveLocation = function () {
	const o = document.F.Type;
	ui_.AttrType = o[o.selectedIndex].value;
};
