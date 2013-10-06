<?php
	class FileAPI {
		const OK = 200;
		const ERROR = 500;


		private static $_files = null;

		private static function init(){
			if( is_null(self::$_files) ){
				self::$_files = array();

				// http://www.php.net/manual/ru/reserved.variables.files.php#106558
				foreach( $_FILES as $firstNameKey => $arFileDescriptions ){
					foreach( $arFileDescriptions as $fileDescriptionParam => $mixedValue ){
						self::rRestructuringFilesArray(self::$_files, $firstNameKey, $_FILES[$firstNameKey][$fileDescriptionParam], $fileDescriptionParam);
					}
				}
			}
		}


		private static function rRestructuringFilesArray(&$arrayForFill, $currentKey, $currentMixedValue, $fileDescriptionParam){
			if( is_array($currentMixedValue) ){
				foreach( $currentMixedValue as $nameKey => $mixedValue ){
					self::rRestructuringFilesArray($arrayForFill[$currentKey],
											 $nameKey,
											 $mixedValue,
											 $fileDescriptionParam);
				}
			} else {
				$arrayForFill[$currentKey][$fileDescriptionParam] = $currentMixedValue;
			}
		}


		public static function getRequestHeaders(){
			$headers = array();

			foreach( $_SERVER as $key => $value ){
				if( substr($key, 0, 5) == 'HTTP_' ){
					$header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
					$headers[$header] = $value;
				}
			}

			return $headers;
		}


		public static function getFiles(){
			self::init();
			return	self::$_files;
		}


		public static function makeResponse(array $res, $jsonp = null){
			$body = $res['body'];
			$json = json_encode($body);

			$httpStatus = isset($res['status']) ? $res['status'] : self::OK;
			$httpStatusText  = isset($res['statusText']) ? $res['statusText'] : 'OK';
			$httpHeaders = isset($res['headers']) ? $res['headers'] : array();

			if( empty($jsonp) ){
				header("HTTP/1.1 $httpStatus $httpStatusText");
				foreach( $httpHeaders as $header => $value ){
					header("$header: $value");
				}
				echo $json;
			}
			else {
				echo "<script>"
					. "  (function (ctx, jsonp){"
					. "     'use strict';"
					. "     if( ctx && ctx[jsonp] ){"
					. "        ctx[jsonp]($httpStatus, '$httpStatus', ".addslashes($json).");"
					. "     }"
					. "  })(window.parent, '$jsonp');"
					. "</script>";
			}
		}

	}
