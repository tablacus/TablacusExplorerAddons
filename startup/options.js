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
setTimeout(async function () {
	const o = document.F.Type;
	const p = await api.CreateObject("Object");
	p.s = document.F.Path.value;
	await MainWindow.OptionDecode(o[o.selectedIndex].value, p);
	document.F.Path.value = await p.s;
}, 999);

SaveLocation = async function () {
	const o = document.F.Type;
	const p = await api.CreateObject("Object");
	p.s = document.F.Path.value;
	await MainWindow.OptionEncode(o[o.selectedIndex].value, p);
	document.F.Path.value = await p.s;
}
