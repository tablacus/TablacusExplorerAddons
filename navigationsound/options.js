var s = ['<label>Path</label><table class="layout">'];
s.push('<tr><td style="width: 100%"><input type="text" name="Path" style="width: 100%" placeholder="' , ExtractMacro(te, "%SystemRoot%\\Media\\Windows Navigation Start.wav"), '" /></td>');
s.push('<td class="buttons"><input type="button" value="Portable" onclick="PortableX(\'Path\')" /></td>');
s.push('<td><input type="button" value="Browse..." onclick="RefX(\'Path\', false, this, false, \'WAV#*.wav\')" /></td></tr></table>');
s.push('<input type="button" value="Play" onclick="Addons.NavigationSound.Play()">');
SetTabContents(0, "General", s);

Addons.NavigationSound = {
    Play: function ()
    {
        api.PlaySound(api.PathUnquoteSpaces(ExtractMacro(te, document.F.Path.value || "%SystemRoot%\\Media\\Windows Navigation Start.wav")), null, 3);
    }
}
