var Addon_Id = "folderimage";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.FolderImage =
	{
		Items: api.LowPart(item.getAttribute("Items")) || 10,
		Expanded: api.LowPart(item.getAttribute("Expanded")),
		Filter: item.getAttribute("Filter") || FILTER_IMAGE,
		Invalid: item.getAttribute("Invalid") || "-",
		Name: GetAddonInfo(Addon_Id).Name,

		Search: function (image, Item, bECM, Progress)
		{
			var nDog = Addons.FolderImage.Items;
			var List = [Item];
			while (List.length && !Progress.HasUserCancelled() && nDog) {
				var Items = List.shift().GetFolder.Items();
				for (var i = 0; i < Items.Count && !Progress.HasUserCancelled() && nDog; i++) {
					Item = Items.Item(i);
					Progress.SetLine(2, Item.Path, true);
					if (Item.IsFolder) {
						if (Addons.FolderImage.Expanded) {
							List.push(Item);
						}
					} else if (PathMatchEx(Item.Path, Addons.FolderImage.Filter) && !PathMatchEx(Item.Path, Addons.FolderImage.Invalid) && image.FromFile(Item.Path, bECM)) {
						return S_OK;
					}
					nDog--;
				}
			}
		}
	}

	AddEvent("FromFile", function (image, file, alt, bECM)
	{
		var hr;
		var Item = api.ILCreateFromPath(file);
		if (Item.IsFolder) {
			var path = Item.Path;
			var Progress = te.ProgressDialog;
			Progress.StartProgressDialog(te.hwnd, null, 0x20);
			try {
				Progress.SetTitle(Addons.FolderImage.Name);
				Progress.SetLine(1, api.LoadString(hShell32, 13585) || api.LoadString(hShell32, 6478), true);
				hr = Addons.FolderImage.Search(image, Item, bECM, Progress);
			} catch (e) {}
			Progress.StopProgressDialog();
		}
		return hr;
	});
} else {
	SetTabContents(0, "General", ['<label>Number of items</label><br><input type="text" name="Items" style="width: 100%" /><br><input type="checkbox" name="Expanded" id="Expanded" /><label for="Expanded">Expanded</label><br><label>Filter</label><br><input type="text" name="Filter" placeholder="', EncodeSC(FILTER_IMAGE), '" style="width: 100%" /><br><label>', api.LoadString(hShell32, 6438), '</label><br><input type="text" name="Invalid" style="width: 100%" />'].join(""));
}
