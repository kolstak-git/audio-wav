let decodedBlob=null;
let decodedAudioBuffer=null;
let audioCtx=null;
let currentSource=null;

let echannels = document.getElementById('e-channels');
let ehz = document.getElementById('e-hz');
let ebit = document.getElementById('e-bit');
let ekbps = document.getElementById('e-kbps');
let eframes = document.getElementById('e-frames');

let dchannels = document.getElementById('d-channels');
let dhz = document.getElementById('d-hz');
let dbit = document.getElementById('d-bit');
let dkbps = document.getElementById('d-kbps');
let dframes = document.getElementById('d-frames');

const COMPRESS_URL = 'https://kolstak.com/compress.php';
const DECOMPRESS_URL = 'https://kolstak.com/decompress.php';

async function postBytes(url, bytes, filename){
	const res=await fetch(url,{
		method:'POST',
		headers:{
			'Content-Type':'application/octet-stream',
			'X-Filename': filename || ''
		},
		body:bytes
	});
	if(!res.ok){		
		throw new Error();
	}
	return new Uint8Array(await res.arrayBuffer());
}

function clearPlaybackUI(){
	const b=document.getElementById('dec-btns');
	b.innerHTML='';
}

function stopPlayback(playBtn){
	if(currentSource){
		try{ currentSource.stop(); }catch(e){}
		try{ currentSource.disconnect(); }catch(e){}
		currentSource=null;
	}
	if(playBtn) playBtn.textContent='▶ Play';
}

async function decodeWavForDisplay(bytes){
	if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
	const copy=bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
	return await audioCtx.decodeAudioData(copy);
}

function draw(id, channelData){
	const cv=document.getElementById(id);
	const cx=cv.getContext('2d');
	cv.width=400;
	cv.height=80;
	cx.clearRect(0,0,400,80);

	if(!channelData || !channelData.length) return;

	for(let x=0;x<400;x++){
		const i=Math.min(channelData.length-1,Math.floor(x*channelData.length/400));
		const y=40-(channelData[i]*35);
		cx.fillRect(x,y,1,1);
	}
}

async function onWAV(inp){
	const file=inp.files && inp.files[0];
	if(!file) return;
	
	if(file.size > 30 * 1024 * 1024){
		alert('File too large. Restricted to 30MB');
		inp.value='';
		return;
	}

	clearPlaybackUI();
	document.getElementById('enc-info').textContent='Uploading and compressing...';
	document.getElementById('dec-info').textContent='';
	draw('dec-wv',null);

	try{
		const wavBytes=new Uint8Array(await file.arrayBuffer());
		const audioBuffer=await decodeWavForDisplay(wavBytes);
		
		const meta=getWavMeta(wavBytes);
		const kbps=meta ? getPcmKbps(meta) : '?';

		draw('enc-wv',audioBuffer.getChannelData(0));

		const outBytes=await postBytes(COMPRESS_URL, wavBytes, file.name || 'input.wav');
		const a=document.createElement('a');
		a.href=URL.createObjectURL(new Blob([outBytes],{type:'application/octet-stream'}));
		a.download=(file.name || 'audio').replace(/\.[^.]+$/,'') + '.kol';
		a.click();

		echannels.textContent = meta.channels;
		ehz.textContent = meta.sampleRate;
		ebit.textContent = meta.bitDepth;
		ekbps.textContent = kbps;
		eframes.textContent = (audioBuffer.length).toLocaleString();
		document.getElementById('enc-info').textContent='';
		
	}catch{
		document.getElementById('enc-info').textContent='';
		alert('Compression failed');
	}
}

async function decodeFile(file){
	if(!file) return;

	clearPlaybackUI();
	document.getElementById('dec-info').textContent='Uploading and decoding...';

	try{
		const encBytes=new Uint8Array(await file.arrayBuffer());
		const wavBytes=await postBytes(DECOMPRESS_URL, encBytes, file.name || 'input.kol');
		decodedBlob=new Blob([wavBytes],{type:'audio/wav'});
		decodedAudioBuffer=await decodeWavForDisplay(wavBytes);
		
		const meta=getWavMeta(wavBytes);
		const kbps=meta ? getPcmKbps(meta) : '?';

		draw('dec-wv',decodedAudioBuffer.getChannelData(0));
		
		dchannels.textContent = meta.channels;
		dhz.textContent = meta.sampleRate;
		dbit.textContent = meta.bitDepth;
		dkbps.textContent = kbps;
		dframes.textContent = (decodedAudioBuffer.length).toLocaleString();
		document.getElementById('dec-info').textContent='';

		const b=document.getElementById('dec-btns');
		b.innerHTML='';

		const play=document.createElement('button');
		play.className='primary';
		play.textContent='▶ Play';
		play.onclick=async ()=>{
			try{
				stopPlayback(play);
				if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
				if(audioCtx.state==='suspended') await audioCtx.resume();

				const src=audioCtx.createBufferSource();
				src.buffer=decodedAudioBuffer;
				src.connect(audioCtx.destination);
				src.onended=()=>{ if(currentSource===src) stopPlayback(play); };
				currentSource=src;
				play.textContent='Playing...';
				src.start();
			}catch{
				stopPlayback(play);
				alert('Playback failed');
			}
		};

		const stop=document.createElement('button');
		stop.textContent='■ Stop';
		stop.onclick=()=>stopPlayback(play);

		const dl=document.createElement('button');
		dl.textContent='Download WAV';
		dl.onclick=()=>{
			const a=document.createElement('a');
			a.href=URL.createObjectURL(decodedBlob);
			a.download='decoded.wav';
			a.click();
		};

		b.appendChild(play);
		b.appendChild(stop);
		b.appendChild(dl);
	}catch{
		document.getElementById('dec-info').textContent='';
		alert('Decompression failed');
	}
}

function getWavMeta(bytes){
	const v=new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if(bytes.length < 36) return null;

	return {
		channels: v.getUint16(22, true),
		sampleRate: v.getUint32(24, true),
		bitDepth: v.getUint16(34, true)
	};
}

function getPcmKbps(meta){
	return ((meta.sampleRate * meta.bitDepth * meta.channels) / 1000).toFixed(0);
}

window.addEventListener('load',()=>{
	const dz=document.getElementById('dz');

	window.addEventListener('dragover',e=>e.preventDefault());
	window.addEventListener('drop',e=>e.preventDefault());

	dz.addEventListener('dragover',e=>{
		e.preventDefault();
		dz.classList.add('over');
	});

	dz.addEventListener('dragleave',()=>{
		dz.classList.remove('over');
	});

	dz.addEventListener('drop',e=>{
		e.preventDefault();
		dz.classList.remove('over');
		const file=e.dataTransfer.files[0];
		if(file) decodeFile(file);
	});
});
