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
	document.getElementById("Exec").checked = !!await Addons.SystemStartup.GetExec();
}, 99);

SaveLocation = async function () {
	if (g_bChanged) {
		let path = await Addons.SystemStartup.GetExec();
		if (document.getElementById("Exec").checked == !path) {
			if (path) {
				await fso.DeleteFile(path);
				await api.Sleep(999);
			} else {
				path = BuildPath(await api.ILCreateFromPath(ssfSTARTUP).Path, GetFileName(ui_.TEPath));
				let path1 = path + ".lnk";
				let n = 0;
				while (await fso.FileExists(path1)) {
					path1 = path + " (" + (++n) + ").lnk";
				}
				const sc = await wsh.CreateShortcut(path1);
				sc.TargetPath = ui_.TEPath;
				await sc.Save();
			}
		}
	}
}
