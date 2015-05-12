var g_nLast = 0;

function DialogResize1()
{
	var h = document.documentElement.clientHeight || document.body.clientHeight;
	var i = document.getElementById("buttons").offsetHeight * screen.deviceYDPI / screen.logicalYDPI + 6;
	h -= i > 34 ? i : 34;
	if (h > 0) {
		document.getElementById("panel0").style.height = h + 'px';
	}
};

function AddFilter(strPath, strColor)
{
	s = ['<table style="width: 100%"><tr><td><input type="text" name="p', g_nLast, '" value="', strPath, '" style="width: 100%" onchange="ChangeFilter(this)" placeholder="ext" title="Type" /></td>'];
	s.push('<td style="width: 7em"><input type="text" name="c', g_nLast, '" value="', strColor, '"  style="width: 100%" placeholder="Color" title="Color" /></td>');
	s.push('<td style="width: 1em"><input type="button" name="b', g_nLast, '" value=" " class="color" style="background-color:', strColor, '; width: 100%" onclick="ChooseColor2(this)" title="Color" /></td>');
	s.push('</tr></table>');
	var o = document.getElementById("panel0");
	o.insertAdjacentHTML("BeforeEnd", s.join(""));
	ApplyLang(o);
	g_nLast++;
}

function ChangeFilter(o)
{
	if (o.name.replace(/\D/, "") == g_nLast - 1) {
		AddFilter("", "");
	}
}

function ChangeColor(o)
{
	var n = o.name.replace(/\D/, "");
	document.F.elements["b" + n].style.backgroundColor = o.value;
}

function ChooseColor2(o)
{
	var n = o.name.replace(/\D/, "");
	var oc = document.F.elements["c" + n];
	var c = ChooseWebColor(oc.value);
	if (c) {
		oc.value = c;
		ChangeColor(oc);
	}
}

try {
	var ado = te.CreateObject("Adodb.Stream");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
	while (!ado.EOS) {
		var ar = ado.ReadText(adReadLine).split("\t");
		AddFilter(ar[0], ar[1]);
	}
	ado.Close();
}
catch (e) {
}
AddFilter("", "");

ApplyLang(document);
DialogResize1();

AddEventEx(window, "resize", function ()
{
	clearTimeout(g_tidResize);
	g_tidResize = setTimeout(function ()
	{
		DialogResize1();
	}, 500);
});

AddEventEx(window, "beforeunload", function ()
{
	SetOptions(function () {
		Save();
		TEOk();
	});
});

function Save()
{
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		for (var i = 0; i < g_nLast; i++) {
			var s = document.F.elements['p' + i].value;
			if (s) {
				ado.WriteText([s, document.F.elements['c' + i].value].join("\t") + "\r\n");
			}
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"), adSaveCreateOverWrite);
		ado.Close();
		alert(Addons_Id);
	}
	catch (e) {
	}
}
