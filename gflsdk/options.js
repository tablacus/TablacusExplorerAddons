Addons.GFLSDK = {
	DLL: await api.DllGetClassObject(BuildPath(ui_.Installed, ["addons\\gflsdk\\tgflsdk", ui_.bit, ".dll"].join("")), "{04D5F147-2A06-4760-9120-7CAE154FBB21}")
};

const s = [];

for (let i = 32; i <= 64; i += 32) {
	s.push('<table style="width: 100%"><tr><td style="width: 100%; vertical-align: bottom">libgfl*.dll (<label>', i, '-bit</label>)</td>');
	s.push('<td><input type="button" value="Portable" onclick="PortableX(\'dll', i, '\')"></td><td><input type="button" value="Browse..." onclick="RefX(\'dll', i, '\', 0, 0, 1, \'*.dll\')"></td></tr></table>');
	s.push('<td><input type="text" name="dll', i, '" style="width: 100%" onchange="SetProp()"><br>');
}

s.push('<br><label>Information</label>&emsp;<span id="ver"></span>');
s.push('<table style="width: 100%"><tr><td id="prop0" style="width: 50%"></td><td id="prop1" style="width: 50%"></td></tr></table>');
s.push('<br><input type="button" value="', await api.sprintf(999, await GetText("Get %s..."), "GFL SDK"), '" title="https://www.xnview.com/en/GFL/index.php" onclick="wsh.Run(this.title)">');

SetTabContents(0, "", s);

SetProp = async function () {
	let GFL = {};
	const arProp = ["gflLibraryInit", "gflLibraryExit", "gflLoadBitmap", "gflLoadThumbnail", "gflLoadBitmapFromHandle", "gflLoadThumbnailFromHandle", "gflGetVersion", "gflGetErrorString", "IsUnicode"];
	if (Addons.GFLSDK.DLL) {
		GFL = await Addons.GFLSDK.DLL.Open(await ExtractPath(te, document.F.elements["dll" + ui_.bit].value)) || {};
	}
	document.getElementById("ver").innerText = (await GFL.gflGetVersion ? (await api.LoadString(hShell32, 60) || "%").replace(/%.*/, await GFL.gflGetVersion() || "") : "") + '(' + await GetTextR(ui_.bit + "-bit") + ")";
	const arHtml = [[], []];
	for (let i in arProp) {
		arHtml[i % 2].push('<input type="checkbox" ', await GFL[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '<br>');
	}
	for (let i = 2; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
}

setTimeout(SetProp, 999);
