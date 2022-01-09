var wsh = new ActiveXObject('WScript.Shell');
var sha = new ActiveXObject("Shell.Application");
var fso = new ActiveXObject("Scripting.FileSystemObject");
var dir = fso.BuildPath(wsh.CurrentDirectory, "lang");
var f = sha.NameSpace(dir);
var ar = ["{\n"];
var Items = f.Items();
var next = "";
for (var i = 0; i < Items.Count; ++i) {
	var path = Items.Item(i).Path;
	if (/\.xml$/.test(path)) {
		ado = new ActiveXObject("ADODB.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(path);
		var s = ado.ReadText(-1);
		ado.Close();
		var res = /<lang author="([^"]*)" en="([^"]*)">([^<]*)/.exec(s);
		if (res) {
			var pubDate = new Date(Items.Item(i).modifyDate).toUTCString().replace(/UTC$/, "GMT");
			ar.push('  "', fso.GetFileName(path), '": {\n');
			ar.push('    "name": "', res[3], '",\n');
			ar.push('    "en": "', res[2], '",\n');
			ar.push('    "author": "', res[1], '",\n');
			ar.push('    "pubDate": "', pubDate, '",\n');
			ar.push('    "size": ', Items.Item(i).Size, '\n');
			ar.push('  }');
			ar.push(',\n');
		}
	}
}
ar[ar.length - 1] = "\n";
ar.push("}\n");

//WScript.Echo(ar.join(""));
ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.WriteText(ar.join(""));
ado.SaveToFile(fso.BuildPath(dir, "index.json"), 2);
ado.Close();
