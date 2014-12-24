<a name="FileAPI"></a>
## FileAPI
Набор JavaScript инструментов для работы с файлами.

<a name="started"></a>
### Get started

```html
	<div>
		<!-- "js-fileapi-wrapper" -- обязательный class -->
		<div class="js-fileapi-wrapper upload-btn" id="choose">
			<div class="upload-btn__txt">Choose files</div>
			<input name="files" type="file" multiple />
		</div>
		<div id="images"><!-- предпросмотр --></div>
	</div>

	<script>window.FileAPI = { staticPath: '/js/FileAPI/dist/' };</script>
	<script src="/js/FileAPI/dist/FileAPI.min.js"></script>
	<script>
		FileAPI.event.on(choose, 'change', function (evt){
			var files = FileAPI.getFiles(evt); // Retrieve file list

			FileAPI.filterFiles(files, function (file, info/**Object*/){
				if( /^image/.test(file.type) ){
					return	info.width >= 320 && info.height >= 240;
				}
				return	false;
			}, function (files/**Array*/, rejected/**Array*/){
				if( files.length ){
					// Создаем предпросмотр 100x100
					FileAPI.each(files, function (file){
						FileAPI.Image(file).preview(100).get(function (err, img){
							images.appendChild(img);
						});
					});

					// Загружаем файлы
					FileAPI.upload({
						url: './ctrl.php',
						files: { images: files },
						progress: function (evt){ /* ... */ },
						complete: function (err, xhr){ /* ... */ }
					});
				}
			});
		});
	</script>
```

---

<a name="FileAPI.setup"></a>
### Setup options
Отредактируйте файл `crossdomain.xml` и разместите его в корне домена, на который будут загружаться файлы.

```html
	<script>
		window.FileAPI = {
			  debug: false  // дебаг режим, смотрите Console
			, cors: false   // если используете CORS -- `true`
			, media: false  // если используете веб-камеру -- `true`
			, staticPath: '/js/FileAPI/dist/' // путь к '*.swf'
			, postNameConcat: function (name, idx){
				// Default: object[foo]=1&object[bar][baz]=2
				// .NET: https://github.com/mailru/FileAPI/issues/121#issuecomment-24590395
				return	name + (idx != null ? '['+ idx +']' : '');
			}
		};
	</script>
	<script src="/js/FileAPI/dist/FileAPI.min.js"></script>

	<!-- ИЛИ -->

	<script>
		window.FileAPI = { /* etc. */ };
		require(['FileAPI'], function (FileAPI){
			// ...
		});
	</script>
```

---


<a name="FileAPI.getFiles"></a>
### getFiles(input`:HTMLInputElement|Event|$.Event`)`:Array`
Получить список файлов из `input` элемента, или `event`, также поддерживается `jQuery`.

* input — `HTMLInputElement`, `change` и `drop` события, `jQuery` коллекция или `jQuery.Event`

```js
var el = document.getElement('my-input');
FileAPI.event.on(el, function (evt/**Event*/){
	// Получить список файлов из `input`
	var files = FileAPI.getFiles(el);

	// или события
	var files = FileAPI.getFiles(evt);
});
```

---

<a name="FileAPI.getInfo"></a>
### getInfo(file`:Object`, callback`:Function`)`:void`
Получить информацию о файле (см. FileAPI.addInfoReader).

* file — объект файла (https://developer.mozilla.org/en-US/docs/DOM/File)
* callback — функция, вызывается по завершению сбора информации

```js
// Получить информацию о изображении (FileAPI.exif.js подключен)
FileAPI.getInfo(file, function (err/**String*/, info/**Object*/){
	if( !err ){
		console.log(info); // { width: 800, height: 600, exif: {..} }
	}
});

// Получить информацию о mp3 файле (FileAPI.id3.js included)
FileAPI.getInfo(file, function (err/**String*/, info/**Object*/){
	if( !err ){
		console.log(info); // { title: "...", album: "...", artists: "...", ... }
	}
});
```

---

<a name="FileAPI.filterFiles"></a>
### filterFiles(files`:Array`, filter`:Function`, callback`:Function`)`:void`
Отфильтровать список файлов, используя дополнительную информацию о них.
см. FileAPI.getInfo или FileAPI.addInfoReader.

* files — оригинальный список файлов
* filter — функция, принимает два аргумента: `file` — сам файл, `info` — дополнительная информация
* callback — функция: `list` — список файлов, подошедшие под условия, `other` — все остальные.

```js
// Получаем список файлов
var files = FileAPI.getFiles(input);

// Фильтруем список
FileAPI.filterFiles(files, function (file/**Object*/, info/**Object*/){
	if( /^image/.test(file.type) && info ){
		return	info.width > 320 && info.height > 240;
	} else {
		return	file.size < 20 * FileAPI.MB;
	}
}, function (list/**Array*/, other/**Array*/){
	if( list.length ){
		// ..
	}
});
```

---

<a name="FileAPI.getDropFiles"></a>
### getDropFiles(evt`:Event|$.Event`, callback`:Function`)`:void`
Получить весь список файлов, включая директории.

* evt — `drop` event
* callback — функция, принимает один аргумент — список файлов

```js
FileAPI.event.on(document, 'drop', function (evt/**Event*/){
	evt.preventDefault();

	// Получаем все файлы
	FileAPI.getDropFiles(evt, function (files/**Array*/){
		// ...
	});
});
```

---

<a name="FileAPI.upload"></a>
### upload(opts`:Object`)`:XmlHttpRequest`
Загрузка файлов на сервер (последовательно). Возвращает XHR-подобный объект.
Помните, для корректной работы flash-транспорта, тело ответа сервера не должно быть пустым,
например можно ответить простым текстом "ok".

* opts — объект настроек, см. раздел [Upload options](#options)

```js
var el = document.getElementById('my-input');
FileAPI.event.on(el, 'change', function (evt/**Event*/){
	var files = FileAPI.getFiles(evt);
	var xhr = FileAPI.upload({
		url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
		files: { file: files[0] },
		complete: function (err, xhr){
			if( !err ){
				var result = xhr.responseText;
				// ...
			}
		}
	});
});
```

---

<a name="FileAPI.addInfoReader"></a>
### addInfoReader(mime`:RegExp`, handler`:Function`)`:void`
Добавить обработчик, для сбора информации о файле.
см. также: FileAPI.getInfo и FileAPI.filterFiles.

* mime — маска mime-type
* handler — функция, принимает два аргумента: `file` объект и `complete` функция обратного вызова

```js
FileAPI.addInfoReader(/^image/, function (file/**File*/, callback/**Function*/){
	// http://www.nihilogic.dk/labs/exif/exif.js
	// http://www.nihilogic.dk/labs/binaryajax/binaryajax.js
	FileAPI.readAsBinaryString(file, function (evt/**Object*/){
		if( evt.type == 'load' ){
			var binaryString = evt.result;
			var oFile = new BinaryFile(binaryString, 0, file.size);
			var exif  = EXIF.readFromBinaryFile(oFile);
			callback(false, { 'exif': exif || {} });
		}
		else if( evt.type == 'error' ){
			callback('read_as_binary_string');
		}
		else if( evt.type == 'progress' ){
			// ...
		}
	});
});
```

---

<a name="FileAPI.readAsDataURL"></a>
### readAsDataURL(file`:Object`, callback`:Function`)`:void`
Чтение содержимого указанного файла как dataURL.

* file — файл для чтения
* callback — функция обработчик

```js
FileAPI.readAsDataURL(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Всё хорошо
	 	var dataURL = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Ошибка
	}
})
```

---

<a name="FileAPI.readAsBinaryString"></a>
### readAsBinaryString(file`:Object`, callback`:Function`)`:void`
Чтение содержимого указанного файла как `BinaryString`.

* file — файл для чтения
* callback — функция обработчик

```js
FileAPI.readAsBinaryString(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Всё хорошо
	 	var binaryString = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Ошибка
	}
})
```

---

<a name="FileAPI.readAsArrayBuffer"></a>
### readAsArrayBuffer(file`:Object`, callback`:Function`)`:void`
Чтение содержимого указанного файла как `ArrayBuffer`.

* file — файл для чтения
* callback — функция обработчик

```js
FileAPI.readAsArrayBuffer(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Всё хорошо
	 	var arrayBuffer = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Ошибка
	}
})
```

---

<a name="FileAPI.readAsText"></a>
### readAsText(file`:Object`, callback`:Function`)`:void`
Чтение содержимого указанного файла как `text`.

* file — файл для чтения
* callback — функция обработчик

```js
FileAPI.readAsText(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Всё хорошо
	 	var text = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Ошибка
	}
})
```

---

<a name="FileAPI.readAsText-encoding"></a>
### readAsText(file`:Object`, encoding`:String`, callback`:Function`)`:void`
Чтение содержимого указанного файла как `text` в нужной кодировке.

* encoding — строкой с указанием кодировки. По умолчанию UTF-8.

```js
FileAPI.readAsText(file, "utf-8", function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Всё хорошо
	 	var text = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Ошибка
	}
})
```

---


<a name="options" data-name="Upload options"></a>
## Опции загрузки

<a name="options.url"></a>
### url`:String`
Строка, содержащая адрес, на который отправляется запрос.

---

<a name="options.data"></a>
### data`:Object`
Дополнительные данные, которые должны быть отправлены вместе с файлом.

```js
var xhr = FileAPI.upload({
	url: '...',
	data: { 'session-id': 123 },
	files: { ... },
});
```

---

<a name="options.headers"></a>
### headers`:Object`
Дополнительные заголовки запроса, только HTML5.

```js
var xhr = FileAPI.upload({
	url: '...',
	headers: { 'x-upload': 'fileapi' },
	files: { .. },
});
```

---

<a name="options.chunkSize"></a>
### chunkSize`:Number`
Размер части файла в байтах, только HTML5.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { images: fileList },
	chunkSize: 0.5 * FileAPI.MB
});
```

---

<a name="options.chunkUploadRetry"></a>
### chunkUploadRetry`:Number`
Количество попыток загрузки одной части, только HTML5.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { images: fileList },
	chunkSize: 0.5 * FileAPI.MB,
	chunkUploadRetry: 3
});
```

--

<a name="options.imageTransform"></a>
### imageTransform`:Object`
Правила модификации оригинально изображения.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	// Changes the original image
	imageTransform: {
		// Ресайз по боьшой строне
		maxWidth: 800,
		maxHeight: 600,
		// Добавляем водяной знак
		overlay: [{ x: 10, y: 10, src: '/i/watemark.png', rel: FileAPI.Image.RIGHT_BOTTOM }]
	}
});
```

--

<a name="options.imageTransform-multi"></a>
### imageTransform`:Object`
Правила для нарезки дополнительных изображения на клиенте.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	imageTransform: {
		// Ресайз по большой строне
		'huge': { maxWidth: 800, maxHeight: 600 },
		// Ресайз и кроп
		'medium': { width: 320, height: 240, preview: true },
		// ресайз и кроп + водяной знак
		'small': {
			width: 100, height: 100,
			// Добавляем водяной знак
			overlay: [{ x: 5, y: 5, src: '/i/watemark.png', rel: FileAPI.Image.RIGHT_BOTTOM }]
		}
	}
});
```

--

<a name="options.imageTransform-jpeg"></a>
### imageTransform`:Object`
Конвертация всех изображений в jpeg или png.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	imageTransform: {
		type: 'image/jpeg',
		quality: 0.86 // качество jpeg
	}
});
```

<a name="options.imageOriginal"></a>
### imageOriginal`:Boolean`
Отправлять исходное изображение на сервер или нет, если определен `imageTransform` вариант.

--

<a name="options.imageAutoOrientation"></a>
### imageAutoOrientation`:Boolean`
Автоматический поворот изображения на основе EXIF.

--

<a name="options.prepare"></a>
### prepare`:Function`
Подготовка опций загрузки для конкретного файла.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	prepare: function (file/**Object*/, options/**Object*/){
		options.data.secret = utils.getSecretKey(file.name);
	}
});
```

--

<a name="options.upload"></a>
### upload`:Function`
Начало загрузки

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	upload: function (xhr/**Object*/, options/**Object*/){
		// ...
	}
});
```

--

<a name="options.fileupload"></a>
### fileupload`:Function`
Начало загрузки файла

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	fileupload: function (file/**Object*/, xhr/**Object*/, options/**Object*/){
		// ...
	}
});
```

--

<a name="options.progress"></a>
### progress`:Function`
Общий прогресс загрузки файлов.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	progress: function (evt/**Object*/, file/**Object*/, xhr/**Object*/, options/**Object*/){
		var pr = evt.loaded/evt.total * 100;
	}
});
```

--

<a name="options.fileprogress"></a>
### fileprogress`:Function`
Прогресс загрузки файла.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	fileprogress: function (evt/**Object*/, file/**Object*/, xhr/**Object*/, options/**Object*/){
		var pr = evt.loaded/evt.total * 100;
	}
});
```

--

<a name="options.complete"></a>
### complete`:Function`
Завершение загрузки всех файлов.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	complete: function (err/**String*/, xhr/**Object*/, file/**Object/, options/**Object*/){
		if( !err ){
			// Все файлы загружены успешно
		}
	}
});
```

--

<a name="options.filecomplete"></a>
### filecomplete`:Function`
Конец загрузки файла.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	filecomplete: function (err/**String*/, xhr/**Object*/, file/**Object/, options/**Object*/){
		if( !err ){
			// Файл загружен успешно
			var result = xhr.responseText;
		}
	}
});
```

---

<a name="File"></a>
## File object

<a name="File.name"></a>
### name
Имя файла.

<a name="File.type"></a>
### type
MIME type

<a name="File.size"></a>
### size
Размер файла в байтах.


---


<a name="FileAPI.event"></a>
## FileAPI.event

<a name="FileAPI.event.on"></a>
### on(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Добавить функцию обработки события.

* el — DOM элемент.
* events — одно или нескольких разделенных пробелами типов событий.
* handler — функция обработчик события.

---

<a name="FileAPI.event.off"></a>
### off(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Удалить обработчик события.

* el — DOM элемент
* events — одно или нескольких разделенных пробелами типов событий.
* handler — функции обработчика ранее назначения на `event`.

---

<a name="FileAPI.event.one"></a>
### one(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Добавить функцию обработки события. Обработчик выполняется не более одного раза.

* el — DOM элемент.
* events — одно или нескольких разделенных пробелами типов событий.
* handler — функция обработчик события.

---

<a name="FileAPI.event.dnd"></a>
### dnd(el`:HTMLElement`, hover`:Function`, handler`:Function`)`:void`
Добавить функцию обработки событий `drag` и `drop`.

* el — DOM элемент
* hover — `dragenter` и `dragleave` слушатель
* handler — обработчик события `drop`

```js
var el = document.getElementById('dropzone');
FileAPI.event.dnd(el, function (over){
	el.style.backgroundColor = over ? '#f60': '';
}, function (files){
	if( files.length ){
		// Загружаем их.
	}
});

// или jQuery
$('#dropzone').dnd(hoverFn, dropFn);
```

---

<a name="FileAPI.event.dnd.off"></a>
### dnd.off(el`:HTMLElement`, hover`:Function`, handler`:Function`)`:void`
Удалить функцию обработки событий `drag` и `drop`.

* el — DOM элемент
* hover — `dragenter` и `dragleave` слушатель
* handler — обработчик события `drop`

```js
// Native
FileAPI.event.dnd.off(el, hoverFn, dropFn);

// jQuery
$('#dropzone').dndoff(hoverFn, dropFn);
```

--

<a name="FileAPI.Image"></a>
## FileAPI.Image
Класс для работы с изображениями

### constructor(file`:Object`)`:void`
Конструктор получает только один параметр, файл.

* file — файл изображения

```js
FileAPI.Image(imageFile).get(function (err/**String*/, img/**HTMLElement*/){
	if( !err ){
		document.body.appendChild( img );
	}
});
```

---

<a name="FileAPI.Image.crop"></a>
### crop(width`:Number`, height`:Number`)`:FileAPI.Image`
Кроп изображения по ширине и высоте.

* width — новая ширина изображения
* height — новая высота изображения

```js
FileAPI.Image(imageFile)
	.crop(640, 480)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

### crop(x`:Number`, y`:Number`, width`:Number`, height`:Number`)`:FileAPI.Image`
Кроп изображения по ширине и высоте, а также смещению по x и y.

* x — смещение относительно по x левого угла
* y — смещение относительно по y левого угла

```js
FileAPI.Image(imageFile)
	.crop(100, 50, 320, 240)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.resize"></a>
### resize(width`:Number`, height`:Number`[, strategy`:String`])`:FileAPI.Image`
Ресайз.

* width — новая ширина
* height — новая высота
* strategy — enum: `min`, `max`, `preview`, `width`, `height`. По умолчанию `undefined`.

```js
FileAPI.Image(imageFile)
	.resize(320, 240)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;

// По большей стороне
FileAPI.Image(imageFile)
	.resize(320, 240, 'max')
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;

// По заданной высоте.
FileAPI.Image(imageFile)
	.resize(240, 'height')
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.preview"></a>
### preview(width`:Number`[, height`:Number`])`:FileAPI.Image`
Кроп и ресайз изображения.

* width — новая ширина
* height — новая высота

```js
FileAPI.Image(imageFile)
	.preview(100, 100)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.rotate"></a>
### rotate(deg`:Number`)`:FileAPI.Image`
Поворот.

* deg — угол поворота в градусах

```js
FileAPI.Image(imageFile)
	.rotate(90)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.filter"></a>
### filter(callback`:Function`)`:FileAPI.Image`
Применить фильтр функцию. Только `HTML5`.

* callback — принимает два рагумента, `canvas` элемент и метод `done`.

```js
FileAPI.Image(imageFile)
	.filter(function (canvas/**HTMLCanvasElement*/, doneFn/**Function*/){
		// бла-бла-бла
		doneFn(); // вызываем по завершению
	})
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```


---

### filter(name`:String`)`:FileAPI.Image`
Используется [CamanJS](http://camanjs.com/), подключите его перед библиотекой FileAPI.

* name — название CamanJS фильтра (произвольный, либо предустановленный)

```js
Caman.Filter.register("my-funky-filter", function () {
	// http://camanjs.com/guides/#Extending
});

FileAPI.Image(imageFile)
	.filter("my-funky-filter") // или .filter("vintage")
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.overlay"></a>
### overlay(images`:Array`)`:FileAPI.Image`
Добавить наложение, например: водяной знак.

* images — массив наложений

```js
FileAPI.Image(imageFile)
	.overlay([
		// Левый угл.
		{ x: 10, y: 10, w: 100, h: 10, src: '/i/watermark.png' },

		// Правый нижний угл.
		{ x: 10, y: 10, src: '/i/watermark.png', rel: FileAPI.Image.RIGHT_BOTTOM }
	])
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

<a name="FileAPI.Image.get"></a>
### get(fn`:Function`)`:FileAPI.Image`
Получить итоговое изображение.

* fn — функция обратного вызова

---

<a name="FileAPI.Camera"></a>
## FileAPI.Camera
Для работы с веб-камерой, обязательно установить параметр `FileAPI.media: true`.


<a name="FileAPI.Camera.publish"></a>
### publish(el`:HTMLElement`, options`:Object`, callback`:Function`)`:void`
Публикация камеры.

* el — куда публикуем
* options — { `width: 100%`, `height: 100%`, `start: true` }
* callback — первый параметр возможная ошибка, второй экземпляр FileAPI.Camera

```js
var el = document.getElementById('cam');
FileAPI.Camera.publish(el, { width: 320, height: 240 }, function (err, cam/**FileAPI.Camera*/){
	if( !err ){
		// Камера готова, можно использовать
	}
});
```

---

<a name="FileAPI.Camera.start"></a>
### start(callback`:Function`)`:void`
Включить камеру

* callback — будет вызван в момент готовности камеры

```js
var el = document.getElementById('cam');
FileAPI.Camera.publish(el, { start: false }, function (err, cam/**FileAPI.Camera*/){
	if( !err ){
		// Включаем камеру
		cam.start(function (err){
			if( !err ){
				// камера готова к использованию
			}
		});
	}
});
```

---

<a name="FileAPI.Camera.stop"></a>
### stop()`:void`
Выключить камеру

---

<a name="FileAPI.Camera.shot"></a>
### shot()`:FileAPI.Image`
Сделать снимок с камеры

```js
var el = document.getElementById('cam');
FileAPI.Camera.publish(el, function (err, cam/**FileAPI.Camera*/){
	if( !err ){
		var shot = cam.shot(); // делаем снимок

		// создаем предпросмотр 100x100
		shot.preview(100).get(function (err, img){
			previews.appendChild(img);
		});

		// и/или загружаем
		FileAPI.upload({
			url: '...',
			files: { cam: shot
		});
	}
});
```

---


<a name="const" data-name="Сonst"></a>
## Константы

<a name="FileAPI.KB"></a>
### FileAPI.KB`:Number`
1024 байт

<a name="FileAPI.MB"></a>
### FileAPI.MB`:Number`
1048576 байт

<a name="FileAPI.GB"></a>
### FileAPI.GB`:Number`
1073741824 байт

<a name="FileAPI.TB"></a>
### FileAPI.TB`:Number`
1.0995116e+12 байт

---

<a name="FileAPI.utils"></a>
## Utils

<a name="FileAPI.each"></a>
### FileAPI.each(obj`:Object|Array`, callback`:Function`[, thisObject`:Mixed`])`:void`
Перебор объект или массив, выполняя функцию для каждого элемента.

* obj — массив или объект
* callback — функция, выполняется для каждого элемента.
* thisObject — объект для использования в качестве `this` при выполнении `callback`.

--

<a name="FileAPI.extend"></a>
### FileAPI.extend(dst`:Object`, src`:Object`)`:Object`
Объединить содержимое двух объектов вместе.

* dst — объект, который получит новые свойства
* src — объект, содержащий дополнительные свойства для объединения

--

<a name="FileAPI.filter"></a>
### FileAPI.filter(array`:Array`, callback`:Function`[, thisObject`:Mixed`)`:Object`
Создает новый массив со всеми элементами, которые соответствуют условиям.

* array — оригинальный массив
* callback — функция для проверки каждого элемента массива.
* thisObject — объект для использования в качестве `this` при выполнении `callback`.

---

<a name="support"><a/>
## Support
<ul>
	<li>Multiupload: все браузеры поддерживающие HTML5 или Flash</li>
	<li>Drag'n'Drop загрузка: файлы (HTML5) и директории (Chrome 21+)</li>
	<li>Загрузка файлов по частям, только HTML5</li>
	<li>Загрузка одно файла: все браузеры, даже очень старые</li>
	<li>
		Работа с изображениями: IE6+, FF 3.6+, Chrome 10+, Opera 11.1+, Safari 5.4+
		<ul>
			<li>crop, resize, preview & rotate (HTML5 или Flash)</li>
			<li>авто ориентация на основе EXIF (HTML5, если подключен FileAPI.exif.js или Flash)</li>
		</ul>
	</li>
</ul>

<a name="FileAPI.support.html5"></a>
### FileAPI.support.html5`:Boolean`
Поддержка HTML5.

<a name="FileAPI.support.cors"></a>
### FileAPI.support.cors`:Boolean`
Поддержка кроссдоменных запросов.

<a name="FileAPI.support.dnd"></a>
### FileAPI.support.dnd`:Boolean`
Поддержка Drag'n'drop событий.

<a name="FileAPI.support.flash"></a>
### FileAPI.support.flash`:Boolean`
Наличие Flash плагина.

<a name="FileAPI.support.canvas"></a>
### FileAPI.support.canvas`:Boolean`
Поддержка canvas.

<a name="FileAPI.support.dataURI"></a>
### FileAPI.support.dataURI`:Boolean`
Поддержка dataURI в качестве src для изображений.

<a name="FileAPI.support.chunked"></a>
### FileAPI.support.chunked`:Boolean`
Возможность загрузки по частям.

---

<a name="flash"></a>
## Flash
Флеш очень "глючная" штука :]
Поэтому в случае успешной загрузки http status должен быть только `200 OK`.

<a name="flash.settings"></a>
### Settings
Настройки для flash части.
Желательно, разместить flash на том же сервере, куда будут загружаться файлы.

```html
<script>
	var FileAPI = {
	 	// @default: "./dist/"
		staticPath: '/js/',

		 // @default: FileAPI.staticPath + "FileAPI.flash.swf"
		flashUrl: '/statics/FileAPI.flash.swf',

		// @default: FileAPI.staticPath + "FileAPI.flash.image.swf"
		flashImageUrl: '/statics/FileAPI.flash.image.swf'
	};
</script>
<script src="/js/FileAPI.min.js"></script>
```

---

<a name="crossdomain.xml"></a>
### crossdomain.xml
Обязательно создайте этот файл на сервере, куда будут загружаться файлы.
Не забудьте заменить `youdomain.com` на имя вашего домена.

```xml
<?xml version="1.0"?>
<!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
	<site-control permitted-cross-domain-policies="all"/>
	<allow-access-from domain="youdomain.com" secure="false"/>
	<allow-access-from domain="*.youdomain.com" secure="false"/>
	<allow-http-request-headers-from domain="*" headers="*" secure="false"/>
</cross-domain-policy>
```

---

<a name="flash.request"></a>
### request
Пример запроса, который отправляет flash player.

```xml
POST /server/ctrl.php HTTP/1.1
Accept: text/*
Content-Type: multipart/form-data;
boundary=----------Ij5ae0ae0KM7GI3KM7
User-Agent: Shockwave Flash
Host: www.youdomain.com
Content-Length: 421
Connection: Keep-Alive
Cache-Control: no-cache

------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Filename"

MyFile.jpg
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Filedata"; filename="MyFile.jpg"
Content-Type: application/octet-stream

[[..FILE_DATA_HERE..]]
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Upload"

Submit Query
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7--
```

---

<a name="server"></a>
## Server settings

<a name="server.iframe"></a>
### IFrame/JSONP

```php
<script>
(function (ctx, jsonp){
	'use strict';
	var status = {{httpStatus}}, statusText = "{{httpStatusText}}", response = "{{responseBody}}";
	try {
		ctx[jsonp](status, statusText, response);
	} catch (e){
		var data = "{\"id\":\""+jsonp+"\",\"status\":"+status+",\"statusText\":\""+statusText+"\",\"response\":\""+response.replace(/\"/g, '\\\\\"')+"\"}";
		try {
			ctx.postMessage(data, document.referrer);
		} catch (e){}
	}
})(window.parent, '{{request_param_callback}}');
</script>

<!-- or -->

<?php
	include './FileAPI.class.php';

	if( strtoupper($_SERVER['REQUEST_METHOD']) == 'POST' ){
		// Получим список файлов
		$files	= FileAPI::getFiles();

		// ... ваша логика

		// JSONP callback name
		$jsonp	= isset($_REQUEST['callback']) ? trim($_REQUEST['callback']) : null;

		// Ответ сервера: "HTTP/1.1 200 OK"
		FileAPI::makeResponse(array(
			  'status' => FileAPI::OK
			, 'statusText' => 'OK'
			, 'body' => array('count' => sizeof($files))
		), $jsonp);
		exit;
	}
?>
```

---

<a name="server.CORS"></a>
### CORS
Включение CORS.

```php
<?php
	// Permitted types of request
    header('Access-Control-Allow-Methods: POST, OPTIONS');

    // Describe custom headers
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Range, Content-Disposition, Content-Type');

    // A comma-separated list of domains
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);

    if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
        exit;
    }

    if( $_SERVER['REQUEST_METHOD'] == 'POST' ){
        // ...
    }
```

---

<a name="server.chunked"></a>
### Chunked file upload
Всё общение между клиентом и сервером ведётся на уровне HTTP заголовков.<br/>
Для передачи отдельного chunk'а клиент устанавливает заголовки:<br/>
<ul>
	<li>Content-Range: bytes &lt;start-offset>-&lt;end-offset>/&lt;total></li>
	<li>Content-Disposition: attachment; filename=&lt;file-name></li>
</ul>
Другие заголовки не используются, отслеживание уникальности имени передаваемого файла не реализуется и оставлено на усмотрение разработчика.<br/>
В ответ на передаваемый chunk сервер может отвечать следующими кодами:<br/>
<ul>
	<li>200, 201 — chunk сохранён успешно</li>
	<li>416, 500 — восстановимая ошибка</li>
</ul>
Остальные коды — фатальная ошибка, требуется вмешательство пользователя.



---

## Buttons examples

### Base
Простой input[type="file"]

```html
<span class="js-fileapi-wrapper" style="position: relative; display: inline-block;">
    <input name="files" type="file" multiple/>
</span>
```

---

### Button
Стилизованная кнопка.

```html
<style>
.upload-btn {
    width: 130px;
    height: 25px;
    overflow: hidden;
    position: relative;
    border: 3px solid #06c;
    border-radius: 5px;
    background: #0cf;

}
    .upload-btn:hover {
        background: #09f;
    }
    .upload-btn__txt {
        z-index: 1;
        position: relative;
        color: #fff;
        font-size: 18px;
        font-family: "Helvetica Neue";
        line-height: 24px;
        text-align: center;
        text-shadow: 0 1px 1px #000;
    }
    .upload-btn input {
        top: -10px;
        right: -40px;
        z-index: 2;
        position: absolute;
        cursor: pointer;
        opacity: 0;
        filter: alpha(opacity=0);
        font-size: 50px;
    }
</style>
<div class="upload-btn js-fileapi-wrapper">
    <div class="upload-btn__txt">Upload files</div>
    <input name="files" type="file" multiple />
</div>
```

---

### Link
Кнопка в виде ссылки

```html
<style>
.upload-link {
    color: #36c;
    display: inline-block;
    *zoom: 1;
    *display: inline;
    overflow: hidden;
    position: relative;
    padding-bottom: 2px;
    text-decoration: none;
}
    .upload-link__txt {
        z-index: 1;
        position: relative;
        border-bottom: 1px dotted #36c;
    }
        .upload-link:hover .upload-link__txt {
            color: #f00;
            border-bottom-color: #f00;
        }

    .upload-link input {
        top: -10px;
        right: -40px;
        z-index: 2;
        position: absolute;
        cursor: pointer;
        opacity: 0;
        filter: alpha(opacity=0);
        font-size: 50px;
    }
</style>
<a class="upload-link js-fileapi-wrapper">
    <span class="upload-link__txt">Upload photo</span>
    <input name="photo" type="file" accept="image/*" />
</a>
```




