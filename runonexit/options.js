var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "", ado.ReadText(adReadAll));
	ado.Close();
	var arFunc = [];
	MainWindow.RunEvent1("AddType", arFunc);
	var oa = document.F.Type;
	for (var i = 0; i < arFunc.length; i++) {
		var o = oa[++oa.length - 1];
		o.value = arFunc[i];
		o.innerText = GetText(arFunc[i]).replace(/&|\.\.\.$/g, "").replace(/\(\w\)/, "");
	}
	setTimeout(function ()
	{
		var o = document.F.Type;
		var p = { s: document.F.Path.value };
		MainWindow.OptionDecode(o[o.selectedIndex].value, p);
		document.F.Path.value = p.s;
		}, 99);
}

SaveLocation = function ()
{
	var o = document.F.Type;
	var p = { s: document.F.Path.value };
	MainWindow.OptionEncode(o[o.selectedIndex].value, p);
	document.F.Path.value = p.s;
}