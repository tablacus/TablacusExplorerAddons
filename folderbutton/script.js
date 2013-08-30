var Addon_Id = "folderbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	g_folderbutton =
	{
		ChangeView: window.ChangeView,
		bDrag: false,

		Open: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				pt = GetPos(o, true);
				var FolderItem = FolderMenu.Open(FV.FolderItem, pt.x, pt.y + o.offsetHeight);
				if (FolderItem) {
					switch (window.g_menu_button - 0) {
						case 2:
							PopupContextMenu(FolderItem);
							break;
						case 3:
							Navigate(FolderItem, SBSP_NEWBROWSER);
							break;
						default:
							Navigate(FolderItem, OpenMode);
							break;
					}
				}
			}
			return false;
		},

		Popup: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				FV.Refresh();
			}
			return false;
		},

		Button: function (b)
		{
			this.bDrag = b;
		},

		Drag: function ()
		{
			if (this.bDrag) {
				this.bDrag = false;
				var TC = te.Ctrl(CTRL_TC);
				if (TC && TC.SelectedIndex >= 0) {
					var pdwEffect = api.Memory("DWORD");
					pdwEffect.Item(0) = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
					te.Data.DragTab = TC;
					te.Data.DragIndex = TC.SelectedIndex;
					api.DoDragDrop(TC.Item(TC.SelectedIndex).FolderItem, pdwEffect.Item(0), pdwEffect);
					te.Data.DragTab = null;
				}
			}
		}
	};

	s = ['<span class="button"'];
	s.push(' onclick="return g_folderbutton.Open(this)"');
	s.push(' onmousedown="g_folderbutton.Button(true)" onmouseup="g_folderbutton.Button(false)"');
	s.push(' oncontextmenu="return g_folderbutton.Popup(this)"');
	s.push(' onmouseover="MouseOver(this)" onmouseout="MouseOut(); g_folderbutton.Drag()">');
	s.push('<img alt="Folder" id="FolderButton" src="../image/toolbar/s_3_4.png" icon="shell32.dll,4,16">');
	s.push('</span><span style="width: 1px"> </span>');
	SetAddon(Addon_Id, Default, s.join(""));

	if (document.documentMode) {
		window.ChangeView = function (Ctrl)
		{
			var info = api.Memory("SHFILEINFO");
			api.ShGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_OPENICON | SHGFI_PIDL);
			var image = te.GdiplusBitmap;
			image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
			api.DestroyIcon(info.hIcon);
			document.getElementById("FolderButton").src = "data:image/png;base64," + image.Base64("image/png");
			return g_folderbutton.ChangeView ? g_folderbutton.ChangeView(Ctrl) : S_OK;
		}
	}
}

