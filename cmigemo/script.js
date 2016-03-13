var Addon_Id = "cmigemo";

var item = GetAddonElement(Addon_Id);

Addons.CMigemo = 
{
	Init: function (item)
	{
		var bit = String(api.sizeof("HANDLE") * 8);
		migemo = api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\cmigemo\\tcmigemo" + bit + '.dll'), "{08D62D88-0F74-4a37-9F24-628A385EEC5C}");
		if (migemo) {
			migemo.open(api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("dll" + bit))), api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("dict"))), item.getAttribute("CP"));
		}
		return migemo;
	},

	Finalize: function ()
	{
		window.migemo = null;
	}
}
if (window.Addon == 1) {
	if (!window.migemo) {
		Addons.CMigemo.Init(item);
	}

	AddEvent("Finalize", Addons.CMigemo.Finalize);

	AddEventId("AddonDisabledEx", "cmigemo", Addons.CMigemo.Finalize);
} else {
	var s = [''];
	s.push('<div class="panel" style="width: 100%; display: block"><label>Test</label><br /><input type="text" autocomplete="off" onkeyup="KeyUp(this)" style="width: 50%" /><input type="button" value="Refresh" onclick="Refresh()" /><br />');

	s.push('<label>Regular Expression</label><br /><input type="text" id="_Migemo" style="width: 100%" readonly /></div>');

	Addons.CMigemo.Item =
	{
		getAttribute: function (s)
		{
			var o = document.F.elements[s];
			return o ? o.value :  null;
		}
	}

	KeyUp = function (o)
	{
		var m;
		if (Addons.CMigemo.Reload) {
			m = Addons.CMigemo.Init(Addons.CMigemo.Item);
			Addons.CMigemo.Reload = false;
			CollectGarbage();
		} else {
			m = window.migemo || (MainWindow.Addons.CMigemo && MainWindow.migemo) || Addons.CMigemo.Init(Addons.CMigemo.Item);
		}
		try {
			document.getElementById("_Migemo").value = m ? m.query(o.value) || o.value : o.value;
		} catch (e) {
			document.getElementById("_Migemo").value = e.description || e.toString();
		}
	}

	Refresh = function () {
		Addons.CMigemo.Reload = true;
	}

	for (var i = 32; i <= 64; i += 32) {
		s.push('<div class="panel" style="width: 100%; display: block"><label>migemo.dll (', i, 'bit)</label><br /><input type="text" name="dll', i, '" style="width: 100%" /><br />');
		s.push('<input type="button" value="Browse..." onclick="RefX(\'dll', i, '\', 0, 0, 1)" /><input type="button" value="Portable" onclick="PortableX(\'dll', i, '\')" /></div>');
	}
	s.push('<div class="panel" style="width: 100%; display: block"><label>migemo-dict</label>&emsp;<label>CP</label><input type="text" name="CP" size="6" /><br /><input type="text" name="dict" style="width: 100%" /><br />');
	s.push('<input type="button" value="Browse..." onclick="RefX(\'dict\', 0, 0, 1)" /><input type="button" value="Portable" onclick="PortableX(\'dict\')" />');
	s.push('<input type="button" value="UTF-8(CP65001)" onclick="document.F.CP.value=65001" /><input type="button" value="SHIFT_JIS(CP932)" onclick="document.F.CP.value=932" /></div>');
	s.push('<br /><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "C/Migemo"), '" title="http://www.kaoriya.net/software/cmigemo/" onclick="wsh.Run(this.title)">');
	SetTabContents(0, "General", s.join(""));

	AddEventEx(window, "beforeunload", Addons.CMigemo.Finalize);
}
