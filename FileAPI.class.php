<?php
	class FileAPI {
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


		public static function getFiles(){
			self::init();
			return	self::$_files;
		}

	}
