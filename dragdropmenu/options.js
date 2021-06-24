SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.DragDropMenu = {
	ConfigFile: "dragdropmenu" + ui_.bit + ".xml",

	Load: async function () {
		if (!g_x.List) {
			g_x.List = document.E.List;
			g_x.List.length = 0;
			const xml = await OpenXml(Addons.DragDropMenu.ConfigFile, false, false);
			if (xml) {
				const items = await xml.getElementsByTagName("Item");
				let i = await GetLength(items);
				g_x.List.length = i;
				while (--i >= 0) {
					const item = items[i];
					SetData(g_x.List[i], await Promise.all([item.getAttribute("Name"), item.getAttribute("Class"), item.getAttribute("Path"), item.getAttribute("Options"), item.getAttribute("Flags"), item.getAttribute("Filter")]));
				}
			} else {
				const cls = ["Copy", "Move", "Shortcut"];
				let def = [];
				for (let i = 0; i < 3; ++i) {
					def.push(api.LoadString(hShell32, 29697 + i));
				}
				def = await Promise.all(def);
				g_x.List.length = cls.length;
				for (let i = cls.length; --i >= 0;) {
					SetData(g_x.List[i], [def[i], cls[i], "", "", "", ""]);
				}
				g_Chg.List = true;
			}
			EnableSelectTag(g_x.List);
		}
	},

	Save: async function () {
		if (g_Chg.List) {
			const xml = await CreateXml();
			const root = await xml.createElement("TablacusExplorer");
			const o = document.E.List;
			for (let i = 0; i < o.length; i++) {
				const item = xml.createElement("Item");
				const a = o[i].value.split(g_sep);
				await item.setAttribute("Name", a[0]);
				await item.setAttribute("Class", a[1]);
				await item.setAttribute("Path", a[2]);
				await item.setAttribute("Options", a[3]);
				await item.setAttribute("Flags", a[4]);
				await item.setAttribute("Filter", a[5]);
				await root.appendChild(item);
			}
			await xml.appendChild(root);
			await SaveXmlEx(Addons.DragDropMenu.ConfigFile, xml);
		}
	},

	RefClass: async function (o) {
		const ar = [], dir = ["Folder", "Directory", "Drive"];
		let ar1 = [];
		for (let i = 0; i < dir.length; ++i) {
			ar1.push(RegEnumKey(HKEY_CLASSES_ROOT, dir[i] + "\\ShellEx\\DragDropHandlers", window.chrome));
		}
		ar1 = await Promise.all(ar1);
		const hMenu = await api.CreatePopupMenu();
		try {
			const dub = {};
			for (let j = 0; j < ar1.length; ++j) {
				for (let i = ar1[j].length; i-- > 0;) {
					const s = ar1[j][i];
					if (!/^{/.test(s) && !dub[s]) {
						ar.push(s);
						dub[s] = true;
					}
				}
			}
			ar.sort();
			for (let i = ar.length; i-- > 0;) {
				await api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, ar[i]);
			}
			ar.push("");
			const cls = ["Copy", "Move", "Shortcut", "Exec", "Separator", "Exec", "Exec", "Exec"];
			let def = [];
			for (let i = 0; i < 3; ++i) {
				def.push(api.LoadString(hShell32, 29697 + i));
			}
			def.push(GetText("Exec"), GetText("Separator"));
			def = await Promise.all(def);
			def.push("Create symbolic link", "FastCopy (Copy)", "FastCopy (Move)");
			await api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_SEPARATOR, 0, null);
			for (let i = def.length; --i >= 0;) {
				await api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ar.length + i, def[i]);
			}
			const pt = GetPos(o, 9);
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
			if (nVerb) {
				document.E.Path.value = "";
				document.E.Options.value = "";
				document.E.Flags.value = "";
				if (nVerb < ar.length) {
					document.E.Name.value = ar[nVerb - 1];
					let s;
					for (let i = 0; i < dir.length; ++i) {
						try {
							s = await wsh.RegRead("HKCR\\" + dir[i] + "\\ShellEx\\DragDropHandlers\\" + ar[nVerb - 1] + "\\");
							document.E.Options.value = dir[i];
							break;
						} catch (e) { }
					}
					SetValue(document.E.Class, s);
				} else {
					const name = def[nVerb - ar.length];
					document.E.Name.value = name;
					document.E.Class.value = cls[nVerb - ar.length];
					if (/^FastCopy/.test(name)) {
						Addons.DragDropMenu.FastCopy();
						document.E.Options.value = /move/i.test(name) ? '/cmd=move /auto_close /to="%Dest%\"' : '/cmd=diff /auto_close /to="%Dest%\"';
						document.E.Flags.value = 8;
					} else if (/symbolic/i.test(name)) {
						document.E.Path.value = '%ComSpec%';
						document.E.Options.value = '/c mklink %IsFolder:/d% "%Unique%" "%Each%"';
						document.E.Flags.value = 7;
					}
				}
				g_bChanged = true;
				Addons.DragDropMenu.ClearChecked();
				LoadChecked(document.E);
			}
		} finally {
			api.DestroyMenu(hMenu);
		}
	},

	Edit: function () {
		if (g_x.List.selectedIndex < 0) {
			return;
		}
		const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
		document.E.Name.value = a[0];
		document.E.Class.value = a[1];
		document.E.Path.value = a[2];
		document.E.Options.value = a[3];
		document.E.Flags.value = a[4];
		document.E.Filter.value = a[5];
		Addons.DragDropMenu.ClearChecked();
		LoadChecked(document.E);
	},

	Replace: function () {
		ClearX();
		if (g_x.List.selectedIndex < 0) {
			g_x.List.selectedIndex = ++g_x.List.length - 1;
			EnableSelectTag(g_x.List);
		}
		const sel = g_x.List[g_x.List.selectedIndex];
		o = document.E.Type;
		SetData(sel, [document.E.Name.value, document.E.Class.value, document.E.Path.value, document.E.Options.value, document.E.Flags.value, document.E.Filter.value]);
		g_Chg.List = true;
	},

	ClearChecked: function () {
		for (let i = 0; i < document.E.length; ++i) {
			const el = document.E[i];
			if (SameText(el.type, 'checkbox') && el.id != "_EDIT") {
				el.checked = false;
			}
		}
	},

	AddOptions: function (el) {
		const el1 = document.E.Options;
		if (el1.selectionStart != null) {
			el1.value = el1.value.substr(0, el1.selectionStart) + el.value + el1.value.substr(el1.selectionStart);
		} else {
			el1.value += el.value;
		}
		el1.focus();
	},

	FastCopy: async function () {
		const arPath = await Promise.all([wsh.ExpandEnvironmentStrings("%USERPROFILE%"), api.GetDisplayNameOf(ssfPROGRAMFILESx86, SHGDN_FORPARSING), api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), wsh.ExpandEnvironmentStrings("%USERPROFILE%")]);
		let path;
		for (let i = arPath.length; i--;) {
			path = BuildPath(arPath[i], 'FastCopy\\FastCopy.exe');
			if (!i || await fso.FileExists(path)) {
				break;
			}
		}
		document.E.Path.value = path;
	}
}

SaveLocation = async function () {
	if (g_bChanged) {
		Addons.DragDropMenu.Replace();
	}
	if (g_Chg.List) {
		await Addons.DragDropMenu.Save();
	}
};

setTimeout(function () {
	Addons.DragDropMenu.Load();
	if (document.documentMode >= 9) {
		document.getElementById("pane").style.height = "calc(100vh - 8em)";
	}
}, 99);
