var s = [];

for (var i = 32; i <= 64; i += 32) {
	s.push('<div class="panel" style="width: 100%; display: block"><table style="width: 100%"><tr><td style="width: 100%; vertical-align: bottom">libgfl*.dll (<label>', i, '-bit</label>)</td>');
	s.push('<td><input type="button" value="Portable" onclick="PortableX(\'dll', i, '\')"></td><td><input type="button" value="Browse..." onclick="RefX(\'dll', i, '\', 0, 0, 1, \'*.dll\')"></td></tr></table>');
	s.push('<td><input type="text" name="dll', i, '" style="width: 100%" onchange="SetProp()"></div>');

	s.push('<div class="panel" style="width: 100%; display: block"><table style="width: 100%"><tr><td style="width: 100%; vertical-align: bottom">libgfle*.dll (<label>', i, '-bit</label>)</td>');
	s.push('<td><input type="button" value="Portable" onclick="PortableX(\'dlle', i, '\')"></td><td><input type="button" value="Browse..." onclick="RefX(\'dlle', i, '\', 0, 0, 1, \'*.dll\')"></td></tr></table>');
	s.push('<td><input type="text" name="dlle', i, '" style="width: 100%" onchange="SetProp()"></div>');

}

s.push('<br><label>Information</label>&emsp;<span id="ver"></span>');
s.push('<table style="width: 100%"><tr><td id="prop0" style="width: 50%"></td><td id="prop1" style="width: 50%"></td></tr></table>');
s.push('<br><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "GFL SDK"), '" title="https://newsgroup.xnview.com/viewtopic.php?f=4&t=21686" onclick="wsh.Run(this.title)">');

SetTabContents(0, "", s);

SetProp = function ()
{
	var GFL = {};
	var bit = api.sizeof("HANDLE") * 8;
	var arProp = ["gflLibraryInit", "gflLibraryExit", "gflLoadBitmap", "gflLoadThumbnail", "gflLoadBitmapFromHandle", "gflLoadThumbnailFromHandle", "gflGetVersion", "gflGetErrorString", "gflConvertBitmapIntoDDB", "IsUnicode"];
	var DLL = api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\gflsdk\\tgflsdk", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{04D5F147-2A06-4760-9120-7CAE154FBB21}");
	if (DLL) {
		GFL = DLL.Open(api.PathUnquoteSpaces(ExtractMacro(te, document.F.elements["dll" + bit].value)), api.PathUnquoteSpaces(ExtractMacro(te, document.F.elements["dlle" + bit].value))) || {};
	}
	document.getElementById("ver").innerText = (GFL.gflGetVersion ? (api.LoadString(hShell32, 60) || "%").replace(/%.*/, GFL.gflGetVersion() || "") : "") + '(' + GetTextR(bit + "-bit") + ")";
	var arHtml = [[], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<input type="checkbox" ', GFL[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '<br / >');
	}
	for (var i = 2; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
}

AddEventEx(window, "load", SetProp);