if (window.Addon == 1) {
	Addons.TooltipPreview = { MAX: 400, SIZE: api.Memory("SIZE"),

		Draw: function ()
		{
			var q = Addons.TooltipPreview.q;
			Addons.TooltipPreview.Path = q.Item.Path;
			if (api.IsWindowVisible(q.hwnd)) {
				if (q.w > 48 || q.h > 48 || q.image.GetFrameCount() > 1) {
					var hdc = api.GetWindowDC(q.hwnd);
					if (hdc) {
						var hbm = q.image.GetHBITMAP(GetSysColor(COLOR_WINDOW));
						if (hbm) {
							var hmdc = api.CreateCompatibleDC(hdc);
							var hOld = api.SelectObject(hmdc, hbm);
							var rc = api.Memory("RECT");
							api.GetClientRect(q.hwnd, rc);
							var w1 = rc.Right-- - rc.Left++;
							var h1 = rc.Bottom-- - rc.Top++;
							if (w1 < q.w * q.z) {
								q.z = (w1 - 2) / q.w;
								if (Addons.TooltipPreview.SIZE.cx > 1) {
									Addons.TooltipPreview.SIZE.cx--;
								}
							}
							if (h1 < q.h * q.z) {
								q.z = (h1 - 2) / q.h;
								if (Addons.TooltipPreview.SIZE.cy > 1) {
									Addons.TooltipPreview.SIZE.cy--;
								}
							}
							q.x = (w1 - q.w * q.z) / 2;
							q.y = (h1 - q.h * q.z) / 2;
							api.FillRect(hdc, rc, null);
							api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hmdc, 0, 0, q.w, q.h, SRCCOPY);
							api.SelectObject(hmdc, hOld);
							api.DeleteDC(hmdc);
							api.DeleteObject(hbm);
							q.image.Frame = 0;
						}
						api.ReleaseDC(q.hwnd, hdc);
					}
					if (q.image.GetFrameCount() > 1) {
						var i = q.image.GetFrameMetadata("/grctlext/Delay") * 10;
						setTimeout(Addons.TooltipPreview.Animate, i > 10 ? i : 100);
					}
				} else {
					var hIcon = q.image.GetHICON();
					if (hIcon) {
						var s = q.Item.Name.substr(0, 99);
						var p = api.Memory(100);
						p.Write(0, VT_LPWSTR, s);
						api.SendMessage(q.hwnd, WM_USER + 33, hIcon, p);
						api.SendMessage(q.hwnd, WM_USER + 29, 0, 0);
						api.SendMessage(q.hwnd, WM_USER + 33, 0, 0);
						api.DestroyIcon(hIcon);
					}
				}
			}
		},

		Animate: function ()
		{
			var q = Addons.TooltipPreview.q;
			if (api.IsWindowVisible(q.hwnd)) {
				q.image.Frame = (q.image.Frame + 1) % q.image.GetFrameCount();
				var hdc = api.GetWindowDC(q.hwnd);
				if (hdc) {
					var hbm = q.image.GetHBITMAP(-1);
					if (hbm) {
						var hmdc = api.CreateCompatibleDC(hdc);
						var hOld = api.SelectObject(hmdc, hbm);
						var x = q.x + api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left")) * q.z;
						var y = q.y + api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top")) * q.z;
						api.AlphaBlend(hdc, x, y, q.w * q.z, q.h * q.z, hmdc, 0, 0, q.w, q.h, 0x01ff0000);
						api.SelectObject(hmdc, hOld);
						api.DeleteDC(hmdc);
						api.DeleteObject(hbm);
					}
					api.ReleaseDC(q.hwnd, hdc);
					var i = q.image.GetFrameMetadata("/grctlext/Delay") * 10;
					setTimeout(Addons.TooltipPreview.Animate, i > 10 ? i : 100);
				}
			}
		}
	};

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type <= CTRL_EB && Index >= 0) {
			var Item = Ctrl.Items.Item(Index);
			if (Item) {
				var q = { image: api.CreateObject("WICBitmap").FromFile(Item.Path), Item: Item };
				Addons.TooltipPreview.q = q;
				delete Addons.TooltipPreview.Path;
				if (q.image) {
					q.w = q.image.GetWidth();
					q.h = q.image.GetHeight();
					q.z = w > q.h ? Addons.TooltipPreview.MAX / q.w : Addons.TooltipPreview.MAX / q.h;
					if (q.z > 1) {
						q.z = 1;
					}
					setTimeout(function ()
					{
						var hwnd;
						while (q.hwnd = api.FindWindowEx(hwnd, q.hwnd, null, null)) {
							if (api.IsWindowVisible(q.hwnd)) {
								if (api.GetClassName(q.hwnd) == "tooltips_class32") {
									var max = api.SendMessage(q.hwnd, WM_USER + 25, 0, 0);
									if (max < 400) {
										Addons.TooltipPreview.MAX = max;
									}
									Addons.TooltipPreview.Draw();
									break;
								}
							}
						}
					}, 200);
					var s = "";
					if (Addons.TooltipPreview.SIZE.cx == 0) {
						var hdc = api.GetWindowDC(te.hwnd);
						if (hdc) {
							api.GetTextExtentPoint32(hdc, " ", Addons.TooltipPreview.SIZE);
							api.ReleaseDC(te.hwnd, hdc);
						}
					}
					var ar = new Array(Math.floor(q.h * q.z / Addons.TooltipPreview.SIZE.cy));
					var col = ["name", "type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13", "size"];
					for (var i = col.length; i--;) {
						var s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
						if (i != 3 || s) {
							ar[i + 1] = " " + api.PSGetDisplayName(col[i]) + ": " + s;
						} else {
							ar[i + 1] = " " + api.PSGetDisplayName(col[i]) + ": " + q.w + " x " + q.h;
						}
					}
					ar.push(new Array(Math.floor(q.w * q.z / Addons.TooltipPreview.SIZE.cx * 1.5)).join(" "));
					return ar.join(" \n");
				}
			}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		delete Addons.TooltipPreview.Path;
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (Addons.TooltipPreview.Path && msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_SB) {
			var Item = Ctrl.HitTest(pt);
			if (Item && Item.Path == Addons.TooltipPreview.Path) {
				if (!api.IsWindowVisible(Addons.TooltipPreview.q.hwnd)) {
					if (Addons.TooltipPreview.tid) {
						clearTimeout(Addons.TooltipPreview.tid);
					}
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 999);
				}
			}
		}
	});
}
