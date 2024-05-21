InitDialog = async function () {
    await ApplyLang(document);
    RunEventUI("BrowserCreatedEx");
    const Focused = await dialogArguments.Focused;
    const s = await IsFileHideExt(Focused) && !await dialogArguments.ResultsFolder ? GetFileName(await api.GetDisplayNameOf(Focused, SHGDN_FORPARSING)) : await api.GetDisplayNameOf(Focused, SHGDN_FOREDITING);
    document.getElementById("P").innerText = s;
    if (await IsFolderEx(Focused)) {
        document.F.N.value = s;
        document.F.E.style.display = "none";
    } else {
        document.F.N.value = await fso.GetBaseName(s);
        document.F.E.value = await fso.GetExtensionName(s);
    }
    document.body.style.visibility = "";
    WebBrowser.Focus();
    document.F.N.select();
    document.F.N.focus();
}

AddEventEx(document.body, "keydown", function (ev) {
    if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
        DoRename();
    }
    if (ev.keyCode == VK_ESCAPE || window.chrome && /^Esc/i.test(ev.key)) {
        CloseWindow();
    }
    return true;
});

DoRename = async function () {
    const Focused = await dialogArguments.Focused;
    const s = document.getElementById("P").innerText;
    const r = document.F.E.value ? [document.F.N.value, document.F.E.value].join(".") : document.F.N.value;
    if (r && s != r) {
        if (/[\\\/:\*\?"<>\|]/.test(r)) {
            MessageBox(await api.LoadString(hShell32, 4109), null, MB_ICONSTOP | MB_OK);
            return;
        }
        if (await IsFileHideExt(Focused) && !await dialogArguments.ResultsFolder) {
            if (await api.SHFileOperation(FO_RENAME, await api.GetDisplayNameOf(Focused, SHGDN_FORPARSING), r, FOF_ALLOWUNDO, false)) {
                return;
            }
        } else {
            try {
                Focused.Name = r;
            } catch (e) {
                MessageBox(await (api.LoadString(hShell32, 6020)).replace("%1!ls!", await api.sprintf(99, "0x%x", e.number)).replace("%2!ls!", s), null, MB_ICONSTOP | MB_OK);
                return;
            }
        }
    }
    CloseWindow();
}

IsFileHideExt = async function (Item) {
    return !SameText(await fso.GetExtensionName(await api.GetDisplayNameOf(Item, SHGDN_FOREDITING)), await fso.GetExtensionName(await api.GetDisplayNameOf(Item, SHGDN_FORPARSING))) && await IsExists(await api.GetDisplayNameOf(Item, SHGDN_FORPARSING));
}
