var Addon_Id = "statusbar";
var Default = "BottomBar3Left";

if (!window.dialogArguments) {
	g_statusbar =
	{
		StatusText: external.OnStatusText
	};
	SetAddon(Addon_Id, Default, '<span id="statusbar">&nbsp;</span>');

	external.OnStatusText = function (Ctrl, Text, iPart)
	{
		var s = Text;
		if (Ctrl.Type == CTRL_SB && s.match(/^\d/)) {
			var Items = Ctrl.SelectedItems();
			if (Items.Count == 1) {
				var Item = Items.Item(0);
				try {
					var Folder = Ctrl.Folder;
					s = Folder.GetDetailsOf(null, 3) + ": " + Folder.GetDetailsOf(Item, 3);
					var Size = Item.Size;
					if (Size || !Item.IsFolder) {
						Size += "";
						while (Size != (Size = Size.replace(/^(-?\d+)(\d{3})/, "$1,$2")));				
						s += "&nbsp;" + Folder.GetDetailsOf(null, 1) + ": " + Folder.GetDetailsOf(Item, 1) + "&nbsp;(" + Size + ')';
					}
				} catch(e) {
					s = '';
				}
			}
		}
		document.getElementById("statusbar").innerHTML = "&nbsp" + s;
		if (g_statusbar.StatusText) {
			return g_statusbar.StatusText(Ctrl, Text, iPart);
		}
		return S_OK;
	}
}
