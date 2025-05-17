const Addon_Id = "linkbar";
Common.LinkBar = api.CreateObject("Object");
Common.LinkBar.Items = api.CreateObject("Array");

let item = await GetAddonElement(Addon_Id);
Sync.LinkBar = {
	DropTo: !item.getAttribute("NoDropTo"),

	FromPt: function (ptc) {
		if (Sync.LinkBar.DropTo) {
			for (let i = Common.LinkBar.Count; --i >= 0;) {
				if (PtInRect(Common.LinkBar.Items[i], ptc)) {
					return i;
				}
			}
		}
		return -1;
	},

	Append: function (dataObj) {
		const xml = te.Data.xmlLinkBar;
		let root = xml.documentElement;
		if (!root) {
			xml.appendChild(xml.createProcessingInstruction("xml", 'version="1.0" encoding="UTF-8"'));
			root = xml.createElement("TablacusExplorer");
			xml.appendChild(root);
		}
		if (root) {
			for (let i = 0; i < dataObj.Count; i++) {
				const FolderItem = dataObj.Item(i);
				const item = xml.createElement("Item");
				item.setAttribute("Name", api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER));
				item.text = api.GetDisplayNameOf(FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
				if (fso.FileExists(item.text)) {
					item.text = PathQuoteSpaces(item.text);
					item.setAttribute("Type", "Exec");
				} else {
					item.setAttribute("Type", "Open");
				}
				root.appendChild(item);
			}
			SaveXmlEx("linkbar.xml", xml);
			InvokeUI("Addons.LinkBar.Changed");
		}
	}
}
delete item;

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		InvokeUI("Addons.LinkBar.SetRects");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const items = te.Data.xmlLinkBar.getElementsByTagName("Item");
		const i = Sync.LinkBar.FromPt(ptc);
		if (i >= 0) {
			const hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
			if (hr == S_OK && pdwEffect[0]) {
				MouseOver("_linkbar" + i);
			}
			return S_OK;
		} else if (dataObj.Count && PtInRect(Common.LinkBar.Append, ptc)) {
			MouseOver("_linkbar+");
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
	MouseOut("_linkbar");
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	MouseOut();
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const items = te.Data.xmlLinkBar.getElementsByTagName("Item");
		const i = Sync.LinkBar.FromPt(ptc);
		if (i >= 0) {
			return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
		} else if (dataObj.Count && PtInRect(Common.LinkBar.Append, ptc)) {
			Sync.LinkBar.Append(dataObj);
			return S_OK;
		}
	}
});

AddEvent("DragLeave", function (Ctrl) {
	MouseOut();
	return S_OK;
});
