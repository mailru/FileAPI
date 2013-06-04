package ru.mail.utils
{

	import flash.utils.ByteArray;
 
	/**
	 * Get data from exif. 
	 * Only orientation tag
	 * If need something else, add tags.
	 *  
	 */	
	public class ExifReader2 
	{
		private var m_data:ByteArray = new ByteArray();
		private var m_exif:Object = new Object;
		private var m_exifKeys:Array = new Array();
 
		private var m_intel:Boolean=true;
		private var m_loc:uint=0;		
		
		private var DATASIZES:Object = new Object;
		private var TAGS:Object = new Object; 

		public function getKeys():Array{
			return m_exifKeys;
		}
		public function hasKey(key:String):Boolean{
			return m_exif[key] != undefined;
		}
		public function getValue(key:String):Object{
			if(m_exif[key] == undefined) return null;
			return m_exif[key];
		}
 
		public function ExifReader2(){
			DATASIZES[1] = 1;
			DATASIZES[2] = 1;
			DATASIZES[3] = 2;
			DATASIZES[4] = 4;
			DATASIZES[5] = 8;
			DATASIZES[6] = 1;			
			DATASIZES[7] = 1;
			DATASIZES[8] = 2;
			DATASIZES[9] = 4;
			DATASIZES[10] = 8;
			DATASIZES[11] = 4;
			DATASIZES[12] = 8; 

			TAGS[0x0112] = 'Orientation';
 
			//... add more if you like.
			//See http://park2.wakwak.com/~tsuruzoh/Computer/Digicams/exif-e.html
		}
 

		public function processData( data:ByteArray ):Boolean {
			
			m_data = data ;
			m_data.position = 0 ;	
			
			var iter:int=0;
 
			//confirm JPG type
			if(!(m_data.readUnsignedByte()==0xff && m_data.readUnsignedByte()==0xd8)) 
				return false ;
			
			//Locate APP1 MARKER
			var ff:uint=0;
			var marker:uint=0;
			for(iter=0;iter<5;++iter){	//cap iterations
				ff = m_data.readUnsignedByte();
				marker = m_data.readUnsignedByte();
				var size:uint = (m_data.readUnsignedByte()<<8) + m_data.readUnsignedByte();
				if(marker == 0x00e1) break;
				else{
					for(var x:int=0;x<size-2;++x) m_data.readUnsignedByte();
				}
			}
			//Confirm APP1 MARKER
			if(!(ff == 0x00ff && marker==0x00e1)) return false ;	
 
			//Confirm EXIF header
			var i:uint;
			var exifHeader:Array = [0x45,0x78,0x69,0x66,0x0,0x0];
			for(i=0; i<6;i++) {if(exifHeader[i] != m_data.readByte()) return false;}
 
			//Read past TIFF header
			m_intel = (m_data.readByte() != 0x4d);
		
			m_data.readByte();	//redundant
			for(i=0; i<6;i++) {m_data.readByte();}	//read rest of TIFF header
 
			//Read IFD data
			m_loc = 8;
			readIFD(0);
			
			return true ;
		}
 
		//EXIF data is composed of 'IFD' fields.  You have IFD0, which is the main picture data.
		//IFD1 contains thumbnail data.  There are also sub-IFDs inside IFDs, notably inside IFD0.
		//The sub-IFDs will contain a lot of additional EXIF metadata.
		//readIFD(int) will help read all of these such fields.
		private function readIFD(ifd:int):void{
			var iter:int=0;
 
			// Read number of entries
			var numEntries:uint;
			if(m_intel) numEntries = m_data.readUnsignedByte() + (m_data.readUnsignedByte()<<8);
			else numEntries = (m_data.readUnsignedByte()<<8) + (m_data.readUnsignedByte());
			if(numEntries>100) numEntries=100;	//cap entries
 
			m_loc+=2;
			for(iter=0; iter<numEntries;++iter){
				//Read tag
				var tag:uint;
				if(m_intel) tag = (m_data.readUnsignedByte()) + (m_data.readUnsignedByte()<<8);
				else tag = (m_data.readUnsignedByte()<<8) + (m_data.readUnsignedByte());
 
				//read type
				var type:uint;
				if(m_intel) type = (m_data.readUnsignedByte()+(m_data.readUnsignedByte()<<8));
				else type = (m_data.readUnsignedByte()<<8)+(m_data.readUnsignedByte()<<0);
				
				//Read # of components
				var comp:uint;
				if(m_intel) comp = (m_data.readUnsignedByte()+(m_data.readUnsignedByte()<<8) + (m_data.readUnsignedByte()<<16) + (m_data.readUnsignedByte()<<24));
				else comp = (m_data.readUnsignedByte()<<24)+(m_data.readUnsignedByte()<<16) + (m_data.readUnsignedByte()<<8) + (m_data.readUnsignedByte()<<0);
				
				//Read data
				
				var b1:uint = m_data.readUnsignedByte();
				var b2:uint = m_data.readUnsignedByte();
				var b3:uint = m_data.readUnsignedByte();
				var b4:uint = m_data.readUnsignedByte();							
				
				m_loc+=12;
				
				if(TAGS[tag] != undefined){
					//Determine data size
					if(DATASIZES[type] * comp <= 4){
						//data is contained within field
						var data:uint;
						if ( 0x0112 == tag )
						{										
							if(m_intel) data= b1;
							else data = b2;	
						}
						
						m_exif[TAGS[tag]] = data;
						m_exifKeys.push(TAGS[tag]);
					}
				}	
			}
		}
	}
	
}