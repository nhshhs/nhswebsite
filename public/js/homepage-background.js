(function () {
	// Use hoursRequirements — client updates to this doc already work for execs.
	// Creating a new info/homepage doc is blocked by Firestore rules.
	var HOMEPAGE_DOC = firebase.firestore().collection('info').doc('hoursRequirements');
	var MAX_DATA_URL_BYTES = 900 * 1024;

	function applyBackground(url) {
		var el = document.getElementById('homepage');
		if (!el || !url) return;
		el.style.backgroundImage = "url('" + url + "')";
	}

	function loadBackground() {
		HOMEPAGE_DOC.get().then(function (doc) {
			if (doc.exists && doc.data().backgroundUrl) {
				applyBackground(doc.data().backgroundUrl);
			}
		}).catch(function (err) {
			console.warn('Could not load homepage background:', err);
		});
	}

	function showExecButton() {
		var btn = document.getElementById('bg-change-btn');
		if (btn) btn.classList.remove('hide');
	}

	function hideExecButton() {
		var btn = document.getElementById('bg-change-btn');
		if (btn) btn.classList.add('hide');
	}

	function setUploading(isUploading) {
		var btn = document.getElementById('bg-change-btn');
		if (!btn) return;
		btn.disabled = isUploading;
		btn.classList.toggle('is-uploading', isUploading);
		var icon = btn.querySelector('.material-icons');
		if (icon) icon.textContent = isUploading ? 'hourglass_empty' : 'image';
	}

	function loadImage(file) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			var objectUrl = URL.createObjectURL(file);
			img.onload = function () {
				URL.revokeObjectURL(objectUrl);
				resolve(img);
			};
			img.onerror = function () {
				URL.revokeObjectURL(objectUrl);
				reject(new Error('Could not read image'));
			};
			img.src = objectUrl;
		});
	}

	function canvasToDataUrl(img, maxWidth, quality) {
		var scale = Math.min(1, maxWidth / img.width);
		var canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(img.width * scale));
		canvas.height = Math.max(1, Math.round(img.height * scale));
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', quality);
	}

	function compressToDataUrl(file) {
		return loadImage(file).then(function (img) {
			var attempts = [
				{ maxWidth: 1600, quality: 0.75 },
				{ maxWidth: 1280, quality: 0.65 },
				{ maxWidth: 1024, quality: 0.55 },
				{ maxWidth: 800, quality: 0.45 }
			];
			var dataUrl = null;
			for (var i = 0; i < attempts.length; i++) {
				dataUrl = canvasToDataUrl(img, attempts[i].maxWidth, attempts[i].quality);
				if (dataUrl.length <= MAX_DATA_URL_BYTES) {
					return dataUrl;
				}
			}
			throw new Error('Image is too large even after compression. Try a smaller photo.');
		});
	}

	function uploadBackground(file) {
		if (!file || !file.type.match(/^image\//)) {
			M.toast({ html: 'Please choose an image file.' });
			return;
		}

		setUploading(true);
		compressToDataUrl(file).then(function (dataUrl) {
			// update() works on this existing doc; set()/create of new docs is denied
			return HOMEPAGE_DOC.update({
				backgroundUrl: dataUrl,
				backgroundUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
				backgroundUpdatedBy: firebase.auth().currentUser.uid
			}).then(function () {
				return dataUrl;
			});
		}).then(function (dataUrl) {
			applyBackground(dataUrl);
			M.toast({ html: 'Background updated!' });
			setUploading(false);
		}).catch(function (err) {
			console.error('Background upload failed:', err);
			M.toast({ html: 'Upload failed: ' + (err.message || err) });
			setUploading(false);
		});
	}

	function initExecControls(user) {
		if (!user) {
			hideExecButton();
			return;
		}
		firebase.firestore().collection('info').doc('admins').get().then(function (doc) {
			if (doc.exists && doc.data().execs && doc.data().execs.includes(user.uid)) {
				showExecButton();
			} else {
				hideExecButton();
			}
		}).catch(function (err) {
			console.warn('Could not check exec status:', err);
		});
	}

	function init() {
		loadBackground();

		var btn = document.getElementById('bg-change-btn');
		var input = document.getElementById('bg-change-input');
		if (btn && input) {
			btn.addEventListener('click', function () {
				if (!btn.disabled) input.click();
			});
			input.addEventListener('change', function () {
				var file = input.files && input.files[0];
				input.value = '';
				if (file) uploadBackground(file);
			});
		}

		firebase.auth().onAuthStateChanged(function (user) {
			initExecControls(user);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
