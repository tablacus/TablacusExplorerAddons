document.addEventListener("contextmenu", function (ev) {
	ev = (ev || event);
	const el = ev.target;
	if (/^INPUT$/i.test(el.tagName) && /^(text|password|search|email|url)$/i.test(el.type) || /^TEXTAREA$/i.test(el.tagName)) {
		PreventDefault(ev);
		let r = [
			GetTextR('@ieframe.dll,-17970[Cu&t\tCtrl+X]'),
			GetTextR('@ieframe.dll,-17971[&Copy\tCtrl+C]'),
			GetTextR('@ieframe.dll,-17972[&Paste\tCtrl+V]'),
			GetText('Delete'),
			0,
			GetTextR('@shell32.dll,-31276[&Select All\tCtrl+A]')
		];
		r.push(api.CreatePopupMenu(), clipboardData.getData("text"));
		Promise.all(r).then(async function (r) {
			const start = el.selectionStart;
			const end = el.selectionEnd;
			const selectedText = el.value.substring(start, end);
			const before = el.value.substring(0, start);
			const after = el.value.substring(end);
			const pasteText = r.pop();
			const enabled = [
				selectedText ? MF_ENABLED : MF_DISABLED,
				selectedText ? MF_ENABLED : MF_DISABLED,
				pasteText ? MF_ENABLED : MF_DISABLED,
				selectedText ? MF_ENABLED : MF_DISABLED,
				0,
				selectedText !== el.value ? MF_ENABLED : MF_DISABLED,
			];
			const hMenu = r.pop();
			for (let i = 0; i < r.length; ++i) {
				if (r[i]) {
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING | enabled[i], i + 1, r[i]);
				} else {
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				}
			}
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, ev.screenX, ev.screenY, ui_.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (nVerb) {
				switch (nVerb) {
					case 1:
						el.value = before + after;
						el.selectionStart = el.selectionEnd = start;
					case 2:
						clipboardData.setData("text", selectedText);
						break;
					case 3:
						el.value = before + pasteText + after;
						const newPos = start + pasteText.length;
						el.selectionStart = el.selectionEnd = newPos;
						break;
					case 4:
						el.value = before + after;
						el.selectionStart = el.selectionEnd = start;
						break;
					case 6:
						el.select();
						break;
				}
			}
		});
	}
}, true);
