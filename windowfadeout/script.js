const Addon_Id = "windowfadeout";
const item = GetAddonElement(Addon_Id);
const alpha = parseInt(item.getAttribute("alpha")) || 230;
const fadeOutTime = parseInt(item.getAttribute("fadeOutTime")) || 5;
const fadeInStep = parseInt(item.getAttribute("fadeInStep")) || 2;
const fadeOutStep = parseInt(item.getAttribute("fadeOutStep")) || -1;
const fadeInDelay = parseInt(item.getAttribute("fadeInDelay")) || 1;
const fadeOutDelay = parseInt(item.getAttribute("fadeOutDelay")) || 1;

if (window.Addon == 1) {
	let currentAlpha = alpha;
	let currentAnimation = null;

	async function fade(targetAlpha) {
		if (currentAnimation) {
			currentAnimation.cancel = true;
		}

		const newAnimation = { cancel: false };
		currentAnimation = newAnimation;

		const step = targetAlpha > currentAlpha ? fadeInStep : fadeOutStep;
		const delay = targetAlpha > currentAlpha ? fadeInDelay : fadeOutDelay;

		while (currentAlpha !== targetAlpha) {
			if (newAnimation.cancel) {
				break;
			}

			currentAlpha += step;
			if ((step > 0 && currentAlpha > targetAlpha) || (step < 0 && currentAlpha < targetAlpha)) {
				currentAlpha = targetAlpha;
			}

			SetWindowAlpha(ui_.hwnd, currentAlpha);
			await new Promise(resolve => setTimeout(resolve, delay));
		}

		if (newAnimation === currentAnimation) {
			currentAnimation = null;
		}
	}

	let fadeOutTimer = null;

	function mouseMove() {
		fade(alpha);

		if (fadeOutTimer) {
			clearTimeout(fadeOutTimer);
		}

		fadeOutTimer = setTimeout( function() {
			fade(1);
		}, fadeOutTime * 1000);
	};

	function throttle(fn, limit) {
		let lastCall = 0;
		return function(...args) {
			const now = (new Date).getTime();
			if (now - lastCall >= limit) {
				lastCall = now;
				return fn(...args);
			}
		};
	}

	const throttledHandle = throttle(mouseMove, 500);

	AddEvent("Arrange", function (Ctrl, rc) {
		SetWindowAlpha(ui_.hwnd, alpha);
		ui_.Show = 2;
		fadeOutTimer = setTimeout( function() {
			fade(1);
		}, fadeOutTime * 1000);
	});

	window.addEventListener("mousemove", function() {
		throttledHandle();
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
		throttledHandle();
	});

} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	document.getElementById('AlphaValue').textContent = alpha;
	document.querySelector("input[name='alpha']").value = alpha;
	document.getElementById('FadeOutTimeValue').textContent = fadeOutTime;
	document.querySelector("input[name=fadeOutTime]").value = fadeOutTime;
	document.getElementById('FadeInStepValue').textContent = fadeInStep;
	document.querySelector("input[name=fadeInStep]").value = fadeInStep;
	document.getElementById('FadeOutStepValue').textContent = fadeOutStep;
	document.querySelector("input[name=fadeOutStep]").value = fadeOutStep;
	document.getElementById('FadeInDelayValue').textContent = fadeInDelay;
	document.querySelector("input[name=fadeInDelay]").value = fadeInDelay;
	document.getElementById('FadeOutDelayValue').textContent = fadeOutDelay;
	document.querySelector("input[name=fadeOutDelay]").value = fadeOutDelay;
}