if (window.Addon == 1) {
	Addons.TooltipPreview = { MAX: 400, SIZE: api.Memory("SIZE") };

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type <= CTRL_EB && Index >= 0) {
			var Item = Ctrl.Items.Item(Index);
			if (Item) {
				var image = te.GdiplusBitmap();
				image.FromFile(Item.Path);
				var x = image.GetWidth();
				if (x) {
					var y = image.GetHeight();
					if (x > y) {
						y = Addons.TooltipPreview.MAX * y / x;
						x = Addons.TooltipPreview.MAX;
					} else {
						x = Addons.TooltipPreview.MAX * x / y;
						y = Addons.TooltipPreview.MAX;
					}
					if (x >= image.GetWidth() || y >= image.GetHeight()) {
						x = image.GetWidth();
						y = image.GetHeight();
					}
					setTimeout(function ()
					{
						var hwnd, hwnd1;
						while (hwnd1 = api.FindWindowEx(hwnd, hwnd1, null, null)) {
							if (api.IsWindowVisible(hwnd1)) {
								if (api.GetClassName(hwnd1) == "tooltips_class32") {
									max = api.SendMessage(hwnd1, WM_USER + 25, 0, 0);
									if (max < 400) {
										Addons.TooltipPreview.MAX = max;
									}
									var thum = (x == image.GetWidth()) ? image : image.GetThumbnailImage(x, y);
									if (thum) {
										if (x > 48 || y > 48) {
											var hdc = api.GetWindowDC(hwnd1);
											if (hdc) {
												var hbm = thum.GetHBITMAP();
												if (hbm) {
													var hmdc = api.CreateCompatibleDC(hdc);
													api.SelectObject(hmdc, hbm);
													var rc = api.Memory("RECT");
													api.GetClientRect(hwnd1, rc);
													var x1 = Math.floor((rc.Right - rc.Left - x) / 2);
													var y1 = Math.floor((rc.Bottom - rc.Top - y) / 2);
													api.BitBlt(hdc, x1, y1, x, y, hmdc, 0, 0, SRCCOPY);
													if (x1 < 0 && Addons.TooltipPreview.SIZE.cx > 1) {
														Addons.TooltipPreview.SIZE.cx--;
													}
													if (y1 < 0 && Addons.TooltipPreview.SIZE.cy > 1) {
														Addons.TooltipPreview.SIZE.cy--;
													}
													api.DeleteDC(hmdc);
													api.DeleteObject(hbm);
												}
												api.ReleaseDC(hwnd1, hdc);
											}
										} else {
											var hIcon = thum.GetHICON();
											if (hIcon) {
												var s = Item.Name.substr(0, 99);
												var p = api.Memory(100);
												p.Write(0, VT_LPWSTR, s);
												api.SendMessage(hwnd1, WM_USER + 33, hIcon, p);
												api.SendMessage(hwnd1, WM_USER + 29, 0, 0);
												api.SendMessage(hwnd1, WM_USER + 33, 0, 0);
												api.DestroyIcon(hIcon);
											}
										}
										break;
									}
								}
							}
						}
					}, 200);
					if (x > 48 || y > 48) {
						var s = "";
						if (Addons.TooltipPreview.SIZE.cx == 0) {
							var hdc = api.GetWindowDC(te.hwnd);
							if (hdc) {
								api.GetTextExtentPoint32(hdc, " ", Addons.TooltipPreview.SIZE);
								api.ReleaseDC(te.hwnd, hdc);
							}
						}
						var ar = new Array(Math.floor(y / Addons.TooltipPreview.SIZE.cy));
						if (x > 96) {
							var col = ["name", "type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13", "size"];
							for (var i = col.length; i--;) {
								var s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
								ar[i + 1] = " " + api.PSGetDisplayName(col[i]) + ": " + s;
							}
						}
						ar.push(new Array(Math.floor(x / Addons.TooltipPreview.SIZE.cx * 1.5)).join(" "));
						return ar.join(" \n");
					}
				}
			}
		}
	});
}
