(function () {
	// Fixed doc in an existing writable subcollection (won't appear in blog order)
	var LANDING_REF = firebase.firestore()
		.collection('project').doc('blog')
		.collection('approved').doc('__landing');

	var MAX_DATA_URL_BYTES = 700 * 1024;
	var currentHeroUrl = null;
	var descriptionQuill = null;

	function $(id) {
		return document.getElementById(id);
	}

	function isEmptyHtml(html) {
		if (!html) return true;
		var tmp = document.createElement('div');
		tmp.innerHTML = html;
		return !(tmp.textContent || '').trim();
	}

	function setQuillHtml(html) {
		if (!descriptionQuill) return;
		var content = html || '';
		// Plain-text legacy values become a simple paragraph
		if (content && content.indexOf('<') === -1) {
			content = '<p>' + content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
		}
		descriptionQuill.root.innerHTML = isEmptyHtml(content) ? '<p><br></p>' : content;
	}

	function applyLanding(data) {
		if (!data) return;

		if (data.heroUrl) {
			currentHeroUrl = data.heroUrl;
			var img = document.querySelector('.parallax-container .parallax img');
			if (img) {
				img.src = data.heroUrl;
				if (window.jQuery) {
					var $parallax = window.jQuery('.parallax');
					if ($parallax.length && $parallax.parallax) {
						$parallax.parallax();
					}
				}
			}
		}

		if (typeof data.title === 'string' && data.title.trim()) {
			var titleEl = $('project-landing-title');
			if (titleEl) titleEl.textContent = data.title.trim();
		}

		if (typeof data.description === 'string' && !isEmptyHtml(data.description)) {
			var descEl = $('project-landing-description');
			if (descEl) {
				if (data.description.indexOf('<') === -1) {
					descEl.textContent = data.description.trim();
				} else {
					descEl.innerHTML = data.description;
				}
			}
		}
	}

	function loadLanding() {
		LANDING_REF.get().then(function (doc) {
			if (doc.exists) applyLanding(doc.data());
		}).catch(function (err) {
			console.warn('Could not load project landing:', err);
		});
	}

	function showControls() {
		var bar = $('project-customize-bar');
		if (bar) bar.classList.remove('hide');
	}

	function hideControls() {
		var bar = $('project-customize-bar');
		if (bar) bar.classList.add('hide');
	}

	function setSaving(isSaving) {
		var saveBtn = $('project-customize-save');
		var imageBtn = $('project-hero-change-btn');
		if (saveBtn) {
			saveBtn.disabled = isSaving;
			saveBtn.textContent = isSaving ? 'Saving…' : 'Save changes';
		}
		if (imageBtn) imageBtn.disabled = isSaving;
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
				{ maxWidth: 1600, quality: 0.72 },
				{ maxWidth: 1280, quality: 0.6 },
				{ maxWidth: 1024, quality: 0.5 },
				{ maxWidth: 800, quality: 0.4 }
			];
			var dataUrl = null;
			for (var i = 0; i < attempts.length; i++) {
				dataUrl = canvasToDataUrl(img, attempts[i].maxWidth, attempts[i].quality);
				if (dataUrl.length <= MAX_DATA_URL_BYTES) return dataUrl;
			}
			throw new Error('Image is too large even after compression. Try a smaller photo.');
		});
	}

	function initQuill() {
		if (descriptionQuill || typeof Quill === 'undefined') return;
		descriptionQuill = new Quill('#project-description-editor', {
			theme: 'snow',
			modules: {
				toolbar: [
					[{ 'header': [1, 2, 3, false] }],
					['bold', 'italic', 'underline', 'strike'],
					[{ 'color': [] }, { 'background': [] }],
					[{ 'list': 'ordered' }, { 'list': 'bullet' }],
					['link'],
					['clean']
				]
			}
		});
	}

	function openModal() {
		var titleEl = $('project-landing-title');
		var descEl = $('project-landing-description');
		var titleInput = $('project-customize-title');
		if (titleInput && titleEl) titleInput.value = titleEl.textContent.trim();
		if (descEl) setQuillHtml(descEl.innerHTML);

		var modalEl = $('project-customize-modal');
		if (modalEl && window.M && M.Modal) {
			var instance = M.Modal.getInstance(modalEl) || M.Modal.init(modalEl);
			instance.open();
			if (M.updateTextFields) M.updateTextFields();
		}
	}

	function saveLanding() {
		var titleInput = $('project-customize-title');
		var title = titleInput ? titleInput.value.trim() : '';
		var description = descriptionQuill ? descriptionQuill.root.innerHTML : '';

		if (!title) {
			M.toast({ html: 'Please enter a title.' });
			return;
		}
		if (isEmptyHtml(description)) {
			M.toast({ html: 'Please enter a description.' });
			return;
		}

		var payload = {
			title: title,
			description: description,
			updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
			updatedBy: firebase.auth().currentUser.uid
		};
		if (currentHeroUrl) payload.heroUrl = currentHeroUrl;

		setSaving(true);
		LANDING_REF.set(payload, { merge: true }).then(function () {
			applyLanding(payload);
			M.toast({ html: 'Project page updated!' });
			setSaving(false);
			var modalEl = $('project-customize-modal');
			var instance = modalEl && M.Modal.getInstance(modalEl);
			if (instance) instance.close();
		}).catch(function (err) {
			console.error('Project landing save failed:', err);
			M.toast({ html: 'Save failed: ' + (err.message || err) });
			setSaving(false);
		});
	}

	function onHeroSelected(file) {
		if (!file || !file.type.match(/^image\//)) {
			M.toast({ html: 'Please choose an image file.' });
			return;
		}

		setSaving(true);
		compressToDataUrl(file).then(function (dataUrl) {
			currentHeroUrl = dataUrl;
			applyLanding({ heroUrl: dataUrl });
			return LANDING_REF.set({
				heroUrl: dataUrl,
				updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
				updatedBy: firebase.auth().currentUser.uid
			}, { merge: true });
		}).then(function () {
			M.toast({ html: 'Hero image updated!' });
			setSaving(false);
		}).catch(function (err) {
			console.error('Hero upload failed:', err);
			M.toast({ html: 'Upload failed: ' + (err.message || err) });
			setSaving(false);
		});
	}

	function canCustomize(adminDoc, uid) {
		if (!adminDoc || !adminDoc.exists) return false;
		var data = adminDoc.data() || {};
		var execs = data.execs || [];
		var project = data.project || [];
		return execs.indexOf(uid) !== -1 || project.indexOf(uid) !== -1;
	}

	function initControls(user) {
		if (!user) {
			hideControls();
			return;
		}
		firebase.firestore().collection('info').doc('admins').get().then(function (doc) {
			if (canCustomize(doc, user.uid)) showControls();
			else hideControls();
		}).catch(function (err) {
			console.warn('Could not check project admin status:', err);
		});
	}

	function init() {
		loadLanding();
		initQuill();

		var modalEl = $('project-customize-modal');
		if (modalEl && window.M && M.Modal) {
			M.Modal.init(modalEl);
		}

		var editBtn = $('project-customize-btn');
		var heroBtn = $('project-hero-change-btn');
		var heroInput = $('project-hero-change-input');
		var saveBtn = $('project-customize-save');

		if (editBtn) editBtn.addEventListener('click', openModal);
		if (saveBtn) saveBtn.addEventListener('click', saveLanding);

		if (heroBtn && heroInput) {
			heroBtn.addEventListener('click', function () {
				if (!heroBtn.disabled) heroInput.click();
			});
			heroInput.addEventListener('change', function () {
				var file = heroInput.files && heroInput.files[0];
				heroInput.value = '';
				if (file) onHeroSelected(file);
			});
		}

		firebase.auth().onAuthStateChanged(function (user) {
			initControls(user);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
