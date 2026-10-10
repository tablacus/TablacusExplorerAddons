// 例1:
//  c:\Apple\Cherry ->  Apple\Cherry
// c:\Banana\Cherry -> Banana\Cherry
//
// 親フォルダも重複する場合は、さらに親のパスとその階層数を付けて、
// 重複を回避する
//
// 例2:
// c:\Apple\Apple\Apple\Banana\Cherry -> Apple..4\Cherry
//        c:\Apple\Apple\Apple\Cherry -> Apple..2\Cherry
//       c:\Apple\Apple\Banana\Cherry ->   c:..4\Cherry
//             c:\Apple\Banana\Cherry ->   c:..3\Cherry
//                    c:\Apple\Cherry ->   c:..2\Cherry

// 省略記号は `..` を使用する。
// `*` や `|` などパスに使えない文字にした方が衝突の可能性を減らせるが、
// `..` の方が馴染みやすいため。
const PathOmissionMark = "..";

const PathDelimiter = "\\";


AddEvent("GetTabName", function (Ctrl) {
	const name = Ctrl.FolderItem.Name;
	if (!name) {
		return;
	}

	const path = GetPath(Ctrl.FolderItem);
	if (!path) {
		return name;
	}

	// 同名タブのパスをすべて取得する。
	const duplicatedTabPaths = [];
	const TCs = te.Ctrls(CTRL_TC, true);

	for (let j = 0; j < TCs.Count; j++) {
		const TC = TCs.Item(j);
		for (let i = 0; i < TC.Count; i++) {
			const tab = TC.Item(i);
			const tabName = tab.FolderItem.Name;
			if (tabName == name) {
				const tabPath = GetPath(tab.FolderItem);
				if (tabPath) {
					duplicatedTabPaths.push(tabPath);
				}
			}
		}
	}

	// 同名タブがすべて同じパスを指している場合は、
	// 区別する必要がないため、そのままの名前を使用する。
	let hasDifferentPath = false;

	for (let i = 0; i < duplicatedTabPaths.length; i++) {
		if (duplicatedTabPaths[i].toLowerCase() != path.toLowerCase()) {
			hasDifferentPath = true;
			break;
		}
	}

	if (!hasDifferentPath) {
		return name;
	}

	const parts = SplitPath(path);
	if (parts.length < 2) {
		return name;
	}

	// 同じ名前のほかのタブすべてと区別できる、
	// 最短の親パスを探す。
	for (let depth = 1; depth < parts.length; depth++) {
		const parent = parts.slice(-depth - 1, -1).join(PathDelimiter);
		let unique = true;

		for (let i = 0; i < duplicatedTabPaths.length; i++) {
			if (duplicatedTabPaths[i].toLowerCase() == path.toLowerCase()) {
				continue;
			}

			const other = SplitPath(duplicatedTabPaths[i]);
			if (other.length < depth + 1) {
				continue;
			}

			const otherParent = other.slice(-depth - 1, -1).join(PathDelimiter);
			if (otherParent.toLowerCase() == parent.toLowerCase()) {
				unique = false;
				break;
			}
		}

		if (!unique) {
			continue;
		}

		const parentIndex = parts.length - depth - 1;
		let parentName = parts[parentIndex];
		if (parentIndex == 0) {
			// `c:\` to `c:`
			// `\\` to `\`
			parentName = parentName.slice(0, -1);
		}

		if (depth == 1) {
			// 階層数が 1 の場合は親フォルダー名を付けるだけ。
			return parentName + PathDelimiter + name;
		} else {
			// それ以外は省略記号と階層数を付ける。
			return parentName + PathOmissionMark + depth + PathDelimiter + name;
		}
	}

	// 利用可能な親フォルダー名では区別できない場合は、
	// 最も深い階層までの親パスを使用する。
	const parent = parts.slice(0, -1).join(PathDelimiter);
	return parent + PathOmissionMark + PathDelimiter + name;
});

function GetPath(FolderItem) {
	const s = api.GetDisplayNameOf(
		FolderItem,
		SHGDN_FORPARSING | SHGDN_FORPARSINGEX
	);

	if (!s || !isNaN(s) || s.charAt(0) == ":") {
		return null;
	}

	return s;
}

// Input                       Output
// "C:\\Temp"                  ["C:\\", "Temp"]
// "C:\\Temp\\Foo"             ["C:\\", "Temp", "Foo"]
// "\\\\Server\\Share\\Foo"    ["\\\\Server\\Share\\", "Foo"]
// "C:\\"                      ["C:\\"]
// "Temp\\Foo"                 ["Temp", "Foo"]
function SplitPath(path) {
	const root = path.match(/^[A-Za-z]:\\|^\\\\[^\\]+\\[^\\]+\\|^\\/);
	let start = root ? root[0].length : 0;
	const prefix = root ? root[0] : "";

	let rest = path.slice(start);
	if (!rest) {
		return prefix ? [prefix] : [];
	}

	const parts = rest.split(PathDelimiter).filter(function (s) {
		return s.length > 0;
	});

	if (prefix) {
		parts.unshift(prefix);
	}

	return parts;
}
