AddType("Execution filter", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (Selected.Count) {
			const Item = Selected.Item(0);
			const Path = Item.Path;
			let Path2;
			if (IsFolderEx(Item)) {
				Path2 = Path + ".folder";
			}
			for (let lines = s.split("\n"); lines.length;) {
				const ar = lines.shift().split(",");
				if (ar[0] && ar.length > 2) {
					if (PathMatchEx(Path, ar[0]) || (Path2 && PathMatchEx(Path2, ar[0]))) {
						return Exec(Ctrl, ar[2], ar[1], hwnd, pt);
					}
				}
			}
		}
	},

	Ref: function (s, pt) {
		const last = s.split("\n").pop();
		const ar = last.split(",");
		switch (ar.length) {
			case 2:
				const arFunc = [];
				RunEvent1("AddType", arFunc);
				let r = g_basic.Popup(arFunc, s, pt);
				if (r) {
					return s + r + ",";
				}
				break;
			case 3:
				const Id = GetSourceText(ar[1]);
				r = OptionRef(Id, "", pt);
				if (/^string$/i.test(typeof r)) {
					return s + r + "\n";
				}
				break;
			default:
				r = InputDialog("Filter", last);
				if (r) {
					return s + (s.length && !/\n$/.test(s) ? "\n" : "") + r + ",";
				}
				break;
		}
	}
});

AddEvent("OptionEncode", function (Id, p) {
	if (SameText(Id, "execution filter")) {
		const lines = p.s.split("\n");
		for (let i = lines.length; i--;) {
			const ar = lines[i].split(",");
			if (ar[1]) {
				ar[1] = GetSourceText(ar[1]);
				if (ar[2]) {
					const p2 = { s: ar[2] };
					MainWindow.OptionEncode(ar[1], p2);
					ar[2] = p2.s;
				}
				lines[i] = ar.join(",");
			}
		}
		p.s = lines.join("\n");
	}
});

AddEvent("OptionDecode", function (Id, p) {
	if (SameText(Id.toLowerCase(), "execution filter")) {
		const lines = p.s.split("\n");
		for (let i = lines.length; i--;) {
			const ar = lines[i].split(",");
			if (ar[1]) {
				if (ar[2]) {
					const p2 = { s: ar[2] };
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
