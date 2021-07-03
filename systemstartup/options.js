Addons.SystemStartup = {
	GetExec: async function () {
		const Items = await api.ILCreateFromPath(ssfSTARTUP).GetFolder.Items();
		for (let i = await Items.Count; --i >= 0;) {
			if (SameText(ui_.TEPath, await Items.Item(i).ExtendedProperty("linktarget"))) {
				return await Items.Item(i).Path;
			}
		}
	}
};

SetTabContents(4, "General", await ReadTextFile(BuildPath("addons", Addon_Id, "options.html")));
setTimeout(async function () {
	const path = await Addons.SystemStartup.GetExec();
	if (path) {
		document.getElementById("Exec").checked = true;
		const sc = await wsh.CreateShortcut(path);
		SetElementValue(document.getElementById("WindowStyle"), await sc.WindowStyle);
	}
}, 99);

SaveLocation = async function () {
	if (g_bChanged) {
		let path = await Addons.SystemStartup.GetExec();
		if (document.getElementById("Exec").checked) {
			const ws = GetElementValue(document.getElementById("WindowStyle"));
			if (path) {
				const sc = await wsh.CreateShortcut(path);
				if ((await sc.WindowStyle) != ws) {
					sc.WindowStyle = ws;
					await sc.Save();
				}
			} else {
				const path0 = BuildPath(await api.ILCreateFromPath(ssfSTARTUP).Path, GetFileName(ui_.TEPath));
				path = path0 + ".lnk";
				let n = 0;
				while (await fso.FileExists(path)) {
					path = path0 + " (" + (++n) + ").lnk";
				}
				const sc = await wsh.CreateShortcut(path);
				sc.TargetPath = ui_.TEPath;
				sc.WindowStyle = ws;
				await sc.Save();
			}
		} else if (path) {
			await fso.DeleteFile(path);
			await api.Sleep(999);
		}
	}
}
