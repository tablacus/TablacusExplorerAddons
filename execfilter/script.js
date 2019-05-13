if (window.Addon == 1) {
	AddType("Execution filter",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			Selected = FV.SelectedItems();
			if (Selected.Count) {
				var Item = Selected.Item(0);
				var Path = Item.Path;
				if (IsFolderEx(Item)) {
					var Path2 = Path + ".folder";
				}
				for (var lines = s.split("\n"); lines.length;) {
					var ar = lines.shift().split(",");
					if (ar[0] && ar.length > 2) {
						if (PathMatchEx(Path, ar[0]) || (Path2 && PathMatchEx(Path2, ar[0]))) {
							return Exec(Ctrl, ar[2], ar[1], hwnd, pt);
						}
					}
				}
			}
		},

		Ref: function (s, pt)
		{
			var last = s.split("\n").pop();
			var ar = last.split(",");
			switch (ar.length) {
				case 2:
					var arFunc = [];
					RunEvent1("AddType", arFunc);
					var r = g_basic.Popup(arFunc, s, pt);
					if (r) {
						return s + r + ",";
					}
					break;
				case 3:
					var Id = GetSourceText(ar[1]);
					var r = OptionRef(Id, "", pt);
					if (/^string$/i.test(typeof r)) {
						return s + r + "\n";
					}
					break;
				default:
					var r = InputDialog("Filter", last);
					if (r) {
						return s + (s.length && !/\n$/.test(s) ? "\n" : "") + r + ",";
					}
					break;
			}
		}
	});

	AddEvent("OptionEncode", function (Id, p)
	{
		if (Id.toLowerCase() == "execution filter") {
			var lines = p.s.split("\n");
			for (var i = lines.length; i--;) {
				var ar = lines[i].split(",");
				if (ar[1]) {
					ar[1] = GetSourceText(ar[1]);
					if (ar[2]) {
						var p2 = { s: ar[2] };
						MainWindow.OptionEncode(ar[1], p2);
						ar[2] = p2.s;
					}
					lines[i] = ar.join(",");
				}
			}
			p.s = lines.join("\n");
		}
	});

	AddEvent("OptionDecode", function (Id, p)
	{
		if (Id.toLowerCase() == "execution filter") {
			var lines = p.s.split("\n");
			for (var i = lines.length; i--;) {
				var ar = lines[i].split(",");
				if (ar[1]) {
					if (ar[2]) {
						var p2 = { s: ar[2] };
						MainWindow.OptionDecode(ar[1], p2);
						ar[2] = p2.s;
					}
					ar[1] = GetText(ar[1]);
					lines[i] = ar.join(",");
				}
			}
			p.s = lines.join("\n");
		}
	});
}
