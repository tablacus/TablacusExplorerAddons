AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (Common.Split) {
		var rc = api.Memory("RECT");
		api.GetClientRect(te.hwnd, rc);
		rc.right -= te.offsetLeft + te.offsetRight;
		rc.bottom -= te.offsetTop + te.offsetBottom;

		api.ScreenToClient(te.hwnd, pt);
		pt.x -= te.offsetLeft;
		pt.y -= te.offsetTop;
		var arSet = [];
		for (var i = Common.Split.length; i--;) {
			var v = Common.Split[i];
			if (v.left) {
				var TC = te.Ctrl(CTRL_TC, v.left);
				var left = TC.Left;
				if ("string" === typeof left) {
					left = Number(String(left).replace(/%$/, "")) * rc.right / 100;
				}
				var width = TC.Width;
				if ("string" === typeof width) {
					width = Number(String(width).replace(/%$/, "")) * rc.right / 100;
				}
				width = Math.round(left + width - pt.x);
				if (width < 4) {
					nCursor = 0;
					break;
				}
				left = pt.x;
				if ("string" === typeof TC.Width) {
					width = (100 * width / rc.right).toFixed(2) + "%";
				}
				if ("string" === typeof TC.Left) {
					left = (100 * left / rc.right).toFixed(2) + "%";
				}
				arSet.push([TC, "Width", width]);
				arSet.push([TC, "Left", left]);
			}
			if (v.width) {
				var TC = te.Ctrl(CTRL_TC, v.width);
				var left = TC.Left;
				if ("string" === typeof left) {
					left = Number(String(left).replace(/%$/, "")) * rc.right / 100;
				}
				var width = Math.round(pt.x - left);
				if (width < 4) {
					arSet.length = 0;
					break;
				}
				if ("string" === typeof TC.Width) {
					width = (100 * width / rc.right).toFixed(2) + "%";
				}
				arSet.push([TC, "Width", width]);
			}
			if (v.top) {
				var TC = te.Ctrl(CTRL_TC, v.top);
				var top = TC.Top;
				if ("string" === typeof top) {
					top = Number(String(top).replace(/%$/, "")) * rc.bottom / 100;
				}
				var height = TC.Height;
				if ("string" === typeof height) {
					height = Number(String(height).replace(/%$/, "")) * rc.bottom / 100;
				}
				height = Math.round(top + height - pt.y);
				if (height < 4) {
					arSet.length = 0;
					break;
				}
				top = pt.y;
				if ("string" === typeof TC.height) {
					height = (100 * height / rc.bottom).toFixed(2) + "%";
				}
				if ("string" === typeof TC.top) {
					top = (100 * top / rc.bottom).toFixed(2) + "%";
				}
				arSet.push([TC, "Height", height]);
				arSet.push([TC, "Top", top]);
			}
			if (v.height) {
				var TC = te.Ctrl(CTRL_TC, v.height);
				var top = TC.Top;
				if ("string" === typeof top) {
					top = Number(String(top).replace(/%$/, "")) * rc.bottom / 100;
				}
				var height = Math.round(pt.y - top);
				if (height < 4) {
					arSet.length = 0;
					break;
				}
				if ("string" === typeof TC.height) {
					height = (100 * height / rc.bottom).toFixed(2) + "%";
				}
				arSet.push([TC, "Height", height]);
			}
		}
		if (arSet.length) {
			for (var i = arSet.length; i--;) {
				arSet[i][0][arSet[i][1]] = arSet[i][2];
			}
		}
		if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
			api.ReleaseCapture();
			Common.Split = void 0;
		}
		return S_OK;
	}
}, true);
